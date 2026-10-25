'use client';

import dynamic from 'next/dynamic';
import { LogoMark } from '../components/brand/Logo';

const YogaPoseDetector = dynamic(() => import('../YogaPoseDetector'), {
  ssr: false,
  loading: () => (
    <div className="flex min-h-screen items-center justify-center bg-paper">
      <div className="flex flex-col items-center gap-5 text-ink">
        <LogoMark className="h-16 w-16 animate-[spin_5s_linear_infinite] text-rust motion-reduce:animate-none" strokeWidth={3.4} />
        <p className="text-2xl font-bold">Getting your mat ready...</p>
      </div>
    </div>
  ),
});

export default function PracticePage() {
  return <YogaPoseDetector />;
}
