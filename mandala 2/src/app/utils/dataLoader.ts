// utils/dataLoader.ts
import { PoseDataItem } from '../types/yoga.types';
import { MODEL_PATH, WASM_PATH } from '../constants/yoga.constants';

// MediaPipe prints harmless startup notes (like "INFO: Created TensorFlow Lite XNNPACK delegate
// for CPU.") through console.error, which makes Next.js show a red error box in development.
// This hides only those INFO notes; every real error still shows.
let consoleFilterInstalled = false;
const hideMediaPipeInfoLogs = () => {
  if (consoleFilterInstalled || typeof window === 'undefined') return;
  consoleFilterInstalled = true;
  const original = console.error;
  console.error = (...args: unknown[]) => {
    if (typeof args[0] === 'string' && args[0].startsWith('INFO:')) return;
    original(...args);
  };
};

export const loadPoseModel = async (
  setIsLoading: (loading: boolean) => void,
  setIsModelLoaded: (loaded: boolean) => void,
  setError: (error: string) => void,
  landmarkerRef: React.MutableRefObject<any>,
  cancelled: { current: boolean } = { current: false }
) => {
  hideMediaPipeInfoLogs();
  try {
    setIsLoading(true);
    
    // Close previous landmarker if exists to free resources
    if (landmarkerRef.current) {
      try {
        await new Promise(resolve => setTimeout(resolve, 100)); // Small delay
        landmarkerRef.current.close?.();
        landmarkerRef.current = null;
      } catch (e) {
        console.warn('Error closing previous landmarker', e);
      }
    }

    const { FilesetResolver, PoseLandmarker } = await import('@mediapipe/tasks-vision');
    const vision = await FilesetResolver.forVisionTasks(WASM_PATH);

    // Use IMAGE mode instead of VIDEO to avoid detectForVideo crashes
    const landmarker = await PoseLandmarker.createFromOptions(vision, {
      baseOptions: {
        modelAssetPath: MODEL_PATH,
        delegate: 'CPU',
      },
      runningMode: 'IMAGE', // Use IMAGE mode instead of VIDEO
      numPoses: 1,
      minPoseDetectionConfidence: 0.25,
      minPosePresenceConfidence: 0.25,
      minTrackingConfidence: 0.25,
    });

    if (cancelled.current) {
      landmarker.close();
      return;
    }

    // Validate landmarker is ready
    if (!landmarker || typeof landmarker.detect !== 'function') {
      throw new Error('Landmarker initialization incomplete - detect method missing');
    }

    // Wrapper that exposes detectForVideo on top of IMAGE mode.
    // FIX: the old wrapper created a brand-new canvas on every frame (slow, lots of garbage) and
    // spread the landmarker with {...landmarker}, which drops its class methods, so close() was
    // lost and old models leaked memory when reloading.
    const frameCanvas = document.createElement('canvas');
    const frameCtx = frameCanvas.getContext('2d', { willReadFrequently: true });
    const wrappedLandmarker = {
      detect: (image: any) => landmarker.detect(image),
      close: () => landmarker.close(),
      // FIX: errors are no longer swallowed here. The old wrapper caught them and returned
      // "no person found", so the app's crash recovery never ran and the camera looked empty forever.
      detectForVideo: (video: HTMLVideoElement, _timestamp: number) => {
        if (!frameCtx) throw new Error('Failed to get canvas context');
        if (frameCanvas.width !== video.videoWidth || frameCanvas.height !== video.videoHeight) {
          frameCanvas.width = video.videoWidth;
          frameCanvas.height = video.videoHeight;
        }
        frameCtx.drawImage(video, 0, 0);
        return landmarker.detect(frameCanvas);
      },
    };

    if (cancelled.current) {
      landmarker.close();
      return;
    }
    landmarkerRef.current = wrappedLandmarker;
    setIsModelLoaded(true);
    console.log('MediaPipe PoseLandmarker loaded successfully in IMAGE mode');
  } catch (e) {
    console.error('Failed to load MediaPipe PoseLandmarker', e);
    const errMsg = e instanceof Error ? e.message : String(e);
    if (!cancelled.current) setError(`The pose tracker could not load (${errMsg}).`);
  } finally {
    // FIX: a cancelled load (React runs effects twice in development) must not mark loading as
    // finished while the real load is still running.
    if (!cancelled.current) setIsLoading(false);
  }
};

export const loadPosesData = async (
  posesJsonPath: string,
  setPosesData: (data: PoseDataItem[]) => void,
  setError: (error: string | ((prev: string) => string)) => void
) => {
  try {
    const res = await fetch(posesJsonPath);
    if (!res.ok) throw new Error('Failed to fetch poses JSON');
    const data = await res.json();

    const filteredData = data.filter((pose: PoseDataItem) =>
      !pose.name.toLowerCase().includes('unknown')
    );
    setPosesData(filteredData);
  } catch (e) {
    console.error(e);
    setError(prev => prev ? prev : 'Failed to load poses data.');
  }
};