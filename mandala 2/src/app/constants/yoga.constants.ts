// constants/yoga.constants.ts

// Paths
export const POSES_JSON_PATH = '/posesData.json';
export const MODEL_PATH = '/models/pose_landmarker_lite.task';
export const WASM_PATH = '/wasm';

export const ZOOM_LIMITS = {
  min: 0.5,
  max: 2,
  step: 0.1
};

// Match strictness presets (how closely the user's joint angles must match the target pose)
export const CONFIDENCE_PRESETS = {
  // value = minimum match score (0-1) from utils/poseMatcher.ts, calibrated against all 61 poses
  low: { label: 'Relaxed', value: 0.7, color: 'bg-pine' },
  medium: { label: 'Standard', value: 0.78, color: 'bg-pine' },
  high: { label: 'Strict', value: 0.86, color: 'bg-pine' }
} as const;

export type ConfidenceLevel = keyof typeof CONFIDENCE_PRESETS;

// Pose detection thresholds
export const DETECTION_THRESHOLDS = {
  minCriticalVisible: 3,
  minCriticalScore: 0.35,
  minLimbScore: 0.3,
  minAvgConfidence: 0.35,
  minPoseConfidence: 0.5,
  keypointVisibility: 0.2
};

// Skeleton drawing settings (camera overlay)
export const SKELETON_SETTINGS = {
  detectedLine: 'rgba(255, 255, 255, 0.92)',
  searchingLine: 'rgba(255, 255, 255, 0.5)',
  detectedJoint: '#C9843D',
  searchingJoint: 'rgba(255, 255, 255, 0.75)',
};

// MediaPipe connections (body part connections for skeleton)
export const SKELETON_CONNECTIONS: [number, number][] = [
  [11, 13], [13, 15], [12, 14], [14, 16], // Arms
  [11, 12], // Shoulders
  [11, 23], [12, 24], [23, 24], // Torso
  [23, 25], [25, 27], [24, 26], [26, 28], // Legs
  [0, 1], [0, 2], [1, 3], [2, 4] // Face
];

// Sound settings
export const SOUND_SETTINGS = {
  frequency: 800,
  gain: 0.2,
  duration: 0.4
};

// Friendly labels for the strictness control
export const STRICTNESS_LABELS: Record<ConfidenceLevel, { label: string; hint: string }> = {
  low: { label: 'Relaxed', hint: 'Close enough counts. The best place to start for most children.' },
  medium: { label: 'Standard', hint: 'Your shape should clearly match the pose.' },
  high: { label: 'Strict', hint: 'Every joint needs to be close to the picture.' },
};

// Practice timings
export const CHECK_SECONDS = 5;
export const HOLD_SECONDS = 15;

// Library filters
export const POSE_CATEGORIES: { id: string; name: string; poses?: string[] }[] = [
  { id: 'all', name: 'All' },
  { id: 'standing', name: 'Standing', poses: ['Mountain Pose', 'Tree Pose', 'Triangle Pose', 'Warrior I', 'Warrior II', 'Warrior III', 'Chair Pose', 'Eagle Pose', 'Dancer Pose', 'Half Moon Pose', 'Revolved Triangle Pose', 'Intense Side Stretch', 'Standing Forward Bend', 'Wide-Legged Forward Bend', 'Garland Pose', 'Shoulder Opener Pose', 'Standing Split', 'King Dancer Pose', 'High Lunge'] },
  { id: 'seated', name: 'Seated', poses: ['Easy Pose', 'Lotus Pose', 'Hero Pose', 'Staff Pose', 'Boat Pose', 'Seated Forward Bend', 'Head to Knee Pose', 'Bound Angle Pose', 'Half Lord of the Fishes', 'Cow Face Pose'] },
  { id: 'kneeling', name: 'Kneeling', poses: ["Child's Pose", 'Cat Pose', 'Cow Pose', 'Camel Pose', 'Pigeon Pose', 'Low Lunge'] },
  { id: 'floor', name: 'On the floor', poses: ['Cobra Pose', 'Upward Dog', 'Bow Pose', 'Locust Pose', 'Half Frog Pose', 'Full Frog Pose', 'Bridge Pose', 'Fish Pose', 'Happy Baby Pose', 'Corpse Pose', 'Reclined Pigeon Pose', 'Reclined Hero Pose'] },
  { id: 'strength', name: 'Planks', poses: ['Plank Pose', 'Side Plank', 'Downward Dog'] },
  { id: 'advanced', name: 'Inversions and balances', poses: ['Shoulder Stand', 'Plow Pose', 'Headstand', 'Handstand', 'Forearm Stand', 'Scorpion Pose', 'Crow Pose', 'Side Crow Pose', 'Firefly Pose', 'Peacock Pose', 'Eight-Angle Pose'] },
];

/** Names the classifier uses when it hasn't recognised anything */
export const NO_POSE_NAMES = ['Unknown', 'Unknown Pose', 'No pose detected'];
export const isRealPose = (name: string) => !!name && !NO_POSE_NAMES.includes(name);
