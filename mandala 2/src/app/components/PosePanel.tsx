// components/PosePanel.tsx
// The pose to copy: she stands on her hill showing it, with the pose picker above her
// and the pose's name underneath.
import React from 'react';
import { PoseDataItem } from '../types/yoga.types';
import { SessionView } from '../utils/practiceSession';
import { NEUTRAL_POSE } from '../figure/poseRig';
import PosePicker from './PosePicker';
import PoseFigure from '../figure/PoseFigure';
import Scene from './Scene';

interface PosePanelProps {
  posesData: PoseDataItem[];
  selectedPoseIndex: number | null;
  view: SessionView | null;
  onSelect: (index: number) => void;
  onSelectAndGo: (index: number) => void;
  onNextPose: () => void;
  /** set while following a routine: the picker is swapped for the routine's steps */
  routine?: { name: string; poses: string[]; step: number; done: boolean } | null;
  onLeaveRoutine?: () => void;
}

/** The routine's poses in a row: done, now, and still to come */
function RoutineSteps({ poses, step, done }: { poses: string[]; step: number; done: boolean }) {
  return (
    <ol className="pt-scroll-x mt-3 flex gap-2 overflow-x-auto p-1.5" aria-label="Poses in this routine">
      {poses.map((p, i) => {
        const finished = done || i < step;
        const now = !done && i === step;
        return (
          <li
            key={`${p}-${i}`}
            aria-current={now ? 'step' : undefined}
            className={`flex h-16 w-16 shrink-0 items-center justify-center rounded-full ${now ? 'bg-card ring-4 ring-ink' : finished ? 'bg-leaf-soft' : 'bg-card opacity-60'}`}
          >
            <PoseFigure pose={p} showGround={false} decorative className="h-14 w-14" />
            <span className="sr-only">{`${p}${finished ? ', done' : now ? ', now' : ''}`}</span>
          </li>
        );
      })}
    </ol>
  );
}

const PosePanel: React.FC<PosePanelProps> = ({ posesData, selectedPoseIndex, view, onSelect, onSelectAndGo, onNextPose, routine, onLeaveRoutine }) => {
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
          {routine ? (
            <div className="flex h-16 items-center gap-3 rounded-full bg-card pl-6 pr-2 sm:h-20">
              <span className="min-w-0 flex-1 truncate text-xl font-extrabold sm:text-2xl">{routine.name}</span>
              <button onClick={onLeaveRoutine} className="pt-btn h-12 shrink-0 rounded-full bg-paper px-5 text-lg font-bold text-muted sm:h-14">
                Stop
              </button>
            </div>
          ) : (
            <PosePicker posesData={posesData} selectedPoseIndex={selectedPoseIndex} onSelect={onSelect} onSelectAndGo={onSelectAndGo} />
          )}
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
        {target && (!routine || (!routine.done && routine.step < routine.poses.length - 1)) && (
          <button onClick={onNextPose} className="pt-btn h-14 shrink-0 rounded-full bg-card px-6 text-xl font-extrabold text-ink">
            {routine ? 'Skip' : 'Next'}
          </button>
        )}
      </div>

      {routine && <RoutineSteps poses={routine.poses} step={routine.step} done={routine.done} />}
    </aside>
  );
};

export default PosePanel;
