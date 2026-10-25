// components/HelpModal.tsx
import React, { useEffect, useRef } from 'react';
import { X } from 'lucide-react';
import { CONFIDENCE_PRESETS, ConfidenceLevel, STRICTNESS_LABELS, CHECK_SECONDS, HOLD_SECONDS } from '../constants/yoga.constants';

interface HelpModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const STEPS = [
  { title: 'Pick a pose', body: 'Choose one from the pose library. The illustration shows what it should look like.' },
  { title: 'Start the camera', body: 'Allow camera access when your browser asks. Stand back so your whole body, head to feet, is in the frame.' },
  { title: `Hold it for ${CHECK_SECONDS} seconds`, body: 'Stay still while the countdown runs. Mandala then checks your form and, if something is off, tells you what to fix.' },
  { title: `Keep it for ${HOLD_SECONDS} seconds`, body: 'Once your form is right, a timer starts. If you slip out of the pose, it pauses until you are back.' },
];

const TIPS = [
  'Use bright, even light from the front. A window behind you makes tracking harder.',
  'Wear clothes that contrast with the wall behind you.',
  'Side-on poses, like Warrior I or Downward Dog, are easier to read when you face sideways to the camera.',
  'If a pose keeps failing, try Relaxed strictness, or turn so the camera sees you from the same side as the picture.',
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
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-ink/40 sm:items-center sm:p-6" onClick={onClose}>
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="help-title"
        onClick={e => e.stopPropagation()}
        className="max-h-[92vh] w-full max-w-2xl overflow-y-auto rounded-t-[1.75rem] bg-white sm:rounded-[1.75rem]"
      >
        <div className="sticky top-0 flex items-center justify-between border-b border-line bg-white px-6 py-4">
          <h2 id="help-title" className="font-display text-[1.75rem] leading-tight text-ink">How it works</h2>
          <button
            ref={closeRef}
            onClick={onClose}
            className="inline-flex h-10 w-10 items-center justify-center rounded-full text-ink hover:bg-paper"
            aria-label="Close"
          >
            <X size={20} />
          </button>
        </div>

        <div className="space-y-8 px-6 py-6">
          <ol className="space-y-5">
            {STEPS.map((s, i) => (
              <li key={s.title} className="flex gap-4">
                <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-pine-soft text-sm font-semibold text-pine">
                  {i + 1}
                </span>
                <div>
                  <h3 className="font-semibold text-ink">{s.title}</h3>
                  <p className="mt-0.5 text-[15px] leading-relaxed text-muted">{s.body}</p>
                </div>
              </li>
            ))}
          </ol>

          <section>
            <h3 className="font-semibold text-ink">Strictness</h3>
            <p className="mt-1 text-[15px] leading-relaxed text-muted">
              Strictness sets how closely your joints need to match the picture before a pose counts.
            </p>
            <dl className="mt-3 divide-y divide-line rounded-2xl border border-line">
              {(Object.keys(CONFIDENCE_PRESETS) as ConfidenceLevel[]).map(level => (
                <div key={level} className="flex gap-4 px-4 py-3">
                  <dt className="w-20 shrink-0 font-medium text-ink">{STRICTNESS_LABELS[level].label}</dt>
                  <dd className="text-[15px] text-muted">{STRICTNESS_LABELS[level].hint}</dd>
                </div>
              ))}
            </dl>
          </section>

          <section>
            <h3 className="font-semibold text-ink">Getting better tracking</h3>
            <ul className="mt-2 space-y-2">
              {TIPS.map(t => (
                <li key={t} className="flex gap-3 text-[15px] leading-relaxed text-muted">
                  <span className="mt-[0.6em] h-1.5 w-1.5 shrink-0 rounded-full bg-marigold" aria-hidden />
                  {t}
                </li>
              ))}
            </ul>
          </section>

          <p className="text-sm text-muted">
            Practise somewhere with space around you, and skip any pose that doesn&apos;t feel right for your body.
          </p>
        </div>
      </div>
    </div>
  );
};

export default HelpModal;
