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

/** Big countdown number inside a thick ring; the number pops each second */
function Countdown({ remaining, total, color }: { remaining: number; total: number; color: string }) {
  const r = 26;
  const c = 2 * Math.PI * r;
  const frac = Math.max(0, Math.min(1, remaining / total));
  const n = Math.ceil(remaining);
  return (
    <div className="relative h-28 w-28 shrink-0 sm:h-32 sm:w-32">
      <svg viewBox="0 0 64 64" className="h-full w-full -rotate-90" aria-hidden>
        <circle cx="32" cy="32" r={r} fill="none" stroke="#ECE5FB" strokeWidth="8" />
        <circle
          cx="32" cy="32" r={r} fill="none" stroke={color} strokeWidth="8" strokeLinecap="round"
          strokeDasharray={c} strokeDashoffset={c * (1 - frac)}
          style={{ transition: 'stroke-dashoffset 0.15s linear' }}
        />
      </svg>
      <span key={n} className="pt-pop absolute inset-0 flex items-center justify-center text-5xl font-black tabular-nums text-ink sm:text-6xl">
        {n}
      </span>
    </div>
  );
}

const PETAL_COLORS = ['#EC4C93', '#7650F0', '#1865F2', '#F7B514'];

/** Petals bursting out of the flower */
function Burst() {
  return (
    <span className="pointer-events-none absolute inset-0" aria-hidden>
      {Array.from({ length: 12 }, (_, i) => (
        <span
          key={i}
          className="pt-petal absolute left-1/2 top-1/2 -ml-2 -mt-3 h-6 w-4 rounded-full"
          style={{ background: PETAL_COLORS[i % PETAL_COLORS.length], ['--a' as any]: `${i * 30}deg`, transformOrigin: '50% 50%' }}
        />
      ))}
    </span>
  );
}

/** A round marker for "yes" (the Mandala flower) and "not yet", drawn instead of an icon */
function Marker({ good, burst = false }: { good: boolean; burst?: boolean }) {
  return good ? (
    <span className="relative flex h-28 w-28 shrink-0 items-center justify-center rounded-full bg-purple sm:h-32 sm:w-32" aria-hidden>
      {burst && <Burst />}
      <LogoMark className="pt-grow h-20 w-20 text-card sm:h-24 sm:w-24" strokeWidth={4} />
    </span>
  ) : (
    <span className="flex h-28 w-28 shrink-0 items-center justify-center rounded-full bg-coral-soft sm:h-32 sm:w-32" aria-hidden>
      <span className="h-9 w-9 rounded-full bg-coral" />
    </span>
  );
}

/** How close the child is, as a thick bar. The notch shows where "good enough" starts. */
function CloseBar({ score, threshold }: { score: number; threshold: number }) {
  const passing = score >= threshold;
  return (
    <div className="mt-4">
      <p className="text-lg font-bold text-muted">How close</p>
      <div className="relative mt-1 h-5 w-full rounded-full bg-[#ECE5FB]">
        <div
          className={`h-full rounded-full ${passing ? 'bg-purple' : 'bg-pink'}`}
          style={{ width: `${Math.round(score * 100)}%`, transition: 'width 0.2s ease-out' }}
        />
        <span className="absolute -top-1.5 h-8 w-1.5 rounded bg-ink/70" style={{ left: `${threshold * 100}%` }} aria-hidden />
      </div>
    </div>
  );
}

const CoachMessage: React.FC<CoachMessageProps> = ({ view, targetName, threshold, isCameraOn, isReady, onRestart, onNextPose }) => {
  let visual: React.ReactNode = null;
  let title = '';
  let body: React.ReactNode = null;
  let extra: React.ReactNode = null;
  let tone = 'border-line';

  if (!isReady) {
    title = 'Getting ready...';
    body = 'This takes a few seconds.';
  } else if (!targetName) {
    title = 'Pick a pose';
    body = 'Press the blue button.';
  } else if (!isCameraOn) {
    title = 'Press Start camera';
    body = `Then we can do ${targetName} together.`;
  } else if (!view || view.phase === 'waiting') {
    title = 'Step back';
    body = 'Show your whole body, from head to toes.';
    tone = 'border-blue';
  } else if (view.phase === 'checking') {
    visual = <Countdown remaining={view.checkRemaining} total={CHECK_SECONDS} color="#EC4C93" />;
    title = 'Hold still';
    body = `Copy the picture. Count to ${CHECK_SECONDS}.`;
    extra = <CloseBar score={view.liveScore} threshold={threshold} />;
    tone = 'border-pink';
  } else if (view.phase === 'incorrect') {
    visual = <Marker good={false} />;
    title = view.hint ?? 'Copy the picture';
    body = 'Almost! Try again.';
    tone = 'border-coral';
  } else if (view.phase === 'correct') {
    visual = <Marker good />;
    title = 'Yes! You did it!';
    body = 'Now stay like that.';
    tone = 'border-purple';
  } else if (view.phase === 'holding') {
    visual = <Countdown remaining={view.holdRemaining} total={HOLD_SECONDS} color="#7650F0" />;
    title = 'Keep going';
    body = 'Breathe slowly.';
    extra = <CloseBar score={view.liveScore} threshold={threshold} />;
    tone = 'border-purple';
  } else if (view.phase === 'paused') {
    visual = <Countdown remaining={view.holdRemaining} total={HOLD_SECONDS} color="#B7B0D3" />;
    title = view.hint ?? 'Come back to the pose';
    body = 'The timer is waiting for you.';
    tone = 'border-coral';
  } else if (view.phase === 'complete') {
    visual = <Marker good burst />;
    title = 'Well done!';
    body = `You held ${targetName}.`;
    tone = 'border-purple';
    extra = (
      <div className="mt-5 flex flex-wrap gap-3">
        <button onClick={onRestart} className="pt-btn h-16 rounded-md border-2 border-line bg-card px-8 text-2xl font-black text-ink">
          Again
        </button>
        <button onClick={onNextPose} className="pt-btn h-16 rounded-md border-2 border-purple-dark bg-purple px-8 text-2xl font-black text-white">
          Next pose
        </button>
      </div>
    );
  }

  return (
    <div
      key={`${view?.phase ?? 'none'}-${title}`}
      className={`pt-pop flex items-center gap-5 rounded-md border-2 bg-card px-5 py-5 sm:gap-6 sm:px-8 sm:py-6 ${tone}`}
      role="status"
      aria-live="polite"
    >
      {visual}
      <div className="min-w-0 flex-1">
        <p className="text-3xl font-black leading-tight text-ink sm:text-4xl">{title}</p>
        <p className="mt-2 text-xl leading-snug text-muted sm:text-2xl">{body}</p>
        {extra}
      </div>
    </div>
  );
};

export default CoachMessage;
