// src/app/page.tsx — the Mandala home screen
import Link from 'next/link';
import { LogoMark } from './components/brand/Logo';

export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-gradient-to-br from-[#FDEEF3] via-[#F9D3E0] to-[#F2B6CB] px-6 text-center text-ink">
      <LogoMark className="h-28 w-28 text-pine sm:h-36 sm:w-36" strokeWidth={2.6} />
      <h1 className="mt-6 font-display text-7xl leading-none tracking-tight sm:text-8xl">Mandala</h1>
      <p className="mt-5 text-lg text-ink/70">Your data is never saved. Your yoga is safe with me.</p>
      <Link
        href="/practice"
        className="mt-10 inline-flex h-14 items-center rounded-full bg-pine px-10 text-[17px] font-semibold text-white transition-colors hover:bg-pine-dark"
      >
        Start now
      </Link>
    </main>
  );
}
