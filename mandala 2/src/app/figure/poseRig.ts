// figure/poseRig.ts
// A tiny 2D rig for the illustrated character. Each pose is a set of absolute
// limb angles (0 = pointing down, 90 = right, 180 = up, -90 = left).
// Joints are computed with forward kinematics, then fitted onto the ground line.

export type Pt = [number, number];

export interface PoseSpec {
  /** 'f' = facing the viewer, 's' = side view */
  v: 'f' | 's';
  /** side view only: 1 = facing right, -1 = facing left */
  face?: 1 | -1;
  /** spine angle, pelvis -> neck */
  sp: number;
  /** spine foreshortening (0-1) */
  ss?: number;
  /** spine curve: + bends toward the back, - toward the belly */
  bend?: number;
  /** neck angle, neck -> head centre (defaults to spine angle) */
  nk?: number;
  /** arms: [upper, fore]. In side view "l" is the far side */
  la: [number, number];
  ra: [number, number];
  /** legs: [thigh, shin] */
  ll: [number, number];
  rl: [number, number];
}

export interface Joints {
  p: Pt; n: Pt; c: Pt; h: Pt;
  ls: Pt; le: Pt; lh: Pt;
  rs: Pt; re: Pt; rh: Pt;
  lp: Pt; lk: Pt; lf: Pt;
  rp: Pt; rk: Pt; rf: Pt;
  up: Pt;     // unit vector, neck -> head
  faceX: number; // -1..1 how far the face is turned sideways
}

export const LEN = { spine: 40, neck: 19, upper: 20, fore: 19, thigh: 27, shin: 26 };
export const SIZE = { head: 14.5, foot: 5, hand: 3.8 };
const GROUND = 178;
const VIEW = 200;

const rad = (d: number) => (d * Math.PI) / 180;
const dir = (deg: number): Pt => [Math.sin(rad(deg)), Math.cos(rad(deg))];
const add = (a: Pt, b: Pt, s = 1): Pt => [a[0] + b[0] * s, a[1] + b[1] * s];

export function computeJoints(spec: PoseSpec): Joints {
  const p: Pt = [0, 0];
  const sd = dir(spec.sp);
  const n = add(p, sd, LEN.spine * (spec.ss ?? 1));
  // perpendicular to the spine, toward the figure's back for side view
  const perp: Pt = [sd[1], -sd[0]];
  const mid = add(p, sd, LEN.spine * (spec.ss ?? 1) * 0.5);
  const c = add(mid, perp, (spec.bend ?? 0) * (spec.face ?? 1));
  const nd = dir(spec.nk ?? spec.sp);
  const h = add(n, nd, LEN.neck);

  const front = spec.v === 'f';
  const sw = front ? 9 : 0;
  const hw = front ? 6 : 0;
  const sh = front ? n : add(n, sd, -4);
  const ls = add(sh, perp, sw);
  const rs = add(sh, perp, -sw);
  const lp = add(p, perp, hw);
  const rp = add(p, perp, -hw);

  const le = add(ls, dir(spec.la[0]), LEN.upper);
  const lh = add(le, dir(spec.la[1]), LEN.fore);
  const re = add(rs, dir(spec.ra[0]), LEN.upper);
  const rh = add(re, dir(spec.ra[1]), LEN.fore);
  const lk = add(lp, dir(spec.ll[0]), LEN.thigh);
  const lf = add(lk, dir(spec.ll[1]), LEN.shin);
  const rk = add(rp, dir(spec.rl[0]), LEN.thigh);
  const rf = add(rk, dir(spec.rl[1]), LEN.shin);

  return {
    p, n, c, h, ls, le, lh, rs, re, rh, lp, lk, lf, rp, rk, rf,
    up: nd.map(v => -v) as Pt, // placeholder, fixed below
    faceX: front ? 0 : (spec.face ?? 1),
  };
}

const POINT_KEYS = ['p', 'n', 'c', 'h', 'ls', 'le', 'lh', 'rs', 're', 'rh', 'lp', 'lk', 'lf', 'rp', 'rk', 'rf'] as const;

