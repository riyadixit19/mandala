'use client';

import React, { useCallback, useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { Keypoint, PoseDataItem } from './types/yoga.types';
import { POSES_JSON_PATH, CONFIDENCE_PRESETS, ConfidenceLevel, CHECK_SECONDS, HOLD_SECONDS, isRealPose } from './constants/yoga.constants';
import { loadPoseModel, loadPosesData } from './utils/dataLoader';
import { drawSkeleton } from './utils/skeletonDrawer';
import { playSuccessSound, playCompleteSound, unlockAudio } from './utils/soundUtils';
import { KeypointSmoother } from './utils/temporalSmoothing';
import { PoseStabilizer } from './utils/poseStabilizer';
import { calculatePoseQuality } from './utils/scaleInvariant';
import { matchPose, closestPose, MatchResult } from './utils/poseMatcher';
import { PracticeSession, SessionView } from './utils/practiceSession';
import CameraControls, { GrownUpSettings } from './components/CameraControls';
import PosePanel from './components/PosePanel';
import HelpModal from './components/HelpModal';
import CoachMessage from './components/CoachMessage';
import PoseFigure from './figure/PoseFigure';
import { StarCelebration, StarProgressBar } from './components/Stars';
import { addStar, POSES_PER_STAR } from './utils/stars';
import { Routine, findRoutine } from './utils/routines';
import TopBar from './components/TopBar';

/** A detection result older than this is treated as "nobody in frame" */
const STALE_FRAME_MS = 700;
/** In a routine, how long to enjoy a finished pose before the next one starts */
const ROUTINE_PAUSE_MS = 3500;

const YogaPoseDetector: React.FC = () => {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const landmarkerRef = useRef<any>(null);
  const smootherRef = useRef(new KeypointSmoother());
  const stabilizerRef = useRef(new PoseStabilizer());
  const sessionRef = useRef(new PracticeSession(CHECK_SECONDS * 1000, HOLD_SECONDS * 1000));
  const cameraRef = useRef<HTMLElement | null>(null);

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
  // different poses finished since the last star, and the star just earned (shows the celebration)
  const [starPoses, setStarPoses] = useState<string[]>([]);
  const starPosesRef = useRef<Set<string>>(new Set());
  const [newStar, setNewStar] = useState<number | null>(null);
  const [starReason, setStarReason] = useState<string | null>(null);
  // following a routine: which one, which pose we're on, and whether it's finished
  const [routine, setRoutine] = useState<{ r: Routine; step: number; done: boolean } | null>(null);
  const routineRef = useRef(routine);
  routineRef.current = routine;
  const advanceTimer = useRef<number | null>(null);
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

  // /practice?pose=Tree%20Pose picks a pose; /practice?routine=sunny-morning starts a routine
  const urlRead = useRef(false);
  useEffect(() => {
    if (!posesData.length || urlRead.current) return;
    urlRead.current = true;
    const params = new URLSearchParams(window.location.search);
    const id = params.get('routine');
    const r = id ? findRoutine(id) : undefined;
    if (r) {
      setRoutine({ r, step: 0, done: false });
    } else {
      const i = posesData.findIndex(p => p.name === params.get('pose'));
      if (i >= 0) setSelectedPoseIndex(i);
    }
  }, [posesData]);

  // in a routine, the current step decides the pose (and a repeated pose still starts fresh)
  const routineStep = routine?.step;
  const routineDef = routine?.r;
  useEffect(() => {
    if (!routineDef || routineStep === undefined) return;
    const i = posesData.findIndex(p => p.name === routineDef.poses[routineStep]);
    if (i >= 0) setSelectedPoseIndex(i);
    resetSession();
  }, [routineDef, routineStep, posesData, resetSession]);

  const goToStep = useCallback((step: number) => {
    if (advanceTimer.current !== null) window.clearTimeout(advanceTimer.current);
    advanceTimer.current = null;
    setRoutine(cur => cur && { ...cur, step: Math.max(0, Math.min(step, cur.r.poses.length - 1)), done: false });
  }, []);

  useEffect(() => () => {
    if (advanceTimer.current !== null) window.clearTimeout(advanceTimer.current);
  }, []);

  const restartRoutine = () => {
    goToStep(0);
    resetSession();
  };

  const leaveRoutine = () => {
    if (advanceTimer.current !== null) window.clearTimeout(advanceTimer.current);
    setRoutine(null);
    window.history.replaceState(null, '', '/practice');
  };

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

  // hold down / right-click in the pose list: pick the pose, start the camera and show it
  const selectAndGo = (index: number) => {
    setSelectedPoseIndex(index);
    if (!isCameraOn && isModelLoaded && !isCameraLoading) startCamera();
    if (window.innerWidth < 1024) cameraRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  const nextPose = () => {
    if (!posesData.length) return;
    if (routine) {
      if (routine.step < routine.r.poses.length - 1) goToStep(routine.step + 1);
      return;
    }
    setSelectedPoseIndex(i => {
      let next = i === null ? 0 : (i + 1) % posesData.length;
      // skip the placeholder entry the library hides
      if (!isRealPose(posesData[next]?.name ?? '')) next = (next + 1) % posesData.length;
      return next;
    });
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
        // a star for every ten different poses finished in this visit
        const done = starPosesRef.current;
        if (targetNameRef.current) done.add(targetNameRef.current);
        if (done.size >= POSES_PER_STAR) {
          done.clear();
          setStarReason(null);
          setNewStar(addStar());
        }
        setStarPoses(Array.from(done));
        // in a routine: move on to the next pose, or finish and earn a star
        const rt = routineRef.current;
        if (rt && !rt.done) {
          if (rt.step < rt.r.poses.length - 1) {
            advanceTimer.current = window.setTimeout(() => goToStep(rt.step + 1), ROUTINE_PAUSE_MS);
          } else {
            setRoutine({ ...rt, done: true });
            setStarReason(`You finished ${rt.r.name}!`);
            setNewStar(addStar());
          }
        }
      }
    }, 100);
    return () => window.clearInterval(id);
  }, [isCameraOn, targetName, goToStep]);

  const mirrored = facingMode === 'user';
  const cssZoom = hardwareZoom ? 1 : zoom;

  const seenPose = isRealPose(currentPose) ? currentPose.split('(')[0].trim() : null;

  return (
    <div className="min-h-screen overflow-x-hidden bg-paper text-ink">
      <TopBar
        center={
          routine ? (
            <StarProgressBar done={routine.done ? routine.r.poses.length : routine.step} total={routine.r.poses.length} label={routine.done ? 'All done!' : `Pose ${routine.step + 1} of ${routine.r.poses.length}`} />
          ) : (
            <StarProgressBar done={starPoses.length} />
          )
        }
        right={
          <button
            onClick={() => setIsHelpOpen(true)}
            aria-label="Help"
            className="pt-btn h-14 w-14 shrink-0 rounded-full bg-card text-2xl font-extrabold text-ink"
          >
            ?
          </button>
        }
      />

      <main className="mx-auto max-w-7xl space-y-6 px-4 pb-10 sm:px-6">
        {error && (
          <div role="alert" className="flex flex-wrap items-center gap-4 rounded-xl bg-peach-soft px-6 py-4 text-xl text-ink">
            <p className="flex-1">{error}</p>
            {!isModelLoaded && !isLoading && (
              <button onClick={() => reloadModel()} className="pt-btn h-12 rounded-full bg-ink px-6 font-bold text-white">
                Try again
              </button>
            )}
          </div>
        )}

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-[minmax(0,1fr)_400px]">
          <div className="lg:order-last">
            <PosePanel
              posesData={posesData}
              selectedPoseIndex={selectedPoseIndex}
              view={sessionView}
              onSelect={setSelectedPoseIndex}
              onSelectAndGo={selectAndGo}
              onNextPose={nextPose}
              routine={routine && { name: routine.r.name, poses: routine.r.poses, step: routine.step, done: routine.done }}
              onLeaveRoutine={leaveRoutine}
            />
          </div>

          <section ref={cameraRef} aria-label="Camera" className="scroll-mt-4 space-y-4">
            <div className="relative overflow-hidden rounded-2xl bg-ink" style={{ aspectRatio: '4 / 3' }}>
              <div
                className="absolute inset-0"
                style={{
                  transform: `scale(${(mirrored ? -1 : 1) * cssZoom}, ${cssZoom})`,
                  transformOrigin: 'center center',
                }}
              >
                <video ref={videoRef} className="h-full w-full object-cover" playsInline muted />
                {/* object-cover on both keeps the skeleton lined up with the cropped video */}
                <canvas ref={canvasRef} className="pointer-events-none absolute inset-0 h-full w-full object-cover" />
              </div>

              {!isCameraOn && (
                <div className="absolute inset-0 flex items-center justify-center p-6 text-center">
                  <p className="text-3xl font-bold text-card/80 sm:text-4xl">
                    {isLoading ? 'Getting ready...' : isCameraLoading ? 'Starting...' : isModelLoaded ? 'Camera is off' : 'The camera helper is not working'}
                  </p>
                </div>
              )}

              {isCameraOn && qualityScore > 0 && qualityScore < 55 && sessionView?.phase !== 'complete' && (
                <span className="pt-pop absolute left-4 top-4 rounded-full bg-sun px-5 py-3 text-2xl font-extrabold text-ink">
                  Step back a little
                </span>
              )}

              {/* the pose to copy, stuck on the corner of the camera so both are in view at once */}
              {isCameraOn && targetName && (
                <span className="absolute bottom-3 right-3 w-[26%] min-w-[84px] max-w-[170px] rotate-3 rounded-full border-4 border-card bg-paper" aria-hidden>
                  <PoseFigure pose={targetName} showGround={false} decorative className="block aspect-square w-full" />
                </span>
              )}
            </div>

            <CoachMessage
              view={sessionView}
              targetName={targetName}
              threshold={threshold}
              isCameraOn={isCameraOn}
              isReady={isModelLoaded}
              onRestart={routine ? restartRoutine : resetSession}
              onNextPose={nextPose}
              routineNext={routine && !routine.done && routine.step < routine.r.poses.length - 1 ? routine.r.poses[routine.step + 1] : null}
              routineDone={routine?.done ? routine.r.name : null}
            />

            <CameraControls
              isModelLoaded={isModelLoaded}
              isCameraOn={isCameraOn}
              isCameraLoading={isCameraLoading}
              soundEnabled={soundEnabled}
              zoom={zoom}
              confidenceLevel={confidenceLevel}
              seenPose={seenPose}
              onStartCamera={startCamera}
              onStopCamera={stopCamera}
              onSwitchCamera={switchCamera}
              onToggleSound={() => setSoundEnabled(s => !s)}
              onZoom={handleZoom}
              onConfidenceLevelChange={setConfidenceLevel}
            />
          </section>

        </div>

        <GrownUpSettings
          isModelLoaded={isModelLoaded}
          isCameraOn={isCameraOn}
          isCameraLoading={isCameraLoading}
          soundEnabled={soundEnabled}
          zoom={zoom}
          confidenceLevel={confidenceLevel}
          seenPose={seenPose}
          onStartCamera={startCamera}
          onStopCamera={stopCamera}
          onSwitchCamera={switchCamera}
          onToggleSound={() => setSoundEnabled(s => !s)}
          onZoom={handleZoom}
          onConfidenceLevelChange={setConfidenceLevel}
        />

        <footer className="pt-2 text-center text-lg text-muted">
          The camera picture stays on this device. Nothing is uploaded.
        </footer>
      </main>

      <HelpModal isOpen={isHelpOpen} onClose={() => setIsHelpOpen(false)} />
      {newStar !== null && <StarCelebration stars={newStar} reason={starReason} onClose={() => setNewStar(null)} />}
    </div>
  );
};

export default YogaPoseDetector;
