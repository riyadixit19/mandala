// components/PosePanel.tsx
import React from 'react';
import { Check } from 'lucide-react';
import { PoseDataItem } from '../types/yoga.types';
import { isRealPose, CHECK_SECONDS, HOLD_SECONDS } from '../constants/yoga.constants';
import { SessionView } from '../utils/practiceSession';
import PoseFigure from '../figure/PoseFigure';
import { NEUTRAL_POSE } from '../figure/poseRig';
import { LogoMark } from './brand/Logo';

interface PosePanelProps {
  posesData: PoseDataItem[];
  selectedPoseIndex: number | null;
  currentPose: string;
  poseCount: number;
  isCameraOn: boolean;
  view: SessionView | null;
}

const STEPS = [
  { id: 'check', label: `Hold for ${CHECK_SECONDS} seconds` },
  { id: 'verdict', label: 'Form check' },
  { id: 'hold', label: `${HOLD_SECONDS}-second timer` },
] as const;

function stepState(view: SessionView | null, step: (typeof STEPS)[number]['id']): 'done' | 'active' | 'todo' {
  const p = view?.phase;
  const order = { check: 0, verdict: 1, hold: 2 }[step];
  const at =
    p === 'checking' || p === 'waiting' || !p ? 0
    : p === 'incorrect' || p === 'correct' ? 1
    : p === 'holding' || p === 'paused' ? 2
    : 3; // complete
  if (p === 'correct' && step === 'verdict') return 'done';
  return order < at ? 'done' : order === at ? 'active' : 'todo';
}

const PosePanel: React.FC<PosePanelProps> = ({ posesData, selectedPoseIndex, currentPose, poseCount, isCameraOn, view }) => {
  const target = selectedPoseIndex !== null ? posesData[selectedPoseIndex] : undefined;
  const seen = isRealPose(currentPose) ? currentPose.split('(')[0].trim() : null;
  const holding = view?.phase === 'holding' || view?.phase === 'complete';

  return (
    <aside aria-labelledby="target-heading" className={`pt-card p-2 transition-shadow ${holding ? 'ring-2 ring-pine/60' : ''}`}>
      {/* Target */}
      <div className="relative overflow-hidden rounded-[1.35rem] bg-gradient-to-b from-[#EEF5F0] to-[#DCEAE1]">
        <LogoMark className="pointer-events-none absolute -right-12 -top-12 h-52 w-52 text-pine/[0.08]" strokeWidth={1.4} />
        <LogoMark className="pointer-events-none absolute -bottom-16 -left-14 h-44 w-44 text-pine/[0.07]" strokeWidth={1.4} />
        <PoseFigure pose={target?.name ?? NEUTRAL_POSE} animate className="relative mx-auto block w-full max-w-[300px] aspect-square" />
      </div>

      <div className="px-4 pb-4 pt-5">
        <h2 id="target-heading" className="font-display text-[2rem] leading-tight text-ink">
          {target ? target.name : 'Choose a pose'}
        </h2>
        <p className="mt-1.5 text-[15px] leading-relaxed text-muted">
          {target ? target.description : 'Pick one from the library below and she will show you how it looks.'}
        </p>

        {/* Progress through the practice */}
        <ol className="mt-6 space-y-3 border-t border-ink/[0.07] pt-5">
          {STEPS.map((s, i) => {
            const st = target && isCameraOn ? stepState(view, s.id) : 'todo';
            return (
              <li key={s.id} className="flex items-center gap-3">
                <span
                  className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-xs font-semibold transition-colors ${
                    st === 'done' ? 'bg-pine text-white' : st === 'active' ? 'bg-pine/15 text-pine ring-1 ring-pine/40' : 'bg-ink/[0.05] text-muted'
                  }`}
                >
                  {st === 'done' ? <Check size={13} strokeWidth={3} /> : i + 1}
                </span>
                <span className={`text-[15px] ${st === 'todo' ? 'text-muted' : 'font-medium text-ink'}`}>{s.label}</span>
              </li>
            );
          })}
        </ol>

        <dl className="mt-5 grid grid-cols-2 gap-4 border-t border-ink/[0.07] pt-5">
          <div>
            <dt className="text-sm text-muted">Camera sees</dt>
            <dd className="mt-0.5 font-semibold text-ink">{!isCameraOn ? 'Camera off' : seen ?? 'Nothing yet'}</dd>
          </div>
          <div>
            <dt className="text-sm text-muted">Poses completed</dt>
            <dd className="mt-0.5 font-semibold tabular-nums text-ink">{poseCount}</dd>
          </div>
        </dl>
      </div>
    </aside>
  );
};

export default PosePanel;
