// utils/scaleInvariant.ts
import { Keypoint } from '../types/yoga.types';

/** How clearly the body is visible (0-1). Uses only the body landmarks, not the face. */
export const calculatePoseQuality = (kps: Keypoint[]): number => {
  const BODY = [11, 12, 13, 14, 15, 16, 23, 24, 25, 26, 27, 28];
  const scores = BODY.map(i => kps[i]?.score ?? 0);
  const avgScore = scores.reduce((a, b) => a + b, 0) / scores.length;
  const minScore = Math.min(...scores);
  return Math.max(0, Math.min(1, avgScore * 0.7 + minScore * 0.3));
};
