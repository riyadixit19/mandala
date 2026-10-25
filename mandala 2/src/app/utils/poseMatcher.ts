// utils/poseMatcher.ts
// Compares the user's joint angles with the target pose and explains the biggest difference.
// The reference angles come from the illustrated character (figure/poseRig.ts), so what she shows
// on screen is exactly what gets checked.

import { Keypoint } from '../types/yoga.types';
import { calculateAngle } from './angleCalculator';
import { Joints, jointsFor, hasFigure, POSE_SPECS } from '../figure/poseRig';

type Side = 'left' | 'right';
type FeatureKind = 'elbow' | 'shoulder' | 'hip' | 'knee' | 'torso' | 'thigh';

interface Feature {
  kind: FeatureKind;
  side?: Side;
  value: number;
}

export interface MatchResult {
  /** 0-1, how close the user is to the target */
  score: number;
  /** enough of the body is visible to judge */
  visible: boolean;
  /** the single most useful correction, if any */
  hint: string | null;
}

const IDX = {
  left: { sh: 11, el: 13, wr: 15, hip: 23, kn: 25, an: 27 },
  right: { sh: 12, el: 14, wr: 16, hip: 24, kn: 26, an: 28 },
};

const WEIGHT: Record<FeatureKind, number> = { torso: 1.5, hip: 1.2, knee: 1.2, thigh: 1, shoulder: 0.9, elbow: 0.5 };

// The app is made for children with Down syndrome. Low muscle tone (hypotonia) and loose ligaments
// make deep bends, raised arms and balancing hard to hold, so the check is deliberately forgiving.
// It also allows for camera error: 2D angles from MediaPipe are typically 6-10 degrees off a lab
// measurement, and elbows are the least reliable joint.

/** Degrees off the target that still count as perfect, per joint. */
const TOLERANCE: Record<FeatureKind, number> = { torso: 20, hip: 22, knee: 22, thigh: 20, shoulder: 25, elbow: 40 };
/** Degrees past the tolerance where a joint scores zero. */
const SPAN: Record<FeatureKind, number> = { torso: 55, hip: 60, knee: 60, thigh: 55, shoulder: 65, elbow: 75 };
/** Each joint at rest: body upright, arms and legs hanging straight down. */
const NEUTRAL: Record<FeatureKind, number> = { torso: 0, hip: 180, knee: 180, thigh: 0, shoulder: 0, elbow: 180 };
/**
 * Missing the target toward the resting position (bending the knees less, arms a little lower,
 * folding or tilting less) is what tired, low-tone muscles do, so that error counts for less.
 * Missing it the other way (arms too high, bending too far) counts in full.
 */
const EASIER_DIRECTION = 0.6;
/** Most degrees the easier-direction allowance can forgive. Kept small for the thigh, which tells standing from lying down. */
const MAX_RELIEF: Record<FeatureKind, number> = { torso: 25, hip: 25, knee: 25, thigh: 12, shoulder: 25, elbow: 20 };
const MIN_VISIBILITY = 0.5;

/** Torso tilt from vertical: 0 upright, 90 horizontal, 180 upside down. */
const torsoTilt = (kps: Keypoint[]) => {
  const sx = (kps[11].x + kps[12].x) / 2, sy = (kps[11].y + kps[12].y) / 2;
  const hx = (kps[23].x + kps[24].x) / 2, hy = (kps[23].y + kps[24].y) / 2;
  return (Math.atan2(Math.abs(sx - hx), hy - sy) * 180) / Math.PI;
};

/** Thigh direction: 0 pointing down, 90 sideways, 180 up. Tells standing from lying, lunging or kicking. */
const thighTilt = (hip: Keypoint, knee: Keypoint) =>
  (Math.atan2(Math.abs(knee.x - hip.x), knee.y - hip.y) * 180) / Math.PI;

function features(kps: Keypoint[], checkVisibility: boolean): Feature[] {
  const ok = (...ids: number[]) => !checkVisibility || ids.every(i => (kps[i]?.score ?? 0) >= MIN_VISIBILITY);
  const out: Feature[] = [];
  if (ok(11, 12, 23, 24)) out.push({ kind: 'torso', value: torsoTilt(kps) });
  (['left', 'right'] as Side[]).forEach(side => {
    const i = IDX[side];
    if (ok(i.sh, i.el, i.wr)) out.push({ kind: 'elbow', side, value: calculateAngle(kps[i.sh], kps[i.el], kps[i.wr]) });
    if (ok(i.el, i.sh, i.hip)) out.push({ kind: 'shoulder', side, value: calculateAngle(kps[i.el], kps[i.sh], kps[i.hip]) });
    if (ok(i.sh, i.hip, i.kn)) out.push({ kind: 'hip', side, value: calculateAngle(kps[i.sh], kps[i.hip], kps[i.kn]) });
    if (ok(i.hip, i.kn)) out.push({ kind: 'thigh', side, value: thighTilt(kps[i.hip], kps[i.kn]) });
    if (ok(i.hip, i.kn, i.an)) out.push({ kind: 'knee', side, value: calculateAngle(kps[i.hip], kps[i.kn], kps[i.an]) });
  });
  return out;
}

