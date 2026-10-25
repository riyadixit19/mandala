'use client';

import dynamic from 'next/dynamic';
import { FlowerSticker } from '../components/brand/Logo';

const YogaPoseDetector = dynamic(() => import('../YogaPoseDetector'), {
  ssr: false,
  loading: () => (
    <div className="flex min-h-screen items-center justify-center bg-paper">
      <div className="flex flex-col items-center gap-5 text-ink">
        <FlowerSticker className="h-16 w-16 animate-[spin_5s_linear_infinite] motion-reduce:animate-none" />
        <p className="text-2xl font-bold">Getting your mat ready...</p>
      </div>
    </div>
  ),
});

export default function PracticePage() {
  return <YogaPoseDetector />;
}