/** Moves and scales the joints so the figure stands on the ground, centred. */
export function fitJoints(j: Joints): Joints {
  const pad: Record<string, number> = { h: SIZE.head + 9, lf: SIZE.foot + 1, rf: SIZE.foot + 1, lh: SIZE.hand, rh: SIZE.hand, lk: 6, rk: 6, p: 9, n: 10, c: 10, le: 4, re: 4 };
  let minX = Infinity, maxX = -Infinity, minY = Infinity, maxY = -Infinity;
  for (const k of POINT_KEYS) {
    const [x, y] = j[k];
    const r = pad[k] ?? 5;
    // the bun sits above the head, so give the head a little extra room upward only
    minX = Math.min(minX, x - r); maxX = Math.max(maxX, x + r);
    minY = Math.min(minY, y - r); maxY = Math.max(maxY, y + (k === 'h' ? SIZE.head : r));
  }
  const w = maxX - minX;
  const hgt = maxY - minY;
  const s = Math.min(1, (VIEW - 16) / w, (GROUND - 8) / hgt);
  const cx = (minX + maxX) / 2;
  const tx = VIEW / 2 - cx * s;
  const ty = GROUND - maxY * s;
  const out = { ...j } as Joints;
  for (const k of POINT_KEYS) {
    out[k] = [j[k][0] * s + tx, j[k][1] * s + ty];
  }
  (out as any).scale = s;
  const dx = out.h[0] - out.n[0];
  const dy = out.h[1] - out.n[1];
  const len = Math.hypot(dx, dy) || 1;
  out.up = [dx / len, dy / len];
  return out;
}

export function lerpJoints(a: Joints, b: Joints, t: number): Joints {
  const out = { ...b } as Joints;
  for (const k of POINT_KEYS) {
    out[k] = [a[k][0] + (b[k][0] - a[k][0]) * t, a[k][1] + (b[k][1] - a[k][1]) * t];
  }
  out.faceX = a.faceX + (b.faceX - a.faceX) * t;
  (out as any).scale = (a as any).scale + ((b as any).scale - (a as any).scale) * t;
  const dx = out.h[0] - out.n[0];
  const dy = out.h[1] - out.n[1];
  const len = Math.hypot(dx, dy) || 1;
  out.up = [dx / len, dy / len];
  return out;
}

