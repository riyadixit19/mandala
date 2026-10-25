'use client';

import dynamic from 'next/dynamic';
import { LogoMark } from '../components/brand/Logo';

const YogaPoseDetector = dynamic(() => import('../YogaPoseDetector'), {
  ssr: false,
  loading: () => (
    <div className="flex min-h-screen items-center justify-center bg-paper">
      <div className="flex flex-col items-center gap-5 text-ink">
        <LogoMark className="h-16 w-16 text-pine" strokeWidth={3} />
        <p className="text-2xl">Getting your mat ready...</p>
      </div>
    </div>
  ),
});

export default function PracticePage() {
  return <YogaPoseDetector />;
}
