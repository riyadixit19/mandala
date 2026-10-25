// components/Stars.tsx
// The star shape, the star counter in the corner, the golden-day background and the
// "you got a star" celebration.
'use client';

import React, { useEffect, useRef, useState } from 'react';
import { readStars, isGoldDay, STARS_EVENT, POSES_PER_STAR } from '../utils/stars';

const STAR_PATH = 'M50 4 L62 36 L96 37 L69 58 L79 92 L50 72 L21 92 L31 58 L4 37 L38 36 Z';

export function StarShape({ className, filled = true }: { className?: string; filled?: boolean }) {
  return (
    <svg viewBox="0 0 100 100" className={className} aria-hidden>
      <path
        d={STAR_PATH}
        fill={filled ? '#F0C24B' : 'none'}
        stroke={filled ? '#D7A62B' : '#C9D4D8'}
        strokeWidth={6}
        strokeLinejoin="round"
      />
    </svg>
  );
}

/** Today's stars, kept in sync with storage and with other tabs */
export function useStarsToday(): number {
  const [stars, setStars] = useState(0);
  useEffect(() => {
    const update = () => setStars(readStars());
    update();
    window.addEventListener(STARS_EVENT, update);
    window.addEventListener('storage', update);
    window.addEventListener('focus', update);
    return () => {
      window.removeEventListener(STARS_EVENT, update);
      window.removeEventListener('storage', update);
      window.removeEventListener('focus', update);
    };
  }, []);
  return stars;
}

/** Turns the page background golden on a three-star day. Renders nothing. */
export function DayTheme() {
  const stars = useStarsToday();
  useEffect(() => {
    const root = document.documentElement;
    if (isGoldDay(stars)) root.dataset.day = 'gold';
    else delete root.dataset.day;
  }, [stars]);
  return null;
}

/** The small star counter for the top corner, like a coin count in a game */
export function StarTracker() {
  const stars = useStarsToday();
  const first = useRef(true);
  const [bump, setBump] = useState(0);
  useEffect(() => {
    if (first.current) {
      first.current = false;
      return;
    }
    setBump(b => b + 1);
  }, [stars]);

  return (
    <div
      className="flex h-14 items-center gap-1.5"
      aria-label={`${stars} ${stars === 1 ? 'star' : 'stars'} today`}
      role="img"
    >
      <StarShape key={bump} className={`h-8 w-8 ${bump ? 'pt-bump' : ''}`} />
      <span className="text-2xl font-extrabold tabular-nums text-ink">{stars}</span>
    </div>
  );
}

/** The bar along the top: how many different poses are done on the way to the next star
 *  (or, in a routine, how far through it you are) */
export function StarProgressBar({ done, total = POSES_PER_STAR, label }: { done: number; total?: number; label?: string }) {
  return (
    <div className="w-full">
      <div
        className="h-7 w-full overflow-hidden rounded-full bg-ink/[0.08]"
        role="progressbar"
        aria-valuemin={0}
        aria-valuemax={total}
        aria-valuenow={done}
        aria-label={label ?? 'Different poses done on the way to the next star'}
      >
        <div className="h-full rounded-full bg-sun-soft" style={{ width: `${(done / total) * 100}%`, transition: 'width 0.6s ease-out' }} />
      </div>
      <p className="mt-1 text-center text-base font-extrabold text-ink sm:text-lg">
        {label ?? `${done} of ${total}`}
      </p>
    </div>
  );
}

/** Full-screen celebration when a star is earned. Closes by itself, or with a tap. */
export function StarCelebration({ stars, reason, onClose }: { stars: number; reason?: string | null; onClose: () => void }) {
  const onCloseRef = useRef(onClose);
  onCloseRef.current = onClose;
  useEffect(() => {
    const t = window.setTimeout(() => onCloseRef.current(), 6000);
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onCloseRef.current();
    window.addEventListener('keydown', onKey);
    return () => {
      window.clearTimeout(t);
      window.removeEventListener('keydown', onKey);
    };
  }, []);
  const gold = isGoldDay(stars);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-ink/60 p-6" onClick={onClose} role="alertdialog" aria-labelledby="star-title">
      <div className="pt-pop w-full max-w-md rounded-2xl bg-card px-6 py-10 text-center" onClick={e => e.stopPropagation()}>
        <StarShape className="pt-star-in mx-auto h-40 w-40" />
        <h2 id="star-title" className="mt-4 font-display text-5xl font-bold text-ink">You got a star!</h2>
        <p className="mt-3 text-2xl text-muted">
          {reason ?? `You finished ${POSES_PER_STAR} different poses.`}
          {gold && stars === 3 && ' Three stars today. It is a golden day!'}
        </p>
        <button
          onClick={onClose}
          autoFocus
          className="pt-btn mt-8 h-16 w-full rounded-full bg-leaf text-3xl font-extrabold text-white"
        >
          Yay!
        </button>
      </div>
    </div>
  );
}
