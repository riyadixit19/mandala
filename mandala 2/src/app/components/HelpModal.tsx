// components/HelpModal.tsx
import React, { useEffect, useRef } from 'react';
import { CONFIDENCE_PRESETS, ConfidenceLevel, STRICTNESS_LABELS, CHECK_SECONDS, HOLD_SECONDS } from '../constants/yoga.constants';
import { POSES_PER_STAR, GOLD_DAY_STARS } from '../utils/stars';

interface HelpModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const STEPS = [
  { title: 'Pick a pose', body: 'Press the blue button and tap a pose. Hold it down to start right away.' },
  { title: 'Start the camera', body: 'Stand back so the camera sees you from head to toes.' },
  { title: 'Copy the picture', body: `Hold still for ${CHECK_SECONDS} seconds.` },
  { title: 'Stay there', body: `Keep the pose for ${HOLD_SECONDS} seconds and earn a flower.` },
  { title: 'Collect stars', body: `${POSES_PER_STAR} different poses make a star. Get ${GOLD_DAY_STARS} stars in one day for a golden day!` },
];

const STEP_COLORS = ['bg-blue text-white', 'bg-pink text-white', 'bg-coral text-white', 'bg-purple text-white'];

const TIPS = [
  'Use bright light from the front. A window behind the child makes tracking harder.',
  'Clothes that stand out from the wall help the camera.',
  'For side-on poses, like Warrior I or Downward Dog, turn sideways to the camera.',
  'If a pose keeps failing, choose Relaxed in Settings for grown-ups, or turn to match the picture.',
  'Stars are saved on this device only and start again each day.',
  'Stay close by, and skip any pose that does not feel right for the child.',
];

const HelpModal: React.FC<HelpModalProps> = ({ isOpen, onClose }) => {
  const closeRef = useRef<HTMLButtonElement>(null);
  // keep the latest onClose without re-running the effect (the page re-renders many times a second)
  const onCloseRef = useRef(onClose);
  onCloseRef.current = onClose;

  useEffect(() => {
    if (!isOpen) return;
    closeRef.current?.focus();
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onCloseRef.current();
    window.addEventListener('keydown', onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      window.removeEventListener('keydown', onKey);
      document.body.style.overflow = prev;
    };
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-ink/50 sm:items-center sm:p-6" onClick={onClose}>
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="help-title"
        onClick={e => e.stopPropagation()}
        className="max-h-[92vh] w-full max-w-2xl overflow-y-auto rounded-t-md border-2 border-line bg-card sm:rounded-md"
      >
        <div className="sticky top-0 flex items-center justify-between border-b-2 border-line bg-card px-6 py-4">
          <h2 id="help-title" className="text-4xl font-black leading-tight text-ink">How to play</h2>
          <button
            ref={closeRef}
            onClick={onClose}
            className="pt-btn h-14 rounded-md border-2 border-line bg-card px-6 text-xl font-bold text-ink"
          >
            Close
          </button>
        </div>

        <div className="space-y-10 px-6 py-6">
          <ol className="space-y-6">
            {STEPS.map((s, i) => (
              <li key={s.title} className="flex items-start gap-5">
                <span className={`flex h-14 w-14 shrink-0 items-center justify-center rounded-full text-2xl font-black ${STEP_COLORS[i % STEP_COLORS.length]}`}>
                  {i + 1}
                </span>
                <div>
                  <h3 className="text-2xl font-bold text-ink">{s.title}</h3>
                  <p className="mt-1 text-xl leading-relaxed text-muted">{s.body}</p>
                </div>
              </li>
            ))}
          </ol>

          <section className="border-t-2 border-line pt-6">
            <h3 className="text-2xl font-bold text-ink">For grown-ups</h3>
            <p className="mt-2 text-lg leading-relaxed text-muted">
              Mandala starts on Relaxed, which allows for low muscle tone and wobbly balance. You can change how close is close enough in Settings for grown-ups.
            </p>
            <dl className="mt-4 divide-y-2 divide-line rounded-md border-2 border-line">
              {(Object.keys(CONFIDENCE_PRESETS) as ConfidenceLevel[]).map(level => (
                <div key={level} className="flex flex-col gap-1 px-4 py-3 sm:flex-row sm:gap-4">
                  <dt className="w-28 shrink-0 text-lg font-bold text-ink">{STRICTNESS_LABELS[level].label}</dt>
                  <dd className="text-lg text-muted">{STRICTNESS_LABELS[level].hint}</dd>
                </div>
              ))}
            </dl>

            <h3 className="mt-8 text-2xl font-bold text-ink">Better tracking</h3>
            <ul className="mt-3 list-disc space-y-2 pl-6 text-lg leading-relaxed text-muted marker:text-pink">
              {TIPS.map(t => (
                <li key={t}>{t}</li>
              ))}
            </ul>
          </section>
        </div>
      </div>
    </div>
  );
};

export default HelpModal;
