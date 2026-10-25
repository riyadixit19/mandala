// src/app/page.tsx: the Mandala home screen
import Link from 'next/link';
import { LogoMark } from './components/brand/Logo';
import PoseFigure from './figure/PoseFigure';

export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-paper px-6 py-12 text-center text-ink">
      <LogoMark className="h-20 w-20 text-pine sm:h-24 sm:w-24" strokeWidth={3} />
      <h1 className="mt-4 text-6xl font-bold tracking-tight sm:text-7xl">Mandala</h1>
      <p className="mt-4 text-2xl text-muted">Yoga with a friend.</p>

      <PoseFigure pose="Tree Pose" animate className="mt-6 block h-64 w-64 sm:h-80 sm:w-80" title="A girl doing Tree Pose" />

      <Link
        href="/practice"
        className="mt-6 inline-flex h-20 items-center rounded-md bg-pine px-14 text-3xl font-semibold text-white hover:bg-pine-dark"
      >
        Start
      </Link>
      <p className="mt-6 max-w-md text-lg text-muted">Nothing is saved. The camera stays on this device.</p>
    </main>
  );
}
