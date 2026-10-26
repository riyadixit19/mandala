// src/app/start/page.tsx: after Start, choose one pose at a time or a routine
import Link from 'next/link';
import Scene from '../components/Scene';
import TopBar from '../components/TopBar';
import PoseCarousel from '../figure/PoseCarousel';

export const metadata = { title: 'Choose' };

export default function StartPage() {
  return (
    <div className="min-h-screen bg-paper text-ink">
      <TopBar />
      <main className="mx-auto max-w-5xl px-4 pb-12 pt-4 sm:px-6">
        <h1 className="font-display text-5xl font-bold tracking-tight sm:text-6xl">What should we do?</h1>

        <div className="mt-8 grid gap-5 sm:grid-cols-2">
          <Link href="/poses" className="pt-btn group block">
            <Scene pose="Tree Pose" hill={0.26} figure={0.64} className="aspect-[4/3] w-full rounded-2xl" title="A girl doing Tree Pose" />
            <div className="mt-4 px-1">
              <p className="font-display text-4xl font-bold">One pose</p>
              <p className="mt-1 text-xl text-muted">Pick any pose and practice it.</p>
            </div>
          </Link>

          <Link href="/routines" className="pt-btn group block">
            <PoseCarousel className="aspect-[4/3] w-full rounded-2xl" hill={0.26} figure={0.64} startAt={1} />
            <div className="mt-4 px-1">
              <p className="font-display text-4xl font-bold">Routines</p>
              <p className="mt-1 text-xl text-muted">Poses one after another. Finish one for a star!</p>
            </div>
          </Link>
        </div>
      </main>
    </div>
  );
}
