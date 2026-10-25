// components/SessionOverlay.tsx
import React from 'react';
import { Check, RotateCcw, ArrowRight, X } from 'lucide-react';
import { SessionView } from '../utils/practiceSession';
import { CHECK_SECONDS, HOLD_SECONDS } from '../constants/yoga.constants';

interface SessionOverlayProps {
  view: SessionView | null;
  targetName: string | null;
  threshold: number;
  onRestart: () => void;
  onNextPose: () => void;
}

function Ring({ remaining, total, tone }: { remaining: number; total: number; tone: 'marigold' | 'pine' | 'muted' }) {
  const r = 27;
  const c = 2 * Math.PI * r;
  const frac = Math.max(0, Math.min(1, remaining / total));
  const color = tone === 'marigold' ? '#E39B3A' : tone === 'pine' ? '#2F5D50' : '#A9B2AD';
  const n = Math.ceil(remaining);
  return (
    <div className="relative h-[68px] w-[68px] shrink-0">
      <svg viewBox="0 0 64 64" className="h-full w-full -rotate-90">
        <circle cx="32" cy="32" r={r} fill="none" stroke="#E8EBE6" strokeWidth="5" />
        <circle
          cx="32" cy="32" r={r} fill="none" stroke={color} strokeWidth="5" strokeLinecap="round"
          strokeDasharray={c} strokeDashoffset={c * (1 - frac)}
          style={{ transition: 'stroke-dashoffset 0.15s linear' }}
        />
      </svg>
      <span key={n} className="pt-tick absolute inset-0 flex items-center justify-center font-display text-[2rem] leading-none text-ink tabular-nums">
        {n}
      </span>
    </div>
  );
}

function Badge({ tone, children }: { tone: 'good' | 'bad'; children: React.ReactNode }) {
  return (
    <span className={`flex h-[68px] w-[68px] shrink-0 items-center justify-center rounded-full ${tone === 'good' ? 'bg-marigold text-ink' : 'bg-rust-soft text-rust'}`}>
      {children}
    </span>
  );
}

function MatchBar({ score, threshold }: { score: number; threshold: number }) {
  const pct = Math.round(score * 100);
  const passing = score >= threshold;
  return (
    <div className="mt-2.5">
      <div className="relative h-1.5 w-full rounded-full bg-[#E8EBE6]">
        <div className={`h-full rounded-full transition-[width] duration-200 ${passing ? 'bg-pine' : 'bg-marigold'}`} style={{ width: `${pct}%` }} />
        <span className="absolute -top-1 h-3.5 w-0.5 rounded bg-ink/50" style={{ left: `${threshold * 100}%` }} aria-hidden />
      </div>
      <p className="mt-1 text-xs text-muted">Match {pct}%</p>
    </div>
  );
}

const SessionOverlay: React.FC<SessionOverlayProps> = ({ view, targetName, threshold, onRestart, onNextPose }) => {
  let visual: React.ReactNode = null;
  let title = '';
  let body: React.ReactNode = null;
  let extra: React.ReactNode = null;
  const panelTone = 'bg-white/90';

  if (!targetName) {
    title = 'Pick a pose to begin';
    body = 'Choose one from the pose library below.';
  } else if (!view || view.phase === 'waiting') {
    title = 'Step into the frame';
    body = 'Stand back until your whole body, head to feet, is visible.';
  } else if (view.phase === 'checking') {
    visual = <Ring remaining={view.checkRemaining} total={CHECK_SECONDS} tone="marigold" />;
    title = `Hold ${targetName}`;
    body = 'Stay still. Your pose is checked when the count reaches zero.';
    extra = <MatchBar score={view.liveScore} threshold={threshold} />;
  } else if (view.phase === 'incorrect') {
    visual = <Badge tone="bad"><X size={30} strokeWidth={2.5} /></Badge>;
    title = 'Not quite yet';
    body = <>{view.hint ?? 'Match the shape in the picture'}. Checking again in a moment.</>;
  } else if (view.phase === 'correct') {
    visual = <Badge tone="good"><Check size={32} strokeWidth={2.75} /></Badge>;
    title = 'That’s it!';
    body = `Now hold it for ${HOLD_SECONDS} seconds.`;
  } else if (view.phase === 'holding') {
    visual = <Ring remaining={view.holdRemaining} total={HOLD_SECONDS} tone="pine" />;
    title = 'Keep holding';
    body = `Breathe slowly and stay in ${targetName}.`;
    extra = <MatchBar score={view.liveScore} threshold={threshold} />;
  } else if (view.phase === 'paused') {
    visual = <Ring remaining={view.holdRemaining} total={HOLD_SECONDS} tone="muted" />;
    title = 'Timer paused';
    body = view.hint ? `${view.hint} to get back into ${targetName}.` : `Get back into ${targetName} to keep going.`;
  } else if (view.phase === 'complete') {
    visual = <Badge tone="good"><Check size={32} strokeWidth={2.75} /></Badge>;
    title = 'Well done!';
    body = `You held ${targetName} for ${HOLD_SECONDS} seconds.`;
    extra = (
      <div className="mt-3 flex gap-2">
        <button onClick={onRestart} className="inline-flex h-9 items-center gap-1.5 rounded-full bg-white px-4 text-sm font-semibold text-ink shadow-[inset_0_0_0_1px_#DDE1DA] hover:shadow-[inset_0_0_0_1px_rgba(29,42,38,0.35)]">
          <RotateCcw size={15} /> Go again
        </button>
        <button onClick={onNextPose} className="inline-flex h-9 items-center gap-1.5 rounded-full bg-pine px-4 text-sm font-semibold text-white hover:bg-pine-dark">
          Next pose <ArrowRight size={15} />
        </button>
      </div>
    );
  }

  return (
    <div
      key={`${view?.phase ?? 'none'}-${targetName ?? ''}`}
      className={`pt-rise absolute bottom-3 left-1/2 flex w-[min(94%,27rem)] -translate-x-1/2 items-center gap-4 rounded-[1.4rem] ${panelTone} p-4 shadow-[0_10px_34px_rgba(29,42,38,0.2)] backdrop-blur-xl sm:bottom-4`}
      role="status"
      aria-live="polite"
    >
      {visual}
      <div className="min-w-0 flex-1">
        <p className="font-semibold leading-snug text-ink">{title}</p>
        <p className="mt-0.5 text-sm leading-snug text-muted">{body}</p>
        {extra}
      </div>
    </div>
  );
};

export default SessionOverlay;
