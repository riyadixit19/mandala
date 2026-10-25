// components/TopBar.tsx
// The bar along the top of every screen, like a game's: home and stars on the left,
// something in the middle, and room for a button on the right.
import React from 'react';
import Link from 'next/link';
import { FlowerSticker } from './brand/Logo';
import { StarTracker } from './Stars';

export default function TopBar({ center, right }: { center?: React.ReactNode; right?: React.ReactNode }) {
  return (
    <header className="mx-auto flex max-w-7xl items-start gap-3 px-4 pb-2 pt-4 sm:gap-6 sm:px-6">
      <div className="flex shrink-0 items-center gap-2">
        <Link href="/" className="pt-btn flex h-14 w-14 items-center justify-center rounded-full bg-card" aria-label="Mandala home">
          <FlowerSticker className="h-9 w-9" />
        </Link>
        <StarTracker />
      </div>
      <div className="mx-auto mt-3.5 min-w-0 max-w-md flex-1">{center}</div>
      <div className="flex h-14 w-14 shrink-0 items-center justify-center">{right}</div>
    </header>
  );
}

/** A plain round back button with a drawn arrow */
export function BackLink({ href, label }: { href: string; label: string }) {
  return (
    <Link href={href} aria-label={label} className="pt-btn flex h-14 w-14 items-center justify-center rounded-full bg-card text-ink">
      <svg viewBox="0 0 24 24" className="h-7 w-7" aria-hidden>
        <path d="M15 5 L8 12 L15 19" fill="none" stroke="currentColor" strokeWidth="3.2" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    </Link>
  );
}
