import { Keypoint } from '../types/yoga.types';
import { SKELETON_CONNECTIONS, SKELETON_SETTINGS, DETECTION_THRESHOLDS } from '../constants/yoga.constants';

/**
 * Draws the tracked skeleton over the camera feed.
 * `highlighted` turns the joints pink when the user matches the target pose.
 */
export const drawSkeleton = (
  canvas: HTMLCanvasElement | null,
  video: HTMLVideoElement | null,
  keypoints: Keypoint[],
  highlighted: boolean
) => {
  if (!canvas || !video) return;
  const ctx = canvas.getContext('2d');
  if (!ctx) return;

  if (canvas.width !== video.videoWidth || canvas.height !== video.videoHeight) {
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
  }

  ctx.clearRect(0, 0, canvas.width, canvas.height);
  if (!keypoints || keypoints.length === 0) return;

  const detected = highlighted;
  // scale strokes with the video resolution so the overlay looks the same on every camera
  const unit = Math.max(canvas.width, canvas.height) / 640;
  const visible = (k?: Keypoint) => !!k && (k.score ?? 0) > DETECTION_THRESHOLDS.keypointVisibility;

  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';
  ctx.lineWidth = (detected ? 3.5 : 2.5) * unit;
  ctx.strokeStyle = detected ? SKELETON_SETTINGS.detectedLine : SKELETON_SETTINGS.searchingLine;

  ctx.beginPath();
  for (const [a, b] of SKELETON_CONNECTIONS) {
    const kp1 = keypoints[a];
    const kp2 = keypoints[b];
    if (visible(kp1) && visible(kp2)) {
      ctx.moveTo(kp1.x, kp1.y);
      ctx.lineTo(kp2.x, kp2.y);
    }
  }
  ctx.stroke();

  // joints: only the ones that make up the skeleton (skip the many face landmarks)
  const used = new Set(SKELETON_CONNECTIONS.flat());
  const r = (detected ? 4.5 : 3.5) * unit;
  ctx.fillStyle = detected ? SKELETON_SETTINGS.detectedJoint : SKELETON_SETTINGS.searchingJoint;
  for (const i of used) {
    const k = keypoints[i];
    if (!visible(k)) continue;
    ctx.beginPath();
    ctx.arc(k.x, k.y, r, 0, Math.PI * 2);
    ctx.fill();
  }
};
