// utils/temporalSmoothing.ts
import { Keypoint } from '../types/yoga.types';

const SMOOTHING_FACTOR = 0.3; // Adjust between 0-1 (higher = more smoothing)

export class KeypointSmoother {
  private history: Map<number, Keypoint> = new Map();

  smooth(keypoints: Keypoint[]): Keypoint[] {
    return keypoints.map((kp, idx) => {
      const prev = this.history.get(idx);

      if (!prev) {
        this.history.set(idx, { ...kp });
        return kp;
      }

     const prevScore = prev.score ?? 0.5;
     const currScore = kp.score ?? 0.5;

      // Apply Exponential Moving Average
      const smoothed = {
        x: prev.x + SMOOTHING_FACTOR * (kp.x - prev.x),
        y: prev.y + SMOOTHING_FACTOR * (kp.y - prev.y),
        score: prevScore + SMOOTHING_FACTOR * (currScore - prevScore),
        name: kp.name
      };

      this.history.set(idx, smoothed);
      return smoothed;
    });
  }

  reset() {
    this.history.clear();
  }
}