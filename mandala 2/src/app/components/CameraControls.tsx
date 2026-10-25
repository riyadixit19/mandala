// components/CameraControls.tsx
// One big start/stop button for the child. Everything else sits in a folded "grown-ups" section.
import React from 'react';
import { CONFIDENCE_PRESETS, ConfidenceLevel, STRICTNESS_LABELS, ZOOM_LIMITS } from '../constants/yoga.constants';

interface CameraControlsProps {
  isModelLoaded: boolean;
  isCameraOn: boolean;
  isCameraLoading: boolean;
  soundEnabled: boolean;
  zoom: number;
  confidenceLevel: ConfidenceLevel;
  /** what the camera thinks it sees, for grown-ups checking the tracking */
  seenPose: string | null;
  onStartCamera: () => void;
  onStopCamera: () => void;
  onSwitchCamera: () => void;
  onToggleSound: () => void;
  onZoom: (direction: 'in' | 'out' | 'reset') => void;
  onConfidenceLevelChange: (level: ConfidenceLevel) => void;
}

const smallBtn =
  'pt-btn h-14 min-w-[3.5rem] rounded-md border-2 border-line bg-card px-4 text-xl font-bold text-ink disabled:cursor-not-allowed disabled:text-muted/50';

/** The big start/stop button */
const CameraControls: React.FC<CameraControlsProps> = ({ isModelLoaded, isCameraOn, isCameraLoading, onStartCamera, onStopCamera }) => {
  return isCameraOn ? (
    <button
      onClick={onStopCamera}
      className="pt-btn h-20 w-full rounded-md border-2 border-rust-dark bg-rust text-3xl font-black text-white"
    >
      Stop camera
    </button>
  ) : (
    <button
      onClick={() => onStartCamera()}
      disabled={!isModelLoaded || isCameraLoading}
      className="pt-btn h-20 w-full rounded-md border-2 border-pine-dark bg-pine text-3xl font-black text-white disabled:cursor-not-allowed disabled:border-line disabled:bg-line disabled:text-muted"
    >
      {isCameraLoading ? 'Starting...' : 'Start camera'}
    </button>
  );
};

/** Strictness, zoom, camera switch, sound and tracking info, folded away from the child */
export const GrownUpSettings: React.FC<CameraControlsProps> = ({
  isCameraOn,
  soundEnabled,
  zoom,
  confidenceLevel,
  seenPose,
  onSwitchCamera,
  onToggleSound,
  onZoom,
  onConfidenceLevelChange,
}) => {
  return (
    <details className="group rounded-md border-2 border-line bg-card">
      <summary className="flex cursor-pointer items-center justify-between gap-4 px-5 py-4 text-xl font-bold text-ink">
        Settings for grown-ups
        <span className="text-lg font-normal text-muted group-open:hidden">Show</span>
        <span className="hidden text-lg font-normal text-muted group-open:inline">Hide</span>
      </summary>

      <div className="space-y-6 border-t-2 border-line px-5 py-5">
        <div>
          <p className="text-lg font-bold text-ink" id="strictness-label">How close is close enough</p>
          <div role="radiogroup" aria-labelledby="strictness-label" className="mt-2 grid grid-cols-3 gap-2">
            {(Object.keys(CONFIDENCE_PRESETS) as ConfidenceLevel[]).map(level => {
              const active = confidenceLevel === level;
              return (
                <button
                  key={level}
                  role="radio"
                  aria-checked={active}
                  onClick={() => onConfidenceLevelChange(level)}
                  className={`h-14 rounded-md border-2 px-1 text-base font-bold sm:text-lg ${
                    active ? 'border-sky-dark bg-sky text-white' : 'border-line bg-card text-ink'
                  }`}
                >
                  {STRICTNESS_LABELS[level].label}
                </button>
              );
            })}
          </div>
          <p className="mt-2 text-lg text-muted">{STRICTNESS_LABELS[confidenceLevel].hint}</p>
        </div>

        <div className="flex flex-wrap items-center gap-x-8 gap-y-4">
          <div>
            <p className="text-lg font-bold text-ink">Zoom</p>
            <div className="mt-2 flex items-center gap-2">
              <button onClick={() => onZoom('out')} disabled={!isCameraOn || zoom <= ZOOM_LIMITS.min} className={smallBtn} aria-label="Zoom out">
                -
              </button>
              <button onClick={() => onZoom('reset')} disabled={!isCameraOn || zoom === 1} className={`${smallBtn} tabular-nums`} title="Reset zoom">
                {zoom.toFixed(1)}x
              </button>
              <button onClick={() => onZoom('in')} disabled={!isCameraOn || zoom >= ZOOM_LIMITS.max} className={smallBtn} aria-label="Zoom in">
                +
              </button>
            </div>
          </div>

          <div>
            <p className="text-lg font-bold text-ink">Camera</p>
            <button onClick={onSwitchCamera} disabled={!isCameraOn} className={`${smallBtn} mt-2`}>
              Switch camera
            </button>
          </div>

          <div>
            <p className="text-lg font-bold text-ink">Sound</p>
            <button onClick={onToggleSound} aria-pressed={soundEnabled} className={`${smallBtn} mt-2`}>
              {soundEnabled ? 'Sound on' : 'Sound off'}
            </button>
          </div>
        </div>

        <p className="text-lg text-muted">
          Camera sees: <span className="font-bold text-ink">{!isCameraOn ? 'camera off' : seenPose ?? 'nothing yet'}</span>
        </p>
      </div>
    </details>
  );
};

export default CameraControls;
