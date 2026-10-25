'use client';
// src/app/routines/page.tsx: routines to follow, the ones you made, and a maker for new ones.

import React, { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { PoseDataItem } from '../types/yoga.types';
import { POSES_JSON_PATH } from '../constants/yoga.constants';
import { groupPoses, GROUP_TILES } from '../utils/poseGroups';
import { ROUTINES, NECK_CAUTION, Routine, RoutineColor, minutesFor, readCustomRoutines, saveCustomRoutine, deleteCustomRoutine } from '../utils/routines';
import PoseFigure from '../figure/PoseFigure';
import TopBar, { BackLink } from '../components/TopBar';

const SOFT: Record<RoutineColor, string> = {
  leaf: 'bg-leaf-soft',
  lilac: 'bg-lilac-soft',
  rose: 'bg-rose-soft',
  peach: 'bg-peach-soft',
  sun: 'bg-sun-soft',
};
const MAX_POSES = 12;

function RoutineCard({ routine, onDelete }: { routine: Routine; onDelete?: () => void }) {
  // show each pose once, up to four, as a little line-up
  const lineup = Array.from(new Set(routine.poses)).slice(0, 4);
  return (
    <li className="flex flex-col rounded-2xl bg-card p-3">
      <div className={`flex items-end justify-center rounded-xl px-2 pt-3 ${SOFT[routine.color]}`}>
        {lineup.map(p => (
          <PoseFigure key={p} pose={p} showGround={false} decorative className="-mx-2 aspect-square w-1/4 max-w-[110px]" />
        ))}
      </div>
      <div className="flex flex-1 flex-col px-2 pb-1 pt-4">
        <h3 className="font-display text-3xl font-bold leading-tight">{routine.name}</h3>
        <p className="mt-1 text-lg text-muted">{routine.blurb}</p>
        <p className="mt-2 text-base font-bold text-muted">
          {routine.poses.length} poses, about {minutesFor(routine)} min
        </p>
        <div className="mt-auto flex items-center gap-3 pt-4">
          <Link href={`/practice?routine=${encodeURIComponent(routine.id)}`} className="pt-btn inline-flex h-14 flex-1 items-center justify-center rounded-full bg-leaf text-xl font-extrabold text-white">
            Start
          </Link>
          {onDelete && (
            <button onClick={onDelete} className="pt-btn h-14 rounded-full bg-paper px-5 text-lg font-bold text-muted">
              Delete
            </button>
          )}
        </div>
      </div>
    </li>
  );
}

/** Make a routine: tap poses to add them in order, give it a name, save it */
function RoutineMaker({ poses, onSaved, onCancel }: { poses: PoseDataItem[]; onSaved: () => void; onCancel: () => void }) {
  const [name, setName] = useState('');
  const [picked, setPicked] = useState<string[]>([]);
  // neck-loading poses are left out here; a grown-up can still try them one at a time
  const groups = useMemo(
    () => groupPoses(poses).map(g => ({ ...g, items: g.items.filter(({ pose }) => !NECK_CAUTION.includes(pose.name)) })).filter(g => g.items.length),
    [poses]
  );
  const full = picked.length >= MAX_POSES;

  return (
    <section className="mt-6 rounded-2xl bg-card p-4 sm:p-6" aria-labelledby="maker-title">
      <h2 id="maker-title" className="font-display text-4xl font-bold">Make my own</h2>

      <label className="mt-5 block">
        <span className="text-xl font-extrabold">Name</span>
        <input
          value={name}
          onChange={e => setName(e.target.value)}
          placeholder="My routine"
          maxLength={30}
          className="mt-2 h-14 w-full rounded-full bg-paper px-5 text-xl text-ink placeholder:text-muted focus:outline-none focus:ring-4 focus:ring-lilac"
        />
      </label>

      <div className="mt-6">
        <p className="text-xl font-extrabold">
          My poses <span className="font-bold text-muted">({picked.length})</span>
        </p>
        {picked.length === 0 ? (
          <p className="mt-2 text-lg text-muted">Tap poses below to add them, in order.</p>
        ) : (
          <ol className="mt-3 flex flex-wrap gap-2">
            {picked.map((p, i) => (
              <li key={`${p}-${i}`}>
                <button
                  onClick={() => setPicked(list => list.filter((_, j) => j !== i))}
                  className="pt-btn flex items-center gap-2 rounded-full bg-paper py-1 pl-1 pr-4 text-lg font-bold"
                  aria-label={`Remove ${p}`}
                >
                  <span className="flex h-10 w-10 items-center justify-center rounded-full bg-card text-base font-extrabold">{i + 1}</span>
                  {p}
                  <span className="text-muted" aria-hidden>
                    x
                  </span>
                </button>
              </li>
            ))}
          </ol>
        )}
      </div>

      <div className="mt-6 max-h-[55vh] overflow-y-auto rounded-xl bg-paper p-3">
        {groups.map((g, gi) => (
          <div key={g.name} className="mb-4 last:mb-0">
            <p className="px-1 pb-2 text-lg font-extrabold">{g.name}</p>
            <div className="grid grid-cols-3 gap-2 sm:grid-cols-5 lg:grid-cols-6">
              {g.items.map(({ pose }) => (
                <button
                  key={pose.name}
                  disabled={full}
                  onClick={() => setPicked(list => [...list, pose.name])}
                  className={`pt-btn flex flex-col items-center rounded-md px-1 pb-2 text-center disabled:opacity-50 ${GROUP_TILES[gi % GROUP_TILES.length]}`}
                >
                  <PoseFigure pose={pose.name} showGround={false} decorative className="block aspect-square w-full max-w-[90px]" />
                  <span className="text-sm font-bold leading-tight">{pose.name}</span>
                </button>
              ))}
            </div>
          </div>
        ))}
      </div>
      {full && <p className="mt-2 text-lg text-muted">That is {MAX_POSES} poses, the most for one routine.</p>}

      <div className="mt-5 flex flex-wrap gap-3">
        <button
          disabled={picked.length < 2}
          onClick={() => {
            saveCustomRoutine(name, picked);
            onSaved();
          }}
          className="pt-btn h-16 flex-1 rounded-full bg-leaf px-8 text-2xl font-extrabold text-white disabled:bg-line disabled:text-muted"
        >
          Save routine
        </button>
        <button onClick={onCancel} className="pt-btn h-16 rounded-full bg-paper px-8 text-2xl font-extrabold">
          Cancel
        </button>
      </div>
      {picked.length < 2 && <p className="mt-2 text-lg text-muted">Pick at least 2 poses.</p>}
    </section>
  );
}

export default function RoutinesPage() {
  const [poses, setPoses] = useState<PoseDataItem[]>([]);
  const [mine, setMine] = useState<Routine[]>([]);
  const [making, setMaking] = useState(false);

  useEffect(() => {
    setMine(readCustomRoutines());
    fetch(POSES_JSON_PATH)
      .then(r => r.json())
      .then(setPoses)
      .catch(() => setPoses([]));
  }, []);

  return (
    <div className="min-h-screen bg-paper text-ink">
      <TopBar right={<BackLink href="/start" label="Back" />} />
      <main className="mx-auto max-w-6xl px-4 pb-12 pt-4 sm:px-6">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <h1 className="font-display text-5xl font-bold tracking-tight sm:text-6xl">Routines</h1>
            <p className="mt-2 text-xl text-muted">Do the poses one after another. Finish a routine to earn a star!</p>
          </div>
          {!making && (
            <button onClick={() => setMaking(true)} className="pt-btn h-16 rounded-full bg-card px-7 text-2xl font-extrabold">
              Make my own
            </button>
          )}
        </div>

        {making && (
          <RoutineMaker
            poses={poses}
            onCancel={() => setMaking(false)}
            onSaved={() => {
              setMine(readCustomRoutines());
              setMaking(false);
            }}
          />
        )}

        {mine.length > 0 && (
          <section className="mt-10" aria-labelledby="mine-title">
            <h2 id="mine-title" className="text-2xl font-extrabold">My routines</h2>
            <ul className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {mine.map(r => (
                <RoutineCard
                  key={r.id}
                  routine={r}
                  onDelete={() => {
                    deleteCustomRoutine(r.id);
                    setMine(readCustomRoutines());
                  }}
                />
              ))}
            </ul>
          </section>
        )}

        <section className="mt-10" aria-labelledby="ready-title">
          <h2 id="ready-title" className="text-2xl font-extrabold">Ready to go</h2>
          <ul className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {ROUTINES.map(r => (
              <RoutineCard key={r.id} routine={r} />
            ))}
          </ul>
          <p className="mt-6 max-w-2xl text-lg text-muted">
            For grown-ups: these routines leave out poses that put weight on the neck, like headstand and shoulder stand, because children with
            Down syndrome can have a looser neck joint. Check with your child&apos;s doctor before trying those.
          </p>
        </section>
      </main>
    </div>
  );
}
