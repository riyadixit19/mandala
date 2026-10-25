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
        fill={filled ? '#F4AE1A' : 'none'}
        stroke={filled ? '#C98A07' : '#D9C9A8'}
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

/** The small star counter for the top-right corner */
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
      className="flex h-14 items-center gap-2 rounded-md border-2 border-marigold bg-marigold-soft px-3"
      aria-label={`${stars} ${stars === 1 ? 'star' : 'stars'} today`}
      role="img"
    >
      <StarShape key={bump} className={`h-9 w-9 ${bump ? 'pt-bump' : ''}`} />
      <span className="text-2xl font-black tabular-nums text-ink">{stars}</span>
    </div>
  );
}

/** Full-screen celebration when a star is earned. Closes by itself, or with a tap. */
export function StarCelebration({ stars, onClose }: { stars: number; onClose: () => void }) {
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
      <div className="pt-pop w-full max-w-md rounded-md border-2 border-marigold bg-card px-6 py-8 text-center" onClick={e => e.stopPropagation()}>
        <StarShape className="pt-star-in mx-auto h-40 w-40" />
        <h2 id="star-title" className="mt-4 text-5xl font-black text-ink">You got a star!</h2>
        <p className="mt-3 text-2xl text-muted">
          {gold && stars === 3
            ? 'Three stars today. It is a golden day!'
            : `You finished ${POSES_PER_STAR} different poses.`}
        </p>
        <button
          onClick={onClose}
          autoFocus
          className="pt-btn mt-6 h-16 w-full rounded-md border-2 border-pine-dark bg-pine text-3xl font-black text-white"
        >
          Yay!
        </button>
      </div>
    </div>
  );
}
