// components/Scene.tsx
// The calm outdoor scene the character lives in: flat sky, a few soft clouds and a sage hill.
import React from 'react';
import PoseFigure from '../figure/PoseFigure';

/** A soft cloud made of overlapping circles */
export function Cloud({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 120 56" className={className} aria-hidden>
      <g fill="#F9FCFD">
        <circle cx="34" cy="34" r="20" />
        <circle cx="60" cy="24" r="24" />
        <circle cx="88" cy="34" r="19" />
        <rect x="16" y="34" width="90" height="20" rx="10" />
      </g>
    </svg>
  );
}

interface SceneProps {
  /** pose for the character standing on the hill */
  pose: string;
  /** how much of the scene's height the hill takes, as a fraction */
  hill?: number;
  /** how much of the scene's height the character takes, as a fraction */
  figure?: number;
  animate?: boolean;
  /** extra class for the character's wrapper, e.g. a jump animation */
  figureClassName?: string;
  className?: string;
  title?: string;
  children?: React.ReactNode;
}

// her feet sit at y=178 in the 200-unit drawing, so 11% of the drawing is below them
const BELOW_FEET = 22 / 200;

export default function Scene({ pose, hill = 0.28, figure = 0.62, animate = true, figureClassName, className, title, children }: SceneProps) {
  // stand her feet on the top of the hill
  const bottom = (hill - BELOW_FEET * figure) * 100;
  return (
    <div className={`relative overflow-hidden bg-[#DCEEF3] ${className ?? ''}`}>
      <Cloud className="absolute -left-[6%] top-[30%] w-[30%]" />
      <Cloud className="absolute -right-[4%] top-[22%] w-[24%]" />
      <Cloud className="absolute right-[8%] top-[52%] w-[16%]" />
      <div
        className="absolute -inset-x-[25%] bottom-0 bg-hill"
        style={{ height: `${hill * 100}%`, borderRadius: '50% 50% 0 0 / 100% 100% 0 0' }}
        aria-hidden
      />
      <div
        className="absolute left-1/2 aspect-square -translate-x-1/2"
        style={{ height: `${figure * 100}%`, bottom: `${bottom}%` }}
      >
        <div className={`h-full w-full ${figureClassName ?? ''}`}>
          <PoseFigure pose={pose} animate={animate} showGround={false} className="block h-full w-full" title={title} />
        </div>
      </div>
      {children}
    </div>
  );
}
