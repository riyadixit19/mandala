// types/yoga.types.ts
export type Keypoint = {
  x: number;
  y: number;
  score?: number;
  name?: string;
};

export interface PoseClassification {
  pose: string;
  confidence: number;
}

export interface PoseDataItem {
  name: string;
  description: string;
  image?: string;
  keypoints: any[];
  difficulty?: 'Beginner' | 'Intermediate' | 'Advanced';
  benefits?: string[];
}

export type FacingMode = 'user' | 'environment';