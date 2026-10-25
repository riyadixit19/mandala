'use client';

import React, { useCallback, useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { CircleHelp, AlertCircle, RotateCw } from 'lucide-react';
import { Keypoint, PoseDataItem } from './types/yoga.types';
import { POSES_JSON_PATH, CONFIDENCE_PRESETS, ConfidenceLevel, CHECK_SECONDS, HOLD_SECONDS } from './constants/yoga.constants';
import { loadPoseModel, loadPosesData } from './utils/dataLoader';
import { drawSkeleton } from './utils/skeletonDrawer';
import { playSuccessSound, playCompleteSound, unlockAudio } from './utils/soundUtils';
import { KeypointSmoother } from './utils/temporalSmoothing';
import { PoseStabilizer } from './utils/poseStabilizer';
import { calculatePoseQuality } from './utils/scaleInvariant';
import { matchPose, closestPose, MatchResult } from './utils/poseMatcher';
import { PracticeSession, SessionView } from './utils/practiceSession';
import CameraControls from './components/CameraControls';
import PosePanel from './components/PosePanel';
import PoseLibrary from './components/PoseLibrary';
import HelpModal from './components/HelpModal';
import SessionOverlay from './components/SessionOverlay';
import { LogoMark, Wordmark } from './components/brand/Logo';

/** A detection result older than this is treated as "nobody in frame" */
const STALE_FRAME_MS = 700;

const YogaPoseDetector: React.FC = () => {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const landmarkerRef = useRef<any>(null);
  const smootherRef = useRef(new KeypointSmoother());
  const stabilizerRef = useRef(new PoseStabilizer());
  const sessionRef = useRef(new PracticeSession(CHECK_SECONDS * 1000, HOLD_SECONDS * 1000));
  const targetRef = useRef<HTMLDivElement | null>(null);

  const [isLoading, setIsLoading] = useState(true);
  const [isModelLoaded, setIsModelLoaded] = useState(false);
  const [error, setError] = useState('');
  const [isCameraOn, setIsCameraOn] = useState(false);
  const [isCameraLoading, setIsCameraLoading] = useState(false);
  const [facingMode, setFacingMode] = useState<'user' | 'environment'>('user');
  const [zoom, setZoom] = useState(1);
  // true when the camera itself can zoom; otherwise the picture is zoomed on screen
  const [hardwareZoom, setHardwareZoom] = useState(false);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [confidenceLevel, setConfidenceLevel] = useState<ConfidenceLevel>('low');
  const [currentPose, setCurrentPose] = useState('Unknown');
  const [poseCount, setPoseCount] = useState(0);
  const [posesData, setPosesData] = useState<PoseDataItem[]>([]);
  const [selectedPoseIndex, setSelectedPoseIndex] = useState<number | null>(null);
  const [isHelpOpen, setIsHelpOpen] = useState(false);
  const [qualityScore, setQualityScore] = useState(0);
  const [sessionView, setSessionView] = useState<SessionView | null>(null);

  const targetName = selectedPoseIndex !== null ? posesData[selectedPoseIndex]?.name ?? null : null;
  const threshold = CONFIDENCE_PRESETS[confidenceLevel].value;

  // FIX: the detection loop reads these through refs. Before, it captured them in a closure and had
  // to be torn down and restarted every time a pose was detected, and the overlay used stale values.
  const targetNameRef = useRef<string | null>(null);
  const thresholdRef = useRef(threshold);
  const soundRef = useRef(soundEnabled);
  const frameRef = useRef<{ t: number; match: MatchResult } | null>(null);
  targetNameRef.current = targetName;
  thresholdRef.current = threshold;
  soundRef.current = soundEnabled;

  // Load model
  useEffect(() => {
    const cancelled = { current: false };
    loadPoseModel(setIsLoading, setIsModelLoaded, setError, landmarkerRef, cancelled);
    return () => {
      cancelled.current = true;
      landmarkerRef.current?.close?.();
      landmarkerRef.current = null;
    };
  }, []);

  // FIX: turn the camera off when leaving the page (e.g. going back to the home screen).
  // Before, the camera light stayed on until the tab was closed.
  useEffect(() => {
    const video = videoRef.current;
    return () => {
      (video?.srcObject as MediaStream | null)?.getTracks().forEach(t => t.stop());
    };
  }, []);

  // Load poses JSON
  useEffect(() => {
    loadPosesData(POSES_JSON_PATH, setPosesData, setError);
  }, []);

  const resetSession = useCallback(() => {
    sessionRef.current.reset(performance.now());
    frameRef.current = null;
    setSessionView(null);
  }, []);

  // A new target or strictness starts the practice over
  useEffect(() => {
    resetSession();
  }, [targetName, confidenceLevel, resetSession]);

  // Camera control functions
  const startCamera = async (requestedFacingMode?: 'user' | 'environment') => {
    unlockAudio();
    try {
      setIsCameraLoading(true);
      setError('');
      const mode = requestedFacingMode ?? facingMode;
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { width: { ideal: 1280 }, height: { ideal: 720 }, facingMode: mode },
        audio: false,
      });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.onloadedmetadata = async () => {
          try {
            await videoRef.current?.play();
            setIsCameraOn(true);
            setIsCameraLoading(false);
            setFacingMode(mode);
            const track = stream.getVideoTracks()[0];
            const caps = (track as any)?.getCapabilities?.();
            setHardwareZoom(!!caps && 'zoom' in caps);
            setZoom(1);
            smootherRef.current.reset();
            stabilizerRef.current.reset();
            resetSession();
          } catch (playErr) {
            console.error('Video play error', playErr);
            setError('The camera started but the video could not play. Try again or reload the page.');
            setIsCameraLoading(false);
          }
        };
      }
    } catch (err) {
      console.error('Camera start error', err);
      setError('Mandala could not open your camera. Check that camera access is allowed for this site.');
      setIsCameraLoading(false);
    }
  };

  const stopCamera = useCallback(() => {
    if (videoRef.current?.srcObject) {
      (videoRef.current.srcObject as MediaStream).getTracks().forEach(t => t.stop());
      videoRef.current.srcObject = null;
    }
    setIsCameraOn(false);
    setCurrentPose('Unknown');
    setQualityScore(0);
    smootherRef.current.reset();
    stabilizerRef.current.reset();
    resetSession();
    const canvas = canvasRef.current;
    canvas?.getContext('2d')?.clearRect(0, 0, canvas.width, canvas.height);
  }, [resetSession]);

  const switchCamera = async () => {
    if (!isCameraOn) return;
    if (videoRef.current?.srcObject) {
      (videoRef.current.srcObject as MediaStream).getTracks().forEach(t => t.stop());
    }
    await startCamera(facingMode === 'user' ? 'environment' : 'user');
  };

  // FIX: zoom used to be applied twice on phones (camera zoom and on-screen zoom together).
  // Now the camera's own zoom is used when it has one, which also helps tracking because the
  // model sees the zoomed picture. Otherwise the picture is zoomed on screen.
  const handleZoom = async (direction: 'in' | 'out' | 'reset') => {
    let newZoom = zoom;
    if (direction === 'in') newZoom = Math.min(+(zoom + 0.1).toFixed(1), 2);
    else if (direction === 'out') newZoom = Math.max(+(zoom - 0.1).toFixed(1), 0.5);
    else newZoom = 1;

    if (hardwareZoom) {
      const track = (videoRef.current?.srcObject as MediaStream | null)?.getVideoTracks()[0];
      const caps = (track as any)?.getCapabilities?.();
      if (track && caps?.zoom) {
        newZoom = Math.min(Math.max(newZoom, caps.zoom.min ?? 1), caps.zoom.max ?? newZoom);
        try {
          await track.applyConstraints({ advanced: [{ zoom: newZoom } as any] });
        } catch (err) {
          console.warn('Camera zoom failed', err);
          return;
        }
      }
    }
    setZoom(newZoom);
  };

  const reloadModel = (clearError = true) => {
    if (clearError) setError('');
    setIsModelLoaded(false);
    landmarkerRef.current?.close?.();
    landmarkerRef.current = null;
    loadPoseModel(setIsLoading, setIsModelLoaded, setError, landmarkerRef);
  };

  const handleSelectPose = (index: number) => {
    setSelectedPoseIndex(index);
    if (typeof window !== 'undefined' && window.innerWidth < 1024) {
      targetRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  const nextPose = () => {
    if (!posesData.length) return;
    setSelectedPoseIndex(i => (i === null ? 0 : (i + 1) % posesData.length));
  };

  // Detection loop: runs once per camera session
  useEffect(() => {
    if (!isCameraOn || !isModelLoaded) return;

    let raf = 0;
    let lastVideoTime = -1;
    let errorCount = 0;
    let frameCount = 0;
    let lastPose = '';
    let lastQuality = -1;
    let keypoints: Keypoint[] = [];
    const MAX_ERRORS = 3;
    const FRAME_INTERVAL = 2; // run the model on every 2nd frame (~30 fps on a 60 Hz screen)

    const draw = () => {
      const m = frameRef.current?.match;
      drawSkeleton(canvasRef.current, videoRef.current, keypoints, !!m?.visible && m.score >= thresholdRef.current);
    };

    const loop = () => {
      raf = requestAnimationFrame(loop);
      frameCount++;
      const video = videoRef.current;
      const landmarker = landmarkerRef.current;
      if (!video || !landmarker || video.readyState < 2 || video.videoWidth === 0) return;
      if (frameCount % FRAME_INTERVAL !== 0 || video.currentTime === lastVideoTime) {
        draw();
        return;
      }
      lastVideoTime = video.currentTime;

      try {
        const result = landmarker.detectForVideo(video, performance.now());
        errorCount = 0;
        const lm = result?.landmarks?.[0];

        if (!lm || lm.length === 0) {
          keypoints = [];
          smootherRef.current.reset();
          frameRef.current = { t: performance.now(), match: { score: 0, visible: false, hint: null } };
          if (lastPose !== 'No pose detected') {
            lastPose = 'No pose detected';
            setCurrentPose(lastPose);
          }
        } else {
          const raw: Keypoint[] = lm.map((p: any, i: number) => ({
            x: (p.x ?? 0) * video.videoWidth,
            y: (p.y ?? 0) * video.videoHeight,
            score: p.visibility ?? 0.5,
            name: `kp${i}`,
          }));
          keypoints = smootherRef.current.smooth(raw);

          // what the camera thinks it sees (shown in the side panel), using the same angle
          // comparison as the form check so the two always agree
          const near = closestPose(keypoints);
          const stable = stabilizerRef.current.addDetection(near?.pose ?? 'Unknown Pose', near?.score ?? 0);
          const seen = stable.stable ? stable.pose : lastPose || 'Unknown';
          if (seen !== lastPose) {
            lastPose = seen;
            setCurrentPose(seen);
          }

          const q = Math.round(calculatePoseQuality(keypoints) * 100);
          if (Math.abs(q - lastQuality) >= 3) {
            lastQuality = q;
            setQualityScore(q);
          }

          // how close the user is to the chosen pose
          const target = targetNameRef.current;
          frameRef.current = {
            t: performance.now(),
            match: target ? matchPose(keypoints, target) : { score: 0, visible: false, hint: null },
          };
        }
      } catch (e) {
        errorCount++;
        console.error(`[Detection Error] (${errorCount}/${MAX_ERRORS})`, e);
        if (errorCount >= MAX_ERRORS) {
          cancelAnimationFrame(raf);
          stopCamera();
          setError('Pose tracking stopped working, so it was restarted. Start the camera again to continue.');
          setTimeout(() => reloadModel(false), 1000);
          return;
        }
      }
      draw();
    };

    raf = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf);
  }, [isCameraOn, isModelLoaded]);

  // Practice session clock: hold 5 s -> check -> 15 s timer
  useEffect(() => {
    if (!isCameraOn || !targetName) return;
    const id = window.setInterval(() => {
      const now = performance.now();
      const f = frameRef.current;
      const frame = f && now - f.t < STALE_FRAME_MS ? f.match : null;
      const { view, events } = sessionRef.current.update(now, frame, thresholdRef.current);
      setSessionView(view);
      if (events.includes('correct')) playSuccessSound(soundRef.current);
      if (events.includes('complete')) {
        playCompleteSound(soundRef.current);
        setPoseCount(c => c + 1);
      }
    }, 100);
    return () => window.clearInterval(id);
  }, [isCameraOn, targetName]);

  const mirrored = facingMode === 'user';
  const cssZoom = hardwareZoom ? 1 : zoom;

  return (
    <div className="relative min-h-screen overflow-x-hidden bg-gradient-to-br from-[#F6F9F5] via-[#E6EFE8] to-[#D2E3D8] text-ink">
      {/* the flower, very large and faint, behind everything */}
      <LogoMark
        className="pointer-events-none fixed -right-48 -top-48 h-[40rem] w-[40rem] text-pine/[0.06]"
        strokeWidth={0.9}
      />

      <header className="relative">
        <div className="mx-auto flex h-20 max-w-7xl items-center justify-between gap-4 px-4 sm:px-6">
          <Link href="/" className="rounded-lg" aria-label="Mandala home">
            <Wordmark />
          </Link>
          <button
            onClick={() => setIsHelpOpen(true)}
            className="inline-flex h-10 items-center gap-2 rounded-full bg-white/60 px-4 text-sm font-medium text-ink backdrop-blur hover:bg-white transition-colors"
          >
            <CircleHelp size={18} />
            <span className="hidden sm:inline">How it works</span>
          </button>
        </div>
      </header>

      <main className="relative mx-auto max-w-7xl space-y-6 px-4 pb-8 pt-2 sm:px-6">
        {error && (
          <div role="alert" className="flex flex-wrap items-center gap-3 rounded-2xl bg-rust-soft/90 px-5 py-3.5 text-[15px] text-rust">
            <AlertCircle size={18} className="shrink-0" />
            <p className="flex-1">{error}</p>
            {!isModelLoaded && !isLoading && (
              <button onClick={() => reloadModel()} className="inline-flex items-center gap-1.5 font-semibold underline-offset-2 hover:underline">
                <RotateCw size={15} />
                Reload model
              </button>
            )}
          </div>
        )}

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-[minmax(0,1fr)_360px]">
          {/* Camera */}
          <section aria-label="Camera" className="pt-card p-2">
            <div className="relative overflow-hidden rounded-[1.35rem] bg-ink" style={{ aspectRatio: '4 / 3' }}>
              <div
                className="absolute inset-0"
                style={{
                  transform: `scale(${(mirrored ? -1 : 1) * cssZoom}, ${cssZoom})`,
                  transformOrigin: 'center center',
                  transition: 'transform 0.2s ease-out',
                }}
              >
                <video ref={videoRef} className="h-full w-full object-cover" playsInline muted />
                {/* object-cover on both keeps the skeleton lined up with the cropped video */}
                <canvas ref={canvasRef} className="pointer-events-none absolute inset-0 h-full w-full object-cover" />
              </div>

              {!isCameraOn && (
                <div className="absolute inset-0 flex items-center justify-center p-6">
                  <div className="max-w-sm text-center">
                    {isLoading || isCameraLoading ? (
                      <>
                        <span className="mx-auto mb-4 block h-6 w-6 rounded-full border-2 border-white/20 border-t-white animate-spin" aria-hidden />
                        <p className="font-display text-2xl text-white sm:text-3xl">{isLoading ? 'Loading the pose tracker' : 'Starting camera'}</p>
                        <p className="mt-2 text-[15px] text-white/60">
                          {isLoading ? 'This takes a few seconds the first time.' : 'Allow camera access if your browser asks.'}
                        </p>
                      </>
                    ) : isModelLoaded ? (
                      <>
                        <p className="font-display text-3xl text-white sm:text-4xl">Ready when you are</p>
                        <p className="mt-2 text-[15px] leading-relaxed text-white/65">
                          {targetName
                            ? 'Start the camera below, then step back until your whole body is in the frame.'
                            : 'Pick a pose from the library, then start the camera below.'}
                        </p>
                      </>
                    ) : (
                      <p className="text-[15px] text-white/60">The pose tracker isn&apos;t available.</p>
                    )}
                  </div>
                </div>
              )}

              {isCameraOn && targetName && (
                <span className="absolute left-4 top-4 rounded-full bg-ink/50 px-3.5 py-1.5 text-sm font-medium text-white backdrop-blur">
                  {targetName}
                </span>
              )}

              {isCameraOn && qualityScore > 0 && qualityScore < 55 && sessionView?.phase !== 'complete' && (
                <span className="absolute right-4 top-4 rounded-full bg-ink/50 px-3.5 py-1.5 text-sm text-white backdrop-blur">
                  Step back a little
                </span>
              )}

              {isCameraOn && (
                <SessionOverlay
                  view={sessionView}
                  targetName={targetName}
                  threshold={threshold}
                  onRestart={resetSession}
                  onNextPose={nextPose}
                />
              )}
            </div>

            <CameraControls
              isModelLoaded={isModelLoaded}
              isCameraOn={isCameraOn}
              isCameraLoading={isCameraLoading}
              soundEnabled={soundEnabled}
              zoom={zoom}
              confidenceLevel={confidenceLevel}
              onStartCamera={startCamera}
              onStopCamera={stopCamera}
              onSwitchCamera={switchCamera}
              onToggleSound={() => setSoundEnabled(s => !s)}
              onZoom={handleZoom}
              onConfidenceLevelChange={setConfidenceLevel}
            />
          </section>

          <div ref={targetRef} className="scroll-mt-4">
            <PosePanel
              posesData={posesData}
              selectedPoseIndex={selectedPoseIndex}
              currentPose={currentPose}
              poseCount={poseCount}
              isCameraOn={isCameraOn}
              view={sessionView}
            />
          </div>
        </div>

        <PoseLibrary posesData={posesData} selectedPoseIndex={selectedPoseIndex} onSelectPose={handleSelectPose} />

        <footer className="flex items-center justify-center gap-2 pt-2 text-sm text-muted">
          <LogoMark className="h-4 w-4 text-pine/70" strokeWidth={5} />
          Pose tracking runs in your browser. Your camera video is not uploaded.
        </footer>
      </main>

      <HelpModal isOpen={isHelpOpen} onClose={() => setIsHelpOpen(false)} />
    </div>
  );
};

export default YogaPoseDetector;
