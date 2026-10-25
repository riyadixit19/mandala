// src/app/page.tsx: the Mandala home screen. The whole page is the scene.
import Link from 'next/link';
import { StarTracker } from './components/Stars';
import PoseCarousel from './figure/PoseCarousel';

export default function Home() {
  return (
    <main className="relative h-[100svh] min-h-[560px] text-ink">
      <div className="absolute inset-0">
        <PoseCarousel className="h-full w-full" hill={0.3} figure={0.46} />
      </div>

      <header className="absolute inset-x-0 top-0 flex items-center justify-between px-5 pt-5 sm:px-8">
        <StarTracker />
      </header>

      <div className="absolute inset-x-0 top-[9%] px-6 text-center">
        <h1 className="font-display text-6xl font-bold tracking-tight sm:text-7xl">mandala</h1>
        <p className="mt-2 text-xl font-semibold text-muted sm:text-2xl">yoga with a friend</p>
      </div>

      <div className="absolute inset-x-0 bottom-[7%] flex flex-col items-center px-6">
        <Link href="/start" className="pt-btn inline-flex h-20 items-center rounded-full bg-card px-16 text-3xl font-extrabold text-ink">
          Start
        </Link>
        <p className="mt-4 text-center text-base font-semibold text-card/90">Nothing is saved. The camera stays on this device.</p>
      </div>
    </main>
  );
}
