// components/PosePicker.tsx
// One big button that opens a list of every pose, grouped by kind.
// Tap a pose to pick it. Hold it down (phone) or right-click it (computer) to pick it and start.
import React, { useEffect, useMemo, useRef, useState } from 'react';
import { PoseDataItem } from '../types/yoga.types';
import { POSE_CATEGORIES, isRealPose } from '../constants/yoga.constants';
import PoseFigure from '../figure/PoseFigure';

interface PosePickerProps {
  posesData: PoseDataItem[];
  selectedPoseIndex: number | null;
  onSelect: (index: number) => void;
  /** pick and start the camera straight away */
  onSelectAndGo: (index: number) => void;
}

const HOLD_MS = 550;
const GROUP_COLORS = ['bg-sky', 'bg-marigold', 'bg-rust', 'bg-pine', 'bg-sky', 'bg-rust'];

function Arrow({ open }: { open: boolean }) {
  return (
    <svg viewBox="0 0 24 24" className={`h-8 w-8 shrink-0 ${open ? 'rotate-180' : ''}`} aria-hidden>
      <path d="M5 9 L12 16 L19 9" fill="none" stroke="currentColor" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

const PosePicker: React.FC<PosePickerProps> = ({ posesData, selectedPoseIndex, onSelect, onSelectAndGo }) => {
  const [open, setOpen] = useState(false);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const listRef = useRef<HTMLDivElement>(null);
  const holdTimer = useRef<number | null>(null);
  const held = useRef(false);
  const target = selectedPoseIndex !== null ? posesData[selectedPoseIndex] : undefined;

  const groups = useMemo(() => {
    const indexed = posesData.map((pose, index) => ({ pose, index })).filter(({ pose }) => isRealPose(pose.name));
    const out = POSE_CATEGORIES.filter(c => c.poses).map(c => ({
      name: c.name,
      items: indexed.filter(({ pose }) => c.poses!.includes(pose.name)),
    }));
    const listed = new Set(POSE_CATEGORIES.flatMap(c => c.poses ?? []));
    const rest = indexed.filter(({ pose }) => !listed.has(pose.name));
    if (rest.length) out.push({ name: 'More poses', items: rest });
    return out.filter(g => g.items.length);
  }, [posesData]);

  const close = (refocus = true) => {
    setOpen(false);
    if (refocus) buttonRef.current?.focus();
  };

  useEffect(() => {
    if (!open) return;
    held.current = false;
    // start on the chosen pose, so the list opens where the child left off
    const selected = listRef.current?.querySelector<HTMLElement>('[aria-selected="true"]') ?? listRef.current?.querySelector<HTMLElement>('[role="option"]');
    selected?.focus({ preventScroll: true });
    selected?.scrollIntoView({ block: 'center' });
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && close();
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open]);

  const cancelHold = () => {
    if (holdTimer.current !== null) window.clearTimeout(holdTimer.current);
    holdTimer.current = null;
  };

  const pick = (index: number) => {
    onSelect(index);
    close();
  };

  const pickAndGo = (index: number) => {
    navigator.vibrate?.(30);
    onSelectAndGo(index);
    close(false);
  };

  // arrow keys move through the list, like a native dropdown
  const onListKey = (e: React.KeyboardEvent) => {
    if (e.key !== 'ArrowDown' && e.key !== 'ArrowUp') return;
    e.preventDefault();
    const options = Array.from(listRef.current?.querySelectorAll<HTMLElement>('[role="option"]') ?? []);
    const at = options.indexOf(document.activeElement as HTMLElement);
    options[Math.max(0, Math.min(options.length - 1, at + (e.key === 'ArrowDown' ? 1 : -1)))]?.focus();
  };

  return (
    <div className="relative">
      <button
        ref={buttonRef}
        onClick={() => setOpen(o => !o)}
        aria-haspopup="listbox"
        aria-expanded={open}
        className="pt-btn flex h-20 w-full items-center gap-3 rounded-md border-2 border-sky-dark bg-sky px-4 text-left text-white"
      >
        {target && (
          <span className="flex h-14 w-14 shrink-0 items-center justify-center rounded bg-card">
            <PoseFigure pose={target.name} showGround={false} decorative className="h-12 w-12" />
          </span>
        )}
        <span className="min-w-0 flex-1 truncate text-2xl font-black">{target ? 'Change pose' : 'Pick a pose'}</span>
        <Arrow open={open} />
      </button>

      {open && (
        <>
          <div className="fixed inset-0 z-30" onClick={() => close(false)} aria-hidden />
          <div
            ref={listRef}
            role="listbox"
            aria-label="Poses"
            onKeyDown={onListKey}
            className="pt-drop absolute left-0 right-0 top-full z-40 mt-2 max-h-[65vh] overflow-y-auto rounded-md border-2 border-sky bg-card"
          >
            <p className="sticky top-0 z-10 border-b-2 border-line bg-card px-4 py-3 text-lg text-muted">
              Tap a pose to pick it. Hold it down, or right-click, to pick it and start.
            </p>
            {groups.map((g, gi) => (
              <div key={g.name} role="group" aria-labelledby={`group-${gi}`}>
                <p id={`group-${gi}`} className="flex items-center gap-3 px-4 pb-1 pt-4 text-xl font-black text-ink">
                  <span className={`h-4 w-4 rounded-full ${GROUP_COLORS[gi % GROUP_COLORS.length]}`} aria-hidden />
                  {g.name}
                </p>
                {g.items.map(({ pose, index }) => {
                  const selected = index === selectedPoseIndex;
                  return (
                    <div
                      key={pose.name}
                      role="option"
                      tabIndex={-1}
                      aria-selected={selected}
                      onClick={() => {
                        if (held.current) {
                          held.current = false;
                          return;
                        }
                        pick(index);
                      }}
                      onKeyDown={e => {
                        if (e.key === 'Enter' || e.key === ' ') {
                          e.preventDefault();
                          pick(index);
                        }
                      }}
                      onContextMenu={e => {
                        e.preventDefault();
                        // on Android a long press also fires this; the hold timer may already have run
                        if (held.current) return;
                        cancelHold();
                        held.current = true;
                        pickAndGo(index);
                      }}
                      onPointerDown={e => {
                        if (e.pointerType === 'mouse') return; // right-click covers computers
                        held.current = false;
                        cancelHold();
                        holdTimer.current = window.setTimeout(() => {
                          held.current = true;
                          pickAndGo(index);
                        }, HOLD_MS);
                      }}
                      onPointerUp={cancelHold}
                      onPointerLeave={cancelHold}
                      onPointerCancel={cancelHold}
                      className={`pt-hold mx-2 my-1 flex cursor-pointer items-center gap-4 rounded-md border-2 px-2 py-1 ${
                        selected ? 'border-pine bg-pine-soft' : 'border-transparent hover:bg-paper'
                      }`}
                    >
                      <PoseFigure pose={pose.name} showGround={false} decorative className="h-16 w-16 shrink-0" />
                      <span className="text-xl font-bold text-ink">{pose.name}</span>
                    </div>
                  );
                })}
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
};

export default PosePicker;