/** Turns the character's joints into a MediaPipe-style keypoint list. */
function rigToKeypoints(j: Joints, swap: boolean): Keypoint[] {
  const kps: Keypoint[] = Array.from({ length: 33 }, () => ({ x: 0, y: 0, score: 1 }));
  const put = (i: number, p: [number, number]) => (kps[i] = { x: p[0], y: p[1], score: 1 });
  const L = swap ? 'r' : 'l', R = swap ? 'l' : 'r';
  const g = (k: string) => (j as any)[k] as [number, number];
  put(11, g(L + 's')); put(12, g(R + 's'));
  put(13, g(L + 'e')); put(14, g(R + 'e'));
  put(15, g(L + 'h')); put(16, g(R + 'h'));
  put(23, g(L + 'p')); put(24, g(R + 'p'));
  put(25, g(L + 'k')); put(26, g(R + 'k'));
  put(27, g(L + 'f')); put(28, g(R + 'f'));
  return kps;
}

const refCache = new Map<string, [Feature[], Feature[]]>();
function referenceFeatures(pose: string): [Feature[], Feature[]] {
  let ref = refCache.get(pose);
  if (!ref) {
    const j = jointsFor(pose);
    ref = [features(rigToKeypoints(j, false), false), features(rigToKeypoints(j, true), false)];
    refCache.set(pose, ref);
  }
  return ref;
}

const key = (f: Feature) => `${f.kind}:${f.side ?? ''}`;

function hintFor(f: Feature, ref: number): string {
  const side = f.side ? `${f.side} ` : '';
  const tooSmall = f.value < ref;
  switch (f.kind) {
    // short, simple words: these are read by children, in big letters
    case 'knee': return tooSmall ? `Make your ${side}leg straight` : `Bend your ${side}knee more`;
    case 'elbow': return tooSmall ? `Make your ${side}arm straight` : `Bend your ${side}arm`;
    case 'shoulder': return tooSmall ? `Lift your ${side}arm up` : `Bring your ${side}arm down`;
    case 'thigh': return tooSmall ? `Lift your ${side}leg up` : `Bring your ${side}leg down`;
    case 'hip': return tooSmall ? 'Lift your chest up a little' : 'Bend over a little more';
    case 'torso': return tooSmall ? 'Lean over like the picture' : 'Stand up taller';
  }
}

function compare(user: Feature[], ref: Feature[]) {
  const refMap = new Map(ref.map(f => [key(f), f.value]));
  let total = 0, weight = 0;
  let worst: { f: Feature; ref: number; cost: number } | null = null;
  let cap = 1;
  for (const f of user) {
    const r = refMap.get(key(f));
    if (r === undefined) continue;
    const raw = Math.abs(f.value - r);
    const n = NEUTRAL[f.kind];
    const easier = Math.sign(f.value - r) === Math.sign(n - r) && raw <= Math.abs(n - r);
    const err = easier ? raw - Math.min(raw * (1 - EASIER_DIRECTION), MAX_RELIEF[f.kind]) : raw;
    // one badly wrong core joint means it's a different pose, however good the rest looks
    if ((f.kind === 'torso' || f.kind === 'thigh') && err > 45) cap = Math.min(cap, 0.6);
    if ((f.kind === 'hip' || f.kind === 'knee') && err > 55) cap = Math.min(cap, 0.6);
    if (f.kind === 'shoulder' && err > 75) cap = Math.min(cap, 0.68);
    const tol = TOLERANCE[f.kind];
    const sim = Math.max(0, 1 - Math.max(0, err - tol) / SPAN[f.kind]);
    const w = WEIGHT[f.kind];
    total += sim * w;
    weight += w;
    const cost = err * w;
    if (err > tol + 8 && (!worst || cost > worst.cost)) worst = { f, ref: r, cost };
  }
  return { score: weight ? Math.min(cap, total / weight) : 0, weight, worst };
}

/** Scores the user's keypoints against the target pose. */
export function matchPose(kps: Keypoint[], targetPose: string): MatchResult {
  if (!kps || kps.length < 29 || !hasFigure(targetPose)) return { score: 0, visible: false, hint: null };
  const user = features(kps, true);
  // need the torso plus most limbs to make a fair call
  const visible = user.some(f => f.kind === 'torso') && user.length >= 6;
  if (!visible) return { score: 0, visible: false, hint: null };

  // the pose can be done facing either way or on either leg, so try both sides
  const [direct, swapped] = referenceFeatures(targetPose);
  const a = compare(user, direct);
  const b = compare(user, swapped);
  const best = a.score >= b.score ? a : b;
  return {
    score: best.score,
    visible: true,
    hint: best.worst ? hintFor(best.worst.f, best.worst.ref) : null,
  };
}

/**
 * Which pose the user is closest to, or null if nothing is close enough.
 * Used for the "Camera sees" label so it always agrees with the form check.
 */
export function closestPose(kps: Keypoint[], minScore = 0.78): { pose: string; score: number } | null {
  if (!kps || kps.length < 29) return null;
  const user = features(kps, true);
  if (!user.some(f => f.kind === 'torso') || user.length < 6) return null;
  let best: { pose: string; score: number } | null = null;
  for (const name of Object.keys(POSE_SPECS)) {
    if (name === 'Unknown Pose') continue;
    const [d, sw] = referenceFeatures(name);
    const score = Math.max(compare(user, d).score, compare(user, sw).score);
    if (!best || score > best.score) best = { pose: name, score };
  }
  return best && best.score >= minScore ? best : null;
}

/** Exposed for testing: scores one reference pose against another. */
export function _compareReferencePoses(a: string, b: string): number {
  const ua = referenceFeatures(a)[0];
  const [d, s] = referenceFeatures(b);
  return Math.max(compare(ua, d).score, compare(ua, s).score);
}
