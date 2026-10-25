// components/CameraControls.tsx
import React from 'react';
import { Camera, CameraOff, SwitchCamera, Minus, Plus, Volume2, VolumeX } from 'lucide-react';
import { CONFIDENCE_PRESETS, ConfidenceLevel, STRICTNESS_LABELS, ZOOM_LIMITS } from '../constants/yoga.constants';

interface CameraControlsProps {
  isModelLoaded: boolean;
  isCameraOn: boolean;
  isCameraLoading: boolean;
  soundEnabled: boolean;
  zoom: number;
  confidenceLevel: ConfidenceLevel;
  onStartCamera: () => void;
  onStopCamera: () => void;
  onSwitchCamera: () => void;
  onToggleSound: () => void;
  onZoom: (direction: 'in' | 'out' | 'reset') => void;
  onConfidenceLevelChange: (level: ConfidenceLevel) => void;
}

const iconBtn =
  'inline-flex h-10 w-10 items-center justify-center rounded-full text-ink hover:bg-white disabled:text-[#C3CCC6] disabled:hover:bg-transparent disabled:cursor-not-allowed transition-colors';

const CameraControls: React.FC<CameraControlsProps> = ({
  isModelLoaded,
  isCameraOn,
  isCameraLoading,
  soundEnabled,
  zoom,
  confidenceLevel,
  onStartCamera,
  onStopCamera,
  onSwitchCamera,
  onToggleSound,
  onZoom,
  onConfidenceLevelChange,
}) => {
  return (
    <div className="flex flex-wrap items-center gap-x-4 gap-y-3 px-2 pb-1 pt-3 sm:px-3">
      {/* Camera */}
      {isCameraOn ? (
        <button
          onClick={onStopCamera}
          className="inline-flex h-11 items-center gap-2 rounded-full bg-white px-5 text-sm font-semibold text-ink shadow-[inset_0_0_0_1px_#DDE1DA] hover:shadow-[inset_0_0_0_1px_rgba(29,42,38,0.35)] transition-shadow"
        >
          <CameraOff size={17} strokeWidth={2} />
          Stop camera
        </button>
      ) : (
        <button
          onClick={() => onStartCamera()}
          disabled={!isModelLoaded || isCameraLoading}
          className="inline-flex h-11 items-center gap-2 rounded-full bg-pine px-5 text-sm font-semibold text-white hover:bg-pine-dark disabled:bg-[#D9E2DC] disabled:text-muted disabled:cursor-not-allowed transition-colors"
        >
          <Camera size={17} strokeWidth={2} />
          {isCameraLoading ? 'Starting camera' : 'Start camera'}
        </button>
      )}

      <div className="flex items-center gap-1">
        <button onClick={onSwitchCamera} disabled={!isCameraOn} className={iconBtn} title="Switch between front and back camera" aria-label="Switch camera">
          <SwitchCamera size={18} />
        </button>

        <span className="mx-1 h-5 w-px bg-ink/10" aria-hidden />

        <button
          onClick={() => onZoom('out')}
          disabled={!isCameraOn || zoom <= ZOOM_LIMITS.min}
          className={iconBtn}
          aria-label="Zoom out"
        >
          <Minus size={18} />
        </button>
        <button
          onClick={() => onZoom('reset')}
          disabled={!isCameraOn || zoom === 1}
          className="h-10 min-w-[3.25rem] rounded-full text-sm font-medium tabular-nums text-ink hover:bg-white disabled:text-muted disabled:hover:bg-transparent disabled:cursor-default transition-colors"
          title="Reset zoom"
        >
          {zoom.toFixed(1)}×
        </button>
        <button
          onClick={() => onZoom('in')}
          disabled={!isCameraOn || zoom >= ZOOM_LIMITS.max}
          className={iconBtn}
          aria-label="Zoom in"
        >
          <Plus size={18} />
        </button>

        <span className="mx-1 h-5 w-px bg-ink/10" aria-hidden />

        <button
          onClick={onToggleSound}
          className={iconBtn}
          aria-pressed={soundEnabled}
          aria-label={soundEnabled ? 'Mute the match chime' : 'Turn on the match chime'}
          title={soundEnabled ? 'Chime on' : 'Chime off'}
        >
          {soundEnabled ? <Volume2 size={18} /> : <VolumeX size={18} className="text-muted" />}
        </button>
      </div>

      {/* Strictness */}
      <div className="flex items-center gap-3 sm:ml-auto">
        <span className="text-sm text-muted" id="strictness-label">Strictness</span>
        <div role="radiogroup" aria-labelledby="strictness-label" className="flex rounded-full bg-[#E9F0EB] p-1">
          {(Object.keys(CONFIDENCE_PRESETS) as ConfidenceLevel[]).map(level => {
            const active = confidenceLevel === level;
            return (
              <button
                key={level}
                role="radio"
                aria-checked={active}
                onClick={() => onConfidenceLevelChange(level)}
                title={STRICTNESS_LABELS[level].hint}
                className={`h-8 rounded-full px-3.5 text-sm font-medium transition-colors ${
                  active ? 'bg-white text-ink shadow-[0_1px_2px_rgba(29,42,38,0.12)]' : 'text-muted hover:text-ink'
                }`}
              >
                {STRICTNESS_LABELS[level].label}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default CameraControls;
