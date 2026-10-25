// components/CoachMessage.tsx
// The one big message under the camera: what to do right now, in a few short words.
import React from 'react';
import { SessionView } from '../utils/practiceSession';
import { CHECK_SECONDS, HOLD_SECONDS } from '../constants/yoga.constants';
import { LogoMark } from './brand/Logo';

interface CoachMessageProps {
  view: SessionView | null;
  targetName: string | null;
  threshold: number;
  isCameraOn: boolean;
  isReady: boolean;
  onRestart: () => void;
  onNextPose: () => void;
}

/** Big countdown number inside a thick ring */
function Countdown({ remaining, total, color }: { remaining: number; total: number; color: string }) {
  const r = 26;
  const c = 2 * Math.PI * r;
  const frac = Math.max(0, Math.min(1, remaining / total));
  return (
    <div className="relative h-28 w-28 shrink-0 sm:h-32 sm:w-32">
      <svg viewBox="0 0 64 64" className="h-full w-full -rotate-90" aria-hidden>
        <circle cx="32" cy="32" r={r} fill="none" stroke="#E6DFD1" strokeWidth="7" />
        <circle
          cx="32" cy="32" r={r} fill="none" stroke={color} strokeWidth="7"
          strokeDasharray={c} strokeDashoffset={c * (1 - frac)}
        />
      </svg>
      <span className="absolute inset-0 flex items-center justify-center text-5xl font-bold tabular-nums text-ink sm:text-6xl">
        {Math.ceil(remaining)}
      </span>
    </div>
  );
}

/** A round marker for "yes" (the Mandala flower) and "not yet", drawn instead of an icon */
function Marker({ good }: { good: boolean }) {
  return good ? (
    <span className="flex h-28 w-28 shrink-0 items-center justify-center rounded-full bg-pine sm:h-32 sm:w-32" aria-hidden>
      <LogoMark className="h-20 w-20 text-card sm:h-24 sm:w-24" strokeWidth={4} />
    </span>
  ) : (
    <span className="flex h-28 w-28 shrink-0 items-center justify-center rounded-full bg-rust-soft sm:h-32 sm:w-32" aria-hidden>
      <span className="h-8 w-8 rounded-full bg-rust" />
    </span>
  );
}

/** How close the child is, as a thick bar. The notch shows where "good enough" starts. */
function CloseBar({ score, threshold }: { score: number; threshold: number }) {
  const passing = score >= threshold;
  return (
    <div className="mt-4">
      <p className="text-lg text-muted">How close</p>
      <div className="relative mt-1 h-4 w-full rounded bg-[#E6DFD1]">
        <div className={`h-full rounded ${passing ? 'bg-pine' : 'bg-marigold'}`} style={{ width: `${Math.round(score * 100)}%` }} />
        <span className="absolute -top-1.5 h-7 w-1 rounded bg-ink/60" style={{ left: `${threshold * 100}%` }} aria-hidden />
      </div>
    </div>
  );
}

const CoachMessage: React.FC<CoachMessageProps> = ({ view, targetName, threshold, isCameraOn, isReady, onRestart, onNextPose }) => {
  let visual: React.ReactNode = null;
  let title = '';
  let body: React.ReactNode = null;
  let extra: React.ReactNode = null;

  if (!isReady) {
    title = 'Getting ready...';
    body = 'This takes a few seconds.';
  } else if (!targetName) {
    title = 'Pick a pose';
    body = 'Choose a picture below.';
  } else if (!isCameraOn) {
    title = 'Press Start camera';
    body = `Then we can do ${targetName} together.`;
  } else if (!view || view.phase === 'waiting') {
    title = 'Step back';
    body = 'Show your whole body, from head to toes.';
  } else if (view.phase === 'checking') {
    visual = <Countdown remaining={view.checkRemaining} total={CHECK_SECONDS} color="#C9843D" />;
    title = 'Hold still';
    body = `Copy the picture. Count to ${CHECK_SECONDS}.`;
    extra = <CloseBar score={view.liveScore} threshold={threshold} />;
  } else if (view.phase === 'incorrect') {
    visual = <Marker good={false} />;
    title = view.hint ?? 'Copy the picture';
    body = 'Almost! Try again.';
  } else if (view.phase === 'correct') {
    visual = <Marker good />;
    title = 'Yes! You did it!';
    body = 'Now stay like that.';
  } else if (view.phase === 'holding') {
    visual = <Countdown remaining={view.holdRemaining} total={HOLD_SECONDS} color="#3D6956" />;
    title = 'Keep going';
    body = 'Breathe slowly.';
    extra = <CloseBar score={view.liveScore} threshold={threshold} />;
  } else if (view.phase === 'paused') {
    visual = <Countdown remaining={view.holdRemaining} total={HOLD_SECONDS} color="#A9A193" />;
    title = view.hint ?? 'Come back to the pose';
    body = 'The timer is waiting for you.';
  } else if (view.phase === 'complete') {
    visual = <Marker good />;
    title = 'Well done!';
    body = `You held ${targetName}.`;
    extra = (
      <div className="mt-5 flex flex-wrap gap-3">
        <button onClick={onRestart} className="h-16 rounded-md border-2 border-line bg-card px-8 text-2xl font-semibold text-ink hover:border-ink/40">
          Again
        </button>
        <button onClick={onNextPose} className="h-16 rounded-md bg-pine px-8 text-2xl font-semibold text-white hover:bg-pine-dark">
          Next pose
        </button>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-6 rounded-md border-2 border-line bg-card px-6 py-6 sm:px-8" role="status" aria-live="polite">
      {visual}
      <div className="min-w-0 flex-1">
        <p className="text-3xl font-bold leading-tight text-ink sm:text-4xl">{title}</p>
        <p className="mt-2 text-xl leading-snug text-muted sm:text-2xl">{body}</p>
        {extra}
      </div>
    </div>
  );
};

export default CoachMessage;
