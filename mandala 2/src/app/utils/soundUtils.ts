// utils/soundUtils.ts
import { SOUND_SETTINGS } from '../constants/yoga.constants';

let ctx: AudioContext | null = null;
const audio = () => {
  // FIX: reuse one AudioContext. Browsers cap how many can exist, and the old code made a new one per chime.
  if (!ctx) ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
  if (ctx.state === 'suspended') ctx.resume().catch(() => {});
  return ctx;
};

const tone = (freq: number, start: number, duration: number, gain = SOUND_SETTINGS.gain) => {
  const ac = audio();
  const osc = ac.createOscillator();
  const g = ac.createGain();
  osc.type = 'sine';
  osc.frequency.value = freq;
  osc.connect(g);
  g.connect(ac.destination);
  const t = ac.currentTime + start;
  g.gain.setValueAtTime(0.0001, t);
  g.gain.exponentialRampToValueAtTime(gain, t + 0.02);
  g.gain.exponentialRampToValueAtTime(0.0001, t + duration);
  osc.start(t);
  osc.stop(t + duration + 0.05);
};

/** Short chime: the pose is right */
export const playSuccessSound = (soundEnabled: boolean) => {
  if (!soundEnabled) return;
  try {
    tone(660, 0, 0.25);
    tone(880, 0.12, 0.35);
  } catch (e) {
    console.warn('Audio playback failed:', e);
  }
};

/** Three rising notes: the hold timer is done */
export const playCompleteSound = (soundEnabled: boolean) => {
  if (!soundEnabled) return;
  try {
    tone(523, 0, 0.3);
    tone(659, 0.15, 0.3);
    tone(784, 0.3, 0.6);
  } catch (e) {
    console.warn('Audio playback failed:', e);
  }
};

/** Call once from a click so mobile browsers allow sound later */
export const unlockAudio = () => {
  try { audio(); } catch { /* no audio support */ }
};