// ---------------------------------------------------------------------------
// Pose library. Keys match the pose names used by the classifier and posesData.json.
// ---------------------------------------------------------------------------
export const POSE_SPECS: Record<string, PoseSpec> = {
  'Mountain Pose': { v: 'f', sp: 180, la: [-6, -3], ra: [6, 3], ll: [-2, -1], rl: [2, 1] },
  'Tree Pose': { v: 'f', sp: 180, la: [-158, -168], ra: [158, 168], ll: [-62, 58], rl: [1, 0] },
  'Triangle Pose': { v: 'f', sp: 112, nk: 125, la: [195, 195], ra: [8, 8], ll: [-32, -32], rl: [32, 32] },
  'Warrior I': { v: 's', face: 1, sp: 180, la: [172, 174], ra: [177, 179], ll: [-55, -55], rl: [80, 0] },
  'Warrior II': { v: 'f', sp: 180, la: [-90, -90], ra: [90, 90], ll: [-52, -52], rl: [75, 2] },
  'Warrior III': { v: 's', face: 1, sp: 92, la: [88, 90], ra: [92, 92], ll: [-88, -88], rl: [0, 0] },
  'Chair Pose': { v: 's', face: 1, sp: 158, la: [154, 156], ra: [158, 160], ll: [58, -18], rl: [62, -22] },
  'Cobra Pose': { v: 's', face: 1, sp: 148, bend: 4, nk: 160, la: [-30, 22], ra: [-35, 18], ll: [-91, -92], rl: [-89, -90] },
  'Downward Dog': { v: 's', face: 1, sp: 56, nk: 42, la: [54, 54], ra: [56, 56], ll: [-28, -28], rl: [-31, -31] },
  'Upward Dog': { v: 's', face: 1, sp: 148, bend: 5, nk: 168, la: [-2, 0], ra: [2, 2], ll: [-82, -86], rl: [-80, -84] },
  "Child's Pose": { v: 's', face: 1, sp: 96, bend: -4, nk: 78, la: [72, 86], ra: [70, 84], ll: [62, -90], rl: [58, -90] },
  'Cat Pose': { v: 's', face: 1, sp: 106, bend: -9, nk: 62, la: [-2, 0], ra: [2, 2], ll: [-2, -90], rl: [2, -88] },
  'Cow Pose': { v: 's', face: 1, sp: 106, bend: 8, nk: 150, la: [-2, 0], ra: [2, 2], ll: [-2, -90], rl: [2, -88] },
  'Bridge Pose': { v: 's', face: -1, sp: 62, nk: 90, la: [-90, -90], ra: [-88, -88], ll: [-102, -8], rl: [-98, -4] },
  'Camel Pose': { v: 's', face: 1, sp: -128, bend: 6, nk: -112, la: [6, 8], ra: [10, 12], ll: [2, -90], rl: [6, -88] },
  'Boat Pose': { v: 's', face: 1, sp: -150, nk: -168, la: [88, 90], ra: [92, 92], ll: [132, 132], rl: [136, 136] },
  'Seated Forward Bend': { v: 's', face: 1, sp: 104, bend: -5, nk: 86, la: [92, 92], ra: [94, 94], ll: [90, 90], rl: [90, 90] },
  'Half Lord of the Fishes': { v: 'f', sp: 180, nk: 165, la: [130, 168], ra: [25, 15], ll: [82, -98], rl: [150, 8] },
  'Fish Pose': { v: 's', face: -1, sp: 112, bend: 6, nk: 50, la: [-35, -90], ra: [-32, -88], ll: [-90, -90], rl: [-92, -92] },
  'Shoulder Stand': { v: 's', face: -1, sp: 12, nk: 90, la: [-90, 170], ra: [-88, 175], ll: [178, 178], rl: [182, 182] },
  'Plow Pose': { v: 's', face: -1, sp: 22, nk: 90, la: [-90, -90], ra: [-88, -88], ll: [62, 62], rl: [66, 66] },
  'Bow Pose': { v: 's', face: 1, sp: 118, bend: 6, nk: 138, la: [-128, -118], ra: [-124, -114], ll: [-112, 170], rl: [-108, 172] },
  'Locust Pose': { v: 's', face: 1, sp: 108, bend: 3, nk: 118, la: [-102, -100], ra: [-98, -96], ll: [-106, -106], rl: [-103, -103] },
  'Crow Pose': { v: 's', face: 1, sp: 52, nk: 72, la: [6, 0], ra: [10, 2], ll: [56, -118], rl: [60, -112] },
  'Side Plank': { v: 'f', sp: 120, la: [178, 180], ra: [0, 0], ll: [-60, -60], rl: [-60, -60] },
  'Plank Pose': { v: 's', face: 1, sp: 115, nk: 112, la: [-2, -2], ra: [2, 2], ll: [-64, -64], rl: [-65, -65] },
  'Low Lunge': { v: 's', face: 1, sp: 176, la: [170, 172], ra: [174, 176], ll: [-25, -90], rl: [85, 0] },
  'High Lunge': { v: 's', face: 1, sp: 166, la: [160, 162], ra: [164, 166], ll: [-55, -55], rl: [78, 0] },
  'Pigeon Pose': { v: 's', face: 1, sp: 172, bend: 4, nk: 172, la: [8, 4], ra: [12, 6], ll: [-88, -89], rl: [84, -100] },
  'Reclined Pigeon Pose': { v: 's', face: -1, sp: 90, nk: 90, la: [150, 230], ra: [160, 220], ll: [-150, -100], rl: [-172, -60] },
  'Happy Baby Pose': { v: 's', face: -1, sp: 90, nk: 90, la: [170, 162], ra: [174, 166], ll: [-140, 180], rl: [-136, 182] },
  'Corpse Pose': { v: 's', face: -1, sp: 90, nk: 90, la: [-92, -90], ra: [-88, -90], ll: [-90, -90], rl: [-90, -90] },
  'Eagle Pose': { v: 'f', sp: 180, la: [135, 175], ra: [-135, -175], ll: [22, -8], rl: [10, -2] },
  'Dancer Pose': { v: 's', face: 1, sp: 118, nk: 112, la: [-150, -112], ra: [120, 125], ll: [-150, 168], rl: [0, 0] },
  'Half Moon Pose': { v: 'f', sp: 72, la: [180, 180], ra: [-2, 0], ll: [-92, -92], rl: [3, 0] },
  'Revolved Triangle Pose': { v: 's', face: 1, sp: 62, nk: 55, la: [180, 180], ra: [0, 0], ll: [-36, -36], rl: [34, 34] },
  'Intense Side Stretch': { v: 's', face: 1, sp: 38, bend: -4, nk: 25, la: [-10, 0], ra: [-6, 4], ll: [-24, -24], rl: [24, 24] },
  'Standing Forward Bend': { v: 's', face: 1, sp: 22, bend: -6, nk: 8, la: [-18, 12], ra: [-14, 16], ll: [0, 0], rl: [2, 2] },
  'Wide-Legged Forward Bend': { v: 'f', sp: 0, ss: 0.45, nk: 0, la: [-26, 18], ra: [26, -18], ll: [-33, -33], rl: [33, 33] },
  'Garland Pose': { v: 'f', sp: 180, la: [-45, 110], ra: [45, -110], ll: [-62, -8], rl: [62, 8] },
  'Head to Knee Pose': { v: 's', face: 1, sp: 102, bend: -5, nk: 86, la: [92, 92], ra: [94, 94], ll: [72, -96], rl: [90, 90] },
  'Cow Face Pose': { v: 'f', sp: 180, la: [-8, 158], ra: [178, -22], ll: [76, -102], rl: [-76, 102] },
  'Hero Pose': { v: 's', face: 1, sp: 180, la: [8, 78], ra: [12, 82], ll: [86, -90], rl: [88, -90] },
  'Reclined Hero Pose': { v: 's', face: 1, sp: -92, nk: -92, la: [-92, -90], ra: [-88, -88], ll: [86, -90], rl: [88, -90] },
  'Lotus Pose': { v: 'f', sp: 180, la: [-18, -48], ra: [18, 48], ll: [76, -112], rl: [-76, 112] },
  'Easy Pose': { v: 'f', sp: 180, la: [-14, -58], ra: [14, 58], ll: [72, -96], rl: [-72, 96] },
  'Staff Pose': { v: 's', face: 1, sp: 180, la: [-2, 0], ra: [2, 2], ll: [90, 90], rl: [90, 90] },
  'Bound Angle Pose': { v: 'f', sp: 180, la: [-14, 12], ra: [14, -12], ll: [-70, 72], rl: [70, -72] },
  'Shoulder Opener Pose': { v: 's', face: 1, sp: 174, bend: 4, nk: 168, la: [-32, -40], ra: [-28, -36], ll: [-2, -2], rl: [2, 2] },
  'Standing Split': { v: 's', face: 1, sp: 18, nk: 6, la: [6, 6], ra: [10, 10], ll: [-162, -162], rl: [0, 0] },
  'King Dancer Pose': { v: 's', face: 1, sp: 128, bend: 6, nk: 150, la: [-170, -150], ra: [-176, -156], ll: [-140, 175], rl: [0, 0] },
  'Half Frog Pose': { v: 's', face: 1, sp: 112, nk: 100, la: [-150, 175], ra: [2, 90], ll: [-90, 140], rl: [-90, -90] },
  'Full Frog Pose': { v: 's', face: 1, sp: 116, bend: 3, nk: 110, la: [-150, 170], ra: [-146, 174], ll: [-92, 138], rl: [-88, 142] },
  'Forearm Stand': { v: 's', face: 1, sp: 2, nk: 6, la: [-4, 90], ra: [2, 92], ll: [180, 180], rl: [178, 178] },
  'Handstand': { v: 'f', sp: 0, nk: 0, la: [-2, -2], ra: [2, 2], ll: [178, 180], rl: [182, 180] },
  'Headstand': { v: 'f', sp: 0, nk: 0, la: [-28, 72], ra: [28, -72], ll: [178, 180], rl: [182, 180] },
  'Scorpion Pose': { v: 's', face: 1, sp: 12, bend: 8, nk: 10, la: [-4, 90], ra: [2, 92], ll: [148, 62], rl: [144, 58] },
  'Firefly Pose': { v: 'f', sp: 180, ss: 0.6, la: [-6, 2], ra: [6, -2], ll: [-98, -100], rl: [98, 100] },
  'Peacock Pose': { v: 's', face: 1, sp: 94, nk: 96, la: [-55, 2], ra: [-50, 4], ll: [-89, -89], rl: [-87, -87] },
  'Side Crow Pose': { v: 's', face: 1, sp: 70, nk: 82, la: [2, 2], ra: [8, 6], ll: [120, 30], rl: [114, 26] },
  'Eight-Angle Pose': { v: 's', face: 1, sp: 92, nk: 100, la: [-4, 0], ra: [4, 4], ll: [74, 80], rl: [78, 84] },
  'Unknown Pose': { v: 'f', sp: 180, la: [-6, -3], ra: [6, 3], ll: [-2, -1], rl: [2, 1] },
};

export const NEUTRAL_POSE = 'Mountain Pose';

const cache = new Map<string, Joints>();
export function jointsFor(name: string): Joints {
  const key = POSE_SPECS[name] ? name : NEUTRAL_POSE;
  let j = cache.get(key);
  if (!j) {
    j = fitJoints(computeJoints(POSE_SPECS[key]));
    cache.set(key, j);
  }
  return j;
}

export const hasFigure = (name: string) => Boolean(POSE_SPECS[name]);
