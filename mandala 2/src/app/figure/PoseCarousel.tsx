// figure/PoseCarousel.tsx
// The character flows from pose to pose on the home screen.
'use client';

import React, { useEffect, useState } from 'react';
import PoseFigure from './PoseFigure';

const POSES = ['Tree Pose', 'Warrior II', 'Chair Pose', 'Triangle Pose', 'Mountain Pose', 'Downward Dog', 'Cobra Pose'];
const EVERY_MS = 2600;

export default function PoseCarousel({ className }: { className?: string }) {
  const [i, setI] = useState(0);
  useEffect(() => {
    if (window.matchMedia?.('(prefers-reduced-motion: reduce)').matches) return;
    const id = window.setInterval(() => setI(n => (n + 1) % POSES.length), EVERY_MS);
    return () => window.clearInterval(id);
  }, []);
  return <PoseFigure pose={POSES[i]} animate className={className} title="A girl doing yoga poses" />;
}
