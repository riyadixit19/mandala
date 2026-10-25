// utils/poseMatcher.ts
// Compares the user's joint angles with the target pose and explains the biggest difference.
// The reference angles come from the illustrated character (figure/poseRig.ts), so what she shows
// on screen is exactly what gets checked.

import { Keypoint } from '../types/yoga.types';
import { calculateAngle } from './angleCalculator';
import { Joints, jointsFor, hasFigure, POSE_SPECS } from '../figure/poseRig';

type Side = 'left' | 'right';
type FeatureKind = 'elbow' | 'shoulder' | 'hip' | 'knee' | 'torso';

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

const WEIGHT: Record<FeatureKind, number> = { torso: 1.5, hip: 1.2, knee: 1.2, shoulder: 0.9, elbow: 0.5 };
const TOLERANCE = 12; // degrees that count as perfect
const SPAN = 50; // degrees past the tolerance where a joint scores zero
const MIN_VISIBILITY = 0.5;

/** Torso tilt from vertical: 0 upright, 90 horizontal, 180 upside down. */
const torsoTilt = (kps: Keypoint[]) => {
  const sx = (kps[11].x + kps[12].x) / 2, sy = (kps[11].y + kps[12].y) / 2;
  const hx = (kps[23].x + kps[24].x) / 2, hy = (kps[23].y + kps[24].y) / 2;
  return (Math.atan2(Math.abs(sx - hx), hy - sy) * 180) / Math.PI;
};

function features(kps: Keypoint[], checkVisibility: boolean): Feature[] {
  const ok = (...ids: number[]) => !checkVisibility || ids.every(i => (kps[i]?.score ?? 0) >= MIN_VISIBILITY);
  const out: Feature[] = [];
  if (ok(11, 12, 23, 24)) out.push({ kind: 'torso', value: torsoTilt(kps) });
  (['left', 'right'] as Side[]).forEach(side => {
    const i = IDX[side];
    if (ok(i.sh, i.el, i.wr)) out.push({ kind: 'elbow', side, value: calculateAngle(kps[i.sh], kps[i.el], kps[i.wr]) });
    if (ok(i.el, i.sh, i.hip)) out.push({ kind: 'shoulder', side, value: calculateAngle(kps[i.el], kps[i.sh], kps[i.hip]) });
    if (ok(i.sh, i.hip, i.kn)) out.push({ kind: 'hip', side, value: calculateAngle(kps[i.sh], kps[i.hip], kps[i.kn]) });
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
    case 'knee': return tooSmall ? `Straighten your ${side}knee` : `Bend your ${side}knee more`;
    case 'elbow': return tooSmall ? `Straighten your ${side}arm` : `Bend your ${side}elbow more`;
    case 'shoulder': return tooSmall ? `Raise your ${side}arm higher` : `Lower your ${side}arm a little`;
    case 'hip': return tooSmall ? `Open up at your ${side}hip` : `Fold deeper at your ${side}hip`;
    case 'torso': return tooSmall ? 'Tilt your body further, like the picture' : 'Bring your body more upright';
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
    const err = Math.abs(f.value - r);
    // one badly wrong core joint means it's a different pose, however good the rest looks
    if ((f.kind === 'torso' || f.kind === 'hip' || f.kind === 'knee') && err > 45) cap = Math.min(cap, 0.6);
    if (f.kind === 'shoulder' && err > 60) cap = Math.min(cap, 0.68);
    const sim = Math.max(0, 1 - Math.max(0, err - TOLERANCE) / SPAN);
    const w = WEIGHT[f.kind];
    total += sim * w;
    weight += w;
    const cost = err * w;
    if (err > TOLERANCE + 8 && (!worst || cost > worst.cost)) worst = { f, ref: r, cost };
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
