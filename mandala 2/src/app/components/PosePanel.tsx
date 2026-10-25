// components/PosePanel.tsx
// The pose to copy: the pose picker, a big picture, its name, one short line about it,
// and ten flower spots that fill up on the way to the next star.
import React from 'react';
import { PoseDataItem } from '../types/yoga.types';
import { SessionView } from '../utils/practiceSession';
import { POSES_PER_STAR } from '../utils/stars';
import PoseFigure from '../figure/PoseFigure';
import { NEUTRAL_POSE } from '../figure/poseRig';
import { LogoMark } from './brand/Logo';
import { StarShape } from './Stars';
import PosePicker from './PosePicker';

interface PosePanelProps {
  posesData: PoseDataItem[];
  selectedPoseIndex: number | null;
  /** different poses finished since the last star */
  starProgress: number;
  view: SessionView | null;
  onSelect: (index: number) => void;
  onSelectAndGo: (index: number) => void;
  onNextPose: () => void;
}

const FLOWER_COLORS = ['text-rust', 'text-marigold', 'text-sky', 'text-pine'];

/** Ten spots; each different pose finished fills one with a flower. Ten flowers make a star. */
function StarProgress({ done }: { done: number }) {
  return (
    <div>
      <div className="flex items-center justify-between gap-3">
        <p className="text-xl font-bold text-ink">Flowers</p>
        <p className="flex items-center gap-2 text-lg text-muted">
          {POSES_PER_STAR - done} more for a <StarShape className="h-7 w-7" />
        </p>
      </div>
      <ol className="mt-2 grid grid-cols-5 gap-2" aria-label={`${done} of ${POSES_PER_STAR} flowers`}>
        {Array.from({ length: POSES_PER_STAR }, (_, i) => (
          <li key={i} className="flex aspect-square items-center justify-center rounded-md border-2 border-dashed border-line">
            {i < done && <LogoMark className={`pt-grow h-4/5 w-4/5 ${FLOWER_COLORS[i % FLOWER_COLORS.length]}`} strokeWidth={5} />}
          </li>
        ))}
      </ol>
    </div>
  );
}

const PosePanel: React.FC<PosePanelProps> = ({ posesData, selectedPoseIndex, starProgress, view, onSelect, onSelectAndGo, onNextPose }) => {
  const target = selectedPoseIndex !== null ? posesData[selectedPoseIndex] : undefined;
  const phase = view?.phase;
  const happy = phase === 'correct' || phase === 'complete';

  return (
    <aside
      aria-labelledby="target-heading"
      className={`rounded-md border-2 bg-card p-4 sm:p-6 ${phase === 'holding' || happy ? 'border-pine' : 'border-line'}`}
    >
      <PosePicker posesData={posesData} selectedPoseIndex={selectedPoseIndex} onSelect={onSelect} onSelectAndGo={onSelectAndGo} />

      <div className="mt-4 overflow-hidden rounded-md bg-sky-soft">
        {/* keyed so she jumps again every time a pose is right */}
        <div key={happy ? `hop-${phase}` : 'still'} className={happy ? 'pt-hop' : undefined}>
          <PoseFigure pose={target?.name ?? NEUTRAL_POSE} animate className="mx-auto block aspect-square w-full max-w-[220px] sm:max-w-[320px]" />
        </div>
      </div>

      <h2 id="target-heading" className="mt-4 text-4xl font-black leading-tight text-ink sm:text-5xl">
        {target ? target.name : 'Hello!'}
      </h2>
      <p className="mt-2 text-xl leading-relaxed text-muted sm:text-2xl">
        {target ? target.description : 'Press the blue button to pick a pose.'}
      </p>

      {target && (
        <button
          onClick={onNextPose}
          className="pt-btn mt-4 h-16 w-full rounded-md border-2 border-marigold-dark bg-marigold text-2xl font-black text-ink"
        >
          Next pose
        </button>
      )}

      <div className="mt-5 border-t-2 border-line pt-4">
        <StarProgress done={starProgress} />
      </div>
    </aside>
  );
};

export default PosePanel;
