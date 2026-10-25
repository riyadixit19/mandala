// utils/practiceSession.ts
// The practice flow:
//   waiting   -> the whole body isn't in frame yet
//   checking  -> hold the pose for 5 seconds, then it's checked
//   incorrect -> shows what to fix, then checks again
//   correct   -> short confirmation, then the hold timer starts
//   holding   -> 15-second timer counts down while you stay in the pose
//   paused    -> you left the pose; the timer waits for you
//   complete  -> done

export type Phase = 'waiting' | 'checking' | 'incorrect' | 'correct' | 'holding' | 'paused' | 'complete';
export type SessionEvent = 'correct' | 'incorrect' | 'complete';

export interface FrameInput {
  visible: boolean;
  score: number;
  hint: string | null;
}

export interface SessionView {
  phase: Phase;
  /** seconds left in the 5-second check */
  checkRemaining: number;
  /** seconds left on the hold timer */
  holdRemaining: number;
  /** smoothed match score, 0-1 */
  liveScore: number;
  /** what to fix (incorrect / paused) */
  hint: string | null;
}

const LOST_BODY_MS = 1000; // body out of frame this long during the check restarts it
const VERDICT_WINDOW_MS = 2500; // the check is judged on the last 2.5 s of the hold
const CORRECT_SHOW_MS = 1500;
const INCORRECT_SHOW_MS = 3000;
const LEAVE_GRACE_MS = 2500; // wobbling out of the pose briefly doesn't pause the timer (balance is harder with low muscle tone)
const HOLD_SLACK = 0.08; // once you've passed, staying in the pose is slightly more forgiving

export class PracticeSession {
  private phase: Phase = 'waiting';
  private phaseStart = 0;
  private samples: { t: number; score: number; hint: string | null }[] = [];
  private lastSeen = 0;
  private holdLeft: number;
  private lastTick = 0;
  private outSince: number | null = null;
  private hint: string | null = null;
  private live = 0;

  constructor(private checkMs = 5000, private holdMs = 30000) {
    this.holdLeft = holdMs;
  }

  reset(now: number) {
    this.go('waiting', now);
    this.samples = [];
    this.holdLeft = this.holdMs;
    this.outSince = null;
    this.hint = null;
    this.live = 0;
  }

  private go(phase: Phase, now: number) {
    this.phase = phase;
    this.phaseStart = now;
  }

  update(now: number, frame: FrameInput | null, threshold: number): { view: SessionView; events: SessionEvent[] } {
    const events: SessionEvent[] = [];
    const visible = !!frame?.visible;
    const score = visible ? frame!.score : 0;
    if (visible) this.lastSeen = now;
    this.live = this.live + 0.35 * (score - this.live);
    const elapsed = now - this.phaseStart;

    switch (this.phase) {
      case 'waiting':
        if (visible) {
          this.samples = [];
          this.go('checking', now);
        }
        break;

      case 'checking': {
        if (!visible && now - this.lastSeen > LOST_BODY_MS) {
          this.go('waiting', now);
          break;
        }
        if (visible) this.samples.push({ t: now, score, hint: frame!.hint });
        if (elapsed >= this.checkMs) {
          const recent = this.samples.filter(s => now - s.t <= VERDICT_WINDOW_MS);
          const mean = recent.length ? recent.reduce((a, s) => a + s.score, 0) / recent.length : 0;
          const passing = recent.length ? recent.filter(s => s.score >= threshold).length / recent.length : 0;
          if (recent.length >= 3 && mean >= threshold && passing >= 0.5) {
            this.hint = null;
            this.go('correct', now);
            events.push('correct');
          } else {
            this.hint = mostCommon(recent.map(s => s.hint)) ?? 'Match the shape in the picture';
            this.go('incorrect', now);
            events.push('incorrect');
          }
        }
        break;
      }

      case 'incorrect':
        if (elapsed >= INCORRECT_SHOW_MS) {
          this.samples = [];
          this.go(visible ? 'checking' : 'waiting', now);
        }
        break;

      case 'correct':
        if (elapsed >= CORRECT_SHOW_MS) {
          this.holdLeft = this.holdMs;
          this.outSince = null;
          this.lastTick = now;
          this.go('holding', now);
        }
        break;

      case 'holding': {
        const dt = now - this.lastTick;
        this.lastTick = now;
        const inPose = visible && score >= threshold - HOLD_SLACK;
        if (inPose) {
          this.outSince = null;
          this.holdLeft -= dt;
        } else {
          this.outSince ??= now;
          if (now - this.outSince < LEAVE_GRACE_MS) {
            this.holdLeft -= dt;
          } else {
            this.hint = frame?.hint ?? null;
            this.go('paused', now);
          }
        }
        if (this.holdLeft <= 0) {
          this.holdLeft = 0;
          this.go('complete', now);
          events.push('complete');
        }
        break;
      }

      case 'paused': {
        this.lastTick = now;
        const inPose = visible && score >= threshold - HOLD_SLACK;
        if (inPose) {
          this.outSince = null;
          this.hint = null;
          this.go('holding', now);
        } else if (visible) {
          this.hint = frame!.hint ?? this.hint;
        }
        break;
      }

      case 'complete':
        break;
    }

    return {
      events,
      view: {
        phase: this.phase,
        checkRemaining: this.phase === 'checking' ? Math.max(0, (this.checkMs - (now - this.phaseStart)) / 1000) : this.checkMs / 1000,
        holdRemaining: this.holdLeft / 1000,
        liveScore: Math.max(0, Math.min(1, this.live)),
        hint: this.phase === 'incorrect' || this.phase === 'paused' ? this.hint : null,
      },
    };
  }
}

function mostCommon(items: (string | null)[]): string | null {
  const counts = new Map<string, number>();
  for (const i of items) if (i) counts.set(i, (counts.get(i) ?? 0) + 1);
  let best: string | null = null, n = 0;
  counts.forEach((c, k) => { if (c > n) { n = c; best = k; } });
  return best;
}
