// components/PosePanel.tsx
// The pose to copy: she stands on her hill showing it, with the pose picker above her
// and the pose's name underneath.
import React from 'react';
import { PoseDataItem } from '../types/yoga.types';
import { SessionView } from '../utils/practiceSession';
import { NEUTRAL_POSE } from '../figure/poseRig';
import PosePicker from './PosePicker';
import Scene from './Scene';

interface PosePanelProps {
  posesData: PoseDataItem[];
  selectedPoseIndex: number | null;
  view: SessionView | null;
  onSelect: (index: number) => void;
  onSelectAndGo: (index: number) => void;
  onNextPose: () => void;
}

const PosePanel: React.FC<PosePanelProps> = ({ posesData, selectedPoseIndex, view, onSelect, onSelectAndGo, onNextPose }) => {
  const target = selectedPoseIndex !== null ? posesData[selectedPoseIndex] : undefined;
  const phase = view?.phase;
  const happy = phase === 'correct' || phase === 'complete';

  return (
    <aside aria-labelledby="target-heading">
      <div className="relative">
        <Scene
          pose={target?.name ?? NEUTRAL_POSE}
          hill={0.24}
          figure={0.66}
          // keyed by phase so she jumps again every time a pose is right
          figureClassName={happy ? 'pt-hop' : undefined}
          key={happy ? `hop-${phase}` : 'still'}
          className="aspect-[5/6] w-full rounded-2xl sm:aspect-square"
        />
        <div className="absolute inset-x-3 top-3 z-10 sm:inset-x-4 sm:top-4">
          <PosePicker posesData={posesData} selectedPoseIndex={selectedPoseIndex} onSelect={onSelect} onSelectAndGo={onSelectAndGo} />
        </div>
      </div>

      <div className="mt-5 flex items-start justify-between gap-4 px-1">
        <div className="min-w-0">
          <h2 id="target-heading" className="font-display text-4xl font-bold leading-[1.05] tracking-tight text-ink sm:text-5xl">
            {target ? target.name : 'Hi there!'}
          </h2>
          <p className="mt-2 text-xl leading-relaxed text-muted">
            {target ? target.description : 'Pick a pose and she will show you how.'}
          </p>
        </div>
        {target && (
          <button onClick={onNextPose} className="pt-btn h-14 shrink-0 rounded-full bg-card px-6 text-xl font-extrabold text-ink">
            Next
          </button>
        )}
      </div>
    </aside>
  );
};

export default PosePanel;
