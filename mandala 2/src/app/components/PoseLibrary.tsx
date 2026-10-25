// components/PoseLibrary.tsx
import React, { useMemo, useState } from 'react';
import { Search } from 'lucide-react';
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
    <section id="library" aria-labelledby="library-heading" className="pt-card">
      <div className="flex flex-col gap-4 px-6 pt-6 md:flex-row md:items-end md:justify-between">
        <div>
          <h2 id="library-heading" className="font-display text-[1.9rem] leading-tight text-ink">Pose library</h2>
          <p className="mt-1 text-[15px] text-muted">Choose the pose you want to practise.</p>
        </div>
        <label className="relative block md:w-72">
          <span className="sr-only">Search poses</span>
          <Search size={17} className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-muted" />
          <input
            type="search"
            value={query}
            onChange={e => setQuery(e.target.value)}
            placeholder="Search poses"
            className="h-11 w-full rounded-full border border-transparent bg-white/80 pl-10 pr-4 text-[15px] text-ink shadow-[inset_0_0_0_1px_#DDE1DA] placeholder:text-muted focus:border-pine focus:outline-none"
          />
        </label>
      </div>

      <div className="pt-scroll-x mt-5 flex gap-2 overflow-x-auto px-6 pb-1" role="tablist" aria-label="Pose categories">
        {POSE_CATEGORIES.map(c => {
          const active = c.id === category;
          return (
            <button
              key={c.id}
              role="tab"
              aria-selected={active}
              onClick={() => setCategory(c.id)}
              className={`h-9 shrink-0 rounded-full px-4 text-sm font-medium transition-colors ${
                active ? 'bg-pine text-white' : 'bg-white/70 text-ink hover:bg-white'
              }`}
            >
              {c.name}
            </button>
          );
        })}
      </div>

      {items.length === 0 ? (
        <p className="px-6 py-12 text-center text-muted">
          No poses match “{query}”. Try a different word, or clear the search.
        </p>
      ) : (
        <ul className="grid grid-cols-3 gap-2 p-4 sm:grid-cols-4 sm:p-5 md:grid-cols-6 xl:grid-cols-8">
          {items.map(({ pose, index }) => {
            const selected = selectedPoseIndex === index;
            return (
              <li key={pose.name}>
                <button
                  onClick={() => onSelectPose(index)}
                  aria-pressed={selected}
                  className={`group flex w-full flex-col items-center rounded-2xl p-2 pb-3 text-center transition-colors ${
                    selected ? 'bg-[#E3EEE6] shadow-[inset_0_0_0_2px_#2F5D50]' : 'hover:bg-white/80'
                  }`}
                >
                  <PoseFigure pose={pose.name} showGround={false} decorative className="block w-full aspect-square" />
                  <span className="mt-1 text-[13px] font-medium leading-snug text-ink">{pose.name}</span>
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
