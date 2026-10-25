'use client';
// src/app/poses/page.tsx: every pose as a picture tile. Tap one to practise it.

import React, { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { PoseDataItem } from '../types/yoga.types';
import { POSES_JSON_PATH } from '../constants/yoga.constants';
import { groupPoses, GROUP_TILES, GROUP_DOTS } from '../utils/poseGroups';
import { NECK_CAUTION } from '../utils/routines';
import PoseFigure from '../figure/PoseFigure';
import TopBar, { BackLink } from '../components/TopBar';

export default function PosesPage() {
  const [poses, setPoses] = useState<PoseDataItem[]>([]);
  useEffect(() => {
    fetch(POSES_JSON_PATH)
      .then(r => r.json())
      .then(setPoses)
      .catch(() => setPoses([]));
  }, []);
  const groups = useMemo(() => groupPoses(poses), [poses]);

  return (
    <div className="min-h-screen bg-paper text-ink">
      <TopBar right={<BackLink href="/start" label="Back" />} />
      <main className="mx-auto max-w-6xl px-4 pb-12 pt-4 sm:px-6">
        <h1 className="font-display text-5xl font-bold tracking-tight sm:text-6xl">Pick a pose</h1>
        <p className="mt-2 text-xl text-muted">Tap a picture to try it.</p>

        {groups.map((g, gi) => (
          <section key={g.name} className="mt-9" aria-labelledby={`kind-${gi}`}>
            <h2 id={`kind-${gi}`} className="flex items-center gap-2.5 text-2xl font-extrabold">
              <span className={`h-4 w-4 rounded-full ${GROUP_DOTS[gi % GROUP_DOTS.length]}`} aria-hidden />
              {g.name}
            </h2>
            <ul className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
              {g.items.map(({ pose }) => (
                <li key={pose.name}>
                  <Link
                    href={`/practice?pose=${encodeURIComponent(pose.name)}`}
                    className={`pt-btn flex flex-col items-center rounded-xl px-3 pb-4 pt-2 text-center ${GROUP_TILES[gi % GROUP_TILES.length]}`}
                  >
                    <PoseFigure pose={pose.name} showGround={false} decorative className="block aspect-square w-full max-w-[170px]" />
                    <span className="text-xl font-bold leading-tight">{pose.name}</span>
                    {NECK_CAUTION.includes(pose.name) && (
                      <span className="mt-2 rounded-full bg-card px-3 py-1 text-sm font-bold text-muted">Ask a doctor first</span>
                    )}
                  </Link>
                </li>
              ))}
            </ul>
          </section>
        ))}
      </main>
    </div>
  );
}
