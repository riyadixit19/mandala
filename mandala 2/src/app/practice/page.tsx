'use client';

import dynamic from 'next/dynamic';
import { LogoMark } from '../components/brand/Logo';

const YogaPoseDetector = dynamic(() => import('../YogaPoseDetector'), {
  ssr: false,
  loading: () => (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-[#F6F9F5] via-[#E6EFE8] to-[#D2E3D8]">
      <div className="flex flex-col items-center gap-4 text-muted">
        <LogoMark className="h-12 w-12 animate-[spin_6s_linear_infinite] text-pine" strokeWidth={3} />
        <p className="text-sm">Getting your mat ready</p>
      </div>
    </div>
  ),
});

export default function PracticePage() {
  return <YogaPoseDetector />;
}
