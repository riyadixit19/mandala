// components/CoachMessage.tsx
// The one big message under the camera: what to do right now, in a few short words.
import React from 'react';
import Link from 'next/link';
import { SessionView } from '../utils/practiceSession';
import { CHECK_SECONDS, HOLD_SECONDS } from '../constants/yoga.constants';
import { LogoMark } from './brand/Logo';
import PoseFigure from '../figure/PoseFigure';

interface CoachMessageProps {
  view: SessionView | null;
  targetName: string | null;
  threshold: number;
  isCameraOn: boolean;
  isReady: boolean;
  onRestart: () => void;
  onNextPose: () => void;
  /** in a routine: the pose that comes next (it starts by itself) */
  routineNext?: string | null;
  /** in a routine: its name, once the last pose is finished */
  routineDone?: string | null;
}

/** Big countdown number inside a thick ring; the number pops each second */
function Countdown({ remaining, total, color }: { remaining: number; total: number; color: string }) {
  const r = 26;
  const c = 2 * Math.PI * r;
  const frac = Math.max(0, Math.min(1, remaining / total));
  const n = Math.ceil(remaining);
  return (
    <div className="relative h-24 w-24 shrink-0 sm:h-32 sm:w-32">
      <svg viewBox="0 0 64 64" className="h-full w-full -rotate-90" aria-hidden>
        <circle cx="32" cy="32" r={r} fill="none" stroke="rgba(28,27,58,0.08)" strokeWidth="8" />
        <circle
          cx="32" cy="32" r={r} fill="none" stroke={color} strokeWidth="8" strokeLinecap="round"
          strokeDasharray={c} strokeDashoffset={c * (1 - frac)}
          style={{ transition: 'stroke-dashoffset 0.15s linear' }}
        />
      </svg>
      <span key={n} className="pt-pop absolute inset-0 flex items-center justify-center text-5xl font-extrabold tabular-nums text-ink sm:text-6xl">
        {n}
      </span>
    </div>
  );
}

const PETAL_COLORS = ['#E3908A', '#8794E0', '#F0C24B', '#EBAA86'];

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
    <span className="relative flex h-24 w-24 shrink-0 items-center justify-center rounded-full bg-leaf sm:h-32 sm:w-32" aria-hidden>
      {burst && <Burst />}
      <LogoMark className="pt-grow h-16 w-16 text-card sm:h-24 sm:w-24" strokeWidth={4} />
    </span>
  ) : (
    <span className="flex h-24 w-24 shrink-0 items-center justify-center rounded-full bg-card sm:h-32 sm:w-32" aria-hidden>
      <span className="h-9 w-9 rounded-full bg-peach" />
    </span>
  );
}

/** How close the child is, as a thick bar. The notch shows where "good enough" starts. */
function CloseBar({ score, threshold }: { score: number; threshold: number }) {
  const passing = score >= threshold;
  return (
    <div className="mt-4">
      <p className="text-lg font-bold text-muted">How close</p>
      <div className="relative mt-1 h-5 w-full rounded-full bg-ink/[0.08]">
        <div
          className={`h-full rounded-full ${passing ? 'bg-leaf' : 'bg-rose'}`}
          style={{ width: `${Math.round(score * 100)}%`, transition: 'width 0.2s ease-out' }}
        />
        <span className="absolute -top-1.5 h-8 w-1.5 rounded bg-ink/70" style={{ left: `${threshold * 100}%` }} aria-hidden />
      </div>
    </div>
  );
}

const CoachMessage: React.FC<CoachMessageProps> = ({ view, targetName, threshold, isCameraOn, isReady, onRestart, onNextPose, routineNext, routineDone }) => {
  let visual: React.ReactNode = null;
  let title = '';
  let body: React.ReactNode = null;
  let extra: React.ReactNode = null;

  if (!isReady) {
    title = 'Getting ready...';
    body = 'This takes a few seconds.';
  } else if (!targetName) {
    title = 'Pick a pose';
    body = 'Press Pick a pose at the top.';
  } else if (!isCameraOn) {
    title = 'Press Start camera';
    body = `Then we can do ${targetName} together.`;
  } else if (!view || view.phase === 'waiting') {
    title = 'Step back';
    body = 'Show your whole body, from head to toes.';
  } else if (view.phase === 'checking') {
    visual = <Countdown remaining={view.checkRemaining} total={CHECK_SECONDS} color="#E3908A" />;
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
    visual = <Countdown remaining={view.holdRemaining} total={HOLD_SECONDS} color="#4E8C71" />;
    title = 'Keep going';
    body = 'Breathe slowly.';
    extra = <CloseBar score={view.liveScore} threshold={threshold} />;
  } else if (view.phase === 'paused') {
    visual = <Countdown remaining={view.holdRemaining} total={HOLD_SECONDS} color="#B7C2C6" />;
    title = view.hint ?? 'Come back to the pose';
    body = 'The timer is waiting for you.';
  } else if (view.phase === 'complete' && routineNext) {
    visual = <Marker good burst />;
    title = 'Well done!';
    body = `Next up: ${routineNext}`;
    extra = (
      <button onClick={onNextPose} className="pt-btn mt-5 h-16 rounded-full bg-leaf px-8 text-2xl font-extrabold text-white">
        Go now
      </button>
    );
  } else if (view.phase === 'complete' && routineDone) {
    visual = <Marker good burst />;
    title = 'Routine done!';
    body = `You finished ${routineDone}.`;
    extra = (
      <div className="mt-5 flex flex-wrap gap-3">
        <button onClick={onRestart} className="pt-btn h-16 rounded-full bg-paper px-8 text-2xl font-extrabold text-ink">
          Again
        </button>
        <Link href="/routines" className="pt-btn inline-flex h-16 items-center rounded-full bg-leaf px-8 text-2xl font-extrabold text-white">
          More routines
        </Link>
      </div>
    );
  } else if (view.phase === 'complete') {
    visual = <Marker good burst />;
    title = 'Well done!';
    body = `You held ${targetName}.`;
    extra = (
      <div className="mt-5 flex flex-wrap gap-3">
        <button onClick={onRestart} className="pt-btn h-16 rounded-full bg-paper px-8 text-2xl font-extrabold text-ink">
          Again
        </button>
        <button onClick={onNextPose} className="pt-btn h-16 rounded-full bg-leaf px-8 text-2xl font-extrabold text-white">
          Next pose
        </button>
      </div>
    );
  }

  return (
    <div className="flex items-start gap-3 sm:gap-4">
      {/* she is the one talking */}
      <span className="mt-1 flex h-14 w-14 shrink-0 items-center justify-center overflow-hidden rounded-full bg-paper sm:mt-2 sm:h-20 sm:w-20" aria-hidden>
        <PoseFigure pose="Mountain Pose" decorative showGround={false} viewBox="70 32 60 60" className="h-full w-full" />
      </span>
      <div
        key={`${view?.phase ?? 'none'}-${title}`}
        className={`pt-pop relative flex min-w-0 flex-1 flex-col items-start gap-4 rounded-2xl rounded-tl-md px-5 py-5 sm:flex-row sm:items-center sm:gap-6 sm:px-7 sm:py-6 bg-card`}
        role="status"
        aria-live="polite"
      >
        {visual}
        <div className="min-w-0 flex-1 self-stretch sm:self-auto">
          <p className="text-3xl font-extrabold leading-tight tracking-tight text-ink sm:text-4xl">{title}</p>
          <p className="mt-1.5 text-xl leading-snug text-muted sm:text-2xl">{body}</p>
          {extra}
        </div>
      </div>
    </div>
  );
};

export default CoachMessage;
