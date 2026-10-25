// components/PosePanel.tsx
// The pose to copy: a big picture, its name, one short line about it, and the flowers earned so far.
import React from 'react';
import { PoseDataItem } from '../types/yoga.types';
import { SessionView } from '../utils/practiceSession';
import PoseFigure from '../figure/PoseFigure';
import { NEUTRAL_POSE } from '../figure/poseRig';
import { LogoMark } from './brand/Logo';

interface PosePanelProps {
  posesData: PoseDataItem[];
  selectedPoseIndex: number | null;
  poseCount: number;
  view: SessionView | null;
  onNextPose: () => void;
}

/** One flower per finished pose; after ten, a number keeps the row short */
function Flowers({ count }: { count: number }) {
  const shown = Math.min(count, 10);
  return (
    <div>
      <p className="text-xl text-muted">Poses finished</p>
      <div className="mt-2 flex min-h-[2.75rem] flex-wrap items-center gap-2" aria-label={`${count} poses finished`}>
        {count === 0 ? (
          <span className="text-xl text-muted">None yet</span>
        ) : (
          <>
            {Array.from({ length: shown }, (_, i) => (
              <LogoMark key={i} className="h-11 w-11 text-marigold" strokeWidth={4.5} />
            ))}
            {count > shown && <span className="text-2xl font-bold text-ink">{count}</span>}
          </>
        )}
      </div>
    </div>
  );
}

const PosePanel: React.FC<PosePanelProps> = ({ posesData, selectedPoseIndex, poseCount, view, onNextPose }) => {
  const target = selectedPoseIndex !== null ? posesData[selectedPoseIndex] : undefined;
  const holding = view?.phase === 'holding' || view?.phase === 'complete';

  return (
    <aside
      aria-labelledby="target-heading"
      className={`rounded-md border-2 bg-card p-5 sm:p-6 ${holding ? 'border-pine' : 'border-line'}`}
    >
      <div className="rounded-md bg-pine-soft">
        <PoseFigure pose={target?.name ?? NEUTRAL_POSE} animate className="mx-auto block aspect-square w-full max-w-[340px]" />
      </div>

      <h2 id="target-heading" className="mt-5 text-4xl font-bold leading-tight text-ink sm:text-5xl">
        {target ? target.name : 'Pick a pose'}
      </h2>
      <p className="mt-3 text-xl leading-relaxed text-muted sm:text-2xl">
        {target ? target.description : 'Choose a picture below and she will show you how.'}
      </p>

      {target && (
        <button
          onClick={onNextPose}
          className="mt-5 h-16 w-full rounded-md border-2 border-line bg-card text-2xl font-semibold text-ink hover:border-ink/40"
        >
          Next pose
        </button>
      )}

      <div className="mt-6 border-t-2 border-line pt-5">
        <Flowers count={poseCount} />
      </div>
    </aside>
  );
};

export default PosePanel;
