// src/app/page.tsx: the Mandala home screen
import Link from 'next/link';
import { LogoMark } from './components/brand/Logo';
import { StarTracker } from './components/Stars';
import PoseCarousel from './figure/PoseCarousel';

export default function Home() {
  return (
    <main className="relative flex min-h-screen flex-col items-center justify-center bg-paper px-6 py-12 text-center text-ink">
      <div className="absolute right-4 top-4 sm:right-6 sm:top-6">
        <StarTracker />
      </div>

      <LogoMark className="h-20 w-20 text-pink sm:h-24 sm:w-24" strokeWidth={3.4} />
      <h1 className="mt-3 text-6xl font-black tracking-tight sm:text-7xl">Mandala</h1>
      <p className="mt-3 text-2xl font-bold text-blue">Yoga with a friend</p>

      <div className="mt-6 rounded-md bg-purple-soft px-6">
        <PoseCarousel className="block h-64 w-64 sm:h-80 sm:w-80" />
      </div>

      <Link
        href="/practice"
        className="pt-btn mt-8 inline-flex h-20 items-center rounded-md border-2 border-purple-dark bg-purple px-16 text-3xl font-black text-white"
      >
        Start
      </Link>
      <p className="mt-6 max-w-md text-lg text-muted">Nothing is saved. The camera stays on this device.</p>
    </main>
  );
}
