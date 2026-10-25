// components/PoseLibrary.tsx
import React, { useMemo, useState } from 'react';
import { PoseDataItem } from '../types/yoga.types';
import { POSE_CATEGORIES } from '../constants/yoga.constants';
import PoseFigure from '../figure/PoseFigure';

interface PoseLibraryProps {
  posesData: PoseDataItem[];
  selectedPoseIndex: number | null;
  onSelectPose: (index: number) => void;
}

const PoseLibrary: React.FC<PoseLibraryProps> = ({ posesData, selectedPoseIndex, onSelectPose }) => {
  const [query, setQuery] = useState('');
  const [category, setCategory] = useState('all');

  const items = useMemo(() => {
    const q = query.trim().toLowerCase();
    const cat = POSE_CATEGORIES.find(c => c.id === category);
    return posesData
      .map((pose, index) => ({ pose, index }))
      .filter(({ pose }) => pose.name !== 'Unknown Pose')
      .filter(({ pose }) => !cat?.poses || cat.poses.includes(pose.name))
      .filter(({ pose }) => !q || pose.name.toLowerCase().includes(q) || pose.description.toLowerCase().includes(q));
  }, [posesData, query, category]);

  return (
    <section id="library" aria-labelledby="library-heading" className="rounded-md border-2 border-line bg-card">
      <div className="flex flex-col gap-4 px-5 pt-6 sm:px-6 md:flex-row md:items-end md:justify-between">
        <h2 id="library-heading" className="text-4xl font-bold leading-tight text-ink">Pick a pose</h2>
        <label className="block md:w-80">
          <span className="sr-only">Find a pose</span>
          <input
            type="search"
            value={query}
            onChange={e => setQuery(e.target.value)}
            placeholder="Find a pose"
            className="h-14 w-full rounded-md border-2 border-line bg-paper px-4 text-xl text-ink placeholder:text-muted focus:border-pine focus:outline-none"
          />
        </label>
      </div>

      <div className="pt-scroll-x mt-5 flex gap-2 overflow-x-auto px-5 pb-1 sm:px-6" role="tablist" aria-label="Kinds of poses">
        {POSE_CATEGORIES.map(c => {
          const active = c.id === category;
          return (
            <button
              key={c.id}
              role="tab"
              aria-selected={active}
              onClick={() => setCategory(c.id)}
              className={`h-14 shrink-0 rounded-md border-2 px-5 text-xl font-semibold ${
                active ? 'border-pine bg-pine text-white' : 'border-line bg-paper text-ink hover:border-ink/40'
              }`}
            >
              {c.name}
            </button>
          );
        })}
      </div>

      {items.length === 0 ? (
        <p className="px-6 py-14 text-center text-2xl text-muted">
          No poses called &quot;{query}&quot;. Try another word.
        </p>
      ) : (
        <ul className="grid grid-cols-2 gap-3 p-5 sm:grid-cols-3 sm:gap-4 sm:p-6 lg:grid-cols-4 xl:grid-cols-5">
          {items.map(({ pose, index }) => {
            const selected = selectedPoseIndex === index;
            return (
              <li key={pose.name}>
                <button
                  onClick={() => onSelectPose(index)}
                  aria-pressed={selected}
                  className={`flex w-full flex-col items-center rounded-md border-2 p-3 pb-4 text-center ${
                    selected ? 'border-pine bg-pine-soft' : 'border-line bg-paper hover:border-ink/40'
                  }`}
                >
                  <PoseFigure pose={pose.name} showGround={false} decorative className="block aspect-square w-full" />
                  <span className="mt-2 text-xl font-semibold leading-snug text-ink">{pose.name}</span>
                </button>
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
};

export default PoseLibrary;
