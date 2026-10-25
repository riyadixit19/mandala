// utils/poseStabilizer.ts

const POSE_STABILITY_FRAMES = 3; // Number of frames needed for confirmation
const POSE_SIMILARITY_THRESHOLD = 0.67; // 85% agreement required

export interface StabilizationResult {
  pose: string;
  confidence: number;
  stable: boolean;
}

export class PoseStabilizer {
  private poseHistory: string[] = [];
  private confidenceHistory: number[] = [];

  addDetection(pose: string, confidence: number): StabilizationResult {
    this.poseHistory.push(pose);
    this.confidenceHistory.push(confidence);

    // Keep only recent history
    if (this.poseHistory.length > POSE_STABILITY_FRAMES) {
      this.poseHistory.shift();
      this.confidenceHistory.shift();
    }

    // Check if pose is stable
    if (this.poseHistory.length < POSE_STABILITY_FRAMES) {
      return { pose: 'Unknown', confidence: 0, stable: false };
    }

    // Count occurrences of each pose
    const poseCounts = new Map<string, number>();
    this.poseHistory.forEach(p => {
      poseCounts.set(p, (poseCounts.get(p) || 0) + 1);
    });

    // Find most common pose
    let maxCount = 0;
    let stablePose = 'Unknown';
    poseCounts.forEach((count, pose) => {
      if (count > maxCount) {
        maxCount = count;
        stablePose = pose;
      }
    });

    // Require high agreement
    const agreement = maxCount / this.poseHistory.length;
    const stable = agreement >= POSE_SIMILARITY_THRESHOLD;

    // Average confidence for stable pose
    const avgConfidence = stable
      ? this.confidenceHistory.reduce((a, b) => a + b, 0) / this.confidenceHistory.length
      : 0;

    return { pose: stable ? stablePose : 'Unknown', confidence: avgConfidence, stable };
  }

  reset() {
    this.poseHistory = [];
    this.confidenceHistory = [];
  }
}