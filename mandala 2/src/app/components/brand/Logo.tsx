// components/brand/Logo.tsx
import React from 'react';

/** Petal pointing up from the centre, in a 100x100 box centred on 0,0 */
const PETAL = 'M0 -10 C 11 -19 12 -33 0 -46 C -12 -33 -11 -19 0 -10 Z';

/** Mandala's mark: the outline of a flower. Uses currentColor, so set colour with text-* classes. */
export function LogoMark({ className, strokeWidth = 3 }: { className?: string; strokeWidth?: number }) {
  return (
    <svg viewBox="-50 -50 100 100" className={className} fill="none" stroke="currentColor" strokeWidth={strokeWidth} strokeLinejoin="round" aria-hidden>
      {Array.from({ length: 8 }, (_, i) => (
        <path key={i} d={PETAL} transform={`rotate(${i * 45})`} />
      ))}
      <circle r="5" />
    </svg>
  );
}

export function Wordmark({ className }: { className?: string }) {
  return (
    <span className={`inline-flex items-center gap-3 ${className ?? ''}`}>
      <LogoMark className="h-10 w-10 text-rust" strokeWidth={3.6} />
      <span className="text-3xl font-black leading-none tracking-tight text-ink max-[420px]:hidden">Mandala</span>
    </span>
  );
}
