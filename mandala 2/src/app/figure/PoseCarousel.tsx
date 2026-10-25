// figure/PoseCarousel.tsx
// The character flows from pose to pose on the home screen.
'use client';

import React, { useEffect, useState } from 'react';
import Scene from '../components/Scene';

const POSES = ['Tree Pose', 'Warrior II', 'Chair Pose', 'Triangle Pose', 'Mountain Pose', 'Eagle Pose', 'Dancer Pose'];
const EVERY_MS = 2600;

export default function PoseCarousel({ className, hill, figure, startAt = 0 }: { className?: string; hill?: number; figure?: number; startAt?: number }) {
  const [i, setI] = useState(startAt % POSES.length);
  useEffect(() => {
    if (window.matchMedia?.('(prefers-reduced-motion: reduce)').matches) return;
    const id = window.setInterval(() => setI(n => (n + 1) % POSES.length), EVERY_MS);
    return () => window.clearInterval(id);
  }, []);
  return <Scene pose={POSES[i]} className={className} hill={hill} figure={figure} title="A girl doing yoga poses on a hill" />;
}
