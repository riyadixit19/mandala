// figure/PoseFigure.tsx
'use client';

import React, { useEffect, useRef, useState } from 'react';
import { Joints, Pt, SIZE, jointsFor, lerpJoints } from './poseRig';

const C = {
  skin: '#F1C7A3',
  skinFar: '#DDAE89',
  hair: '#3A2A22',
  top: '#EC4C93',
  topFar: '#C93D7C',
  leg: '#5B3FD0',
  legFar: '#46309F',
  cheek: '#EE9F96',
  shadow: '#1F2147',
};

const W = { torso: 19, pelvis: 10, sleeve: 10.5, arm: 7.2, leg: 11, neck: 7 };

const fmt = (n: number) => Math.round(n * 10) / 10;
const pt = (p: Pt) => `${fmt(p[0])} ${fmt(p[1])}`;
const mix = (a: Pt, b: Pt, t: number): Pt => [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t];

function Limb({ a, b, c, color, width }: { a: Pt; b: Pt; c: Pt; color: string; width: number }) {
  return (
    <path
      d={`M${pt(a)} L${pt(b)} L${pt(c)}`}
      fill="none"
      stroke={color}
      strokeWidth={width}
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  );
}

function Arm({ s, e, h, far, k }: { s: Pt; e: Pt; h: Pt; far: boolean; k: number }) {
  const skin = far ? C.skinFar : C.skin;
  return (
    <g>
      <Limb a={s} b={e} c={h} color={skin} width={W.arm * k} />
      <path
        d={`M${pt(s)} L${pt(mix(s, e, 0.42))}`}
        stroke={far ? C.topFar : C.top}
        strokeWidth={W.sleeve * k}
        strokeLinecap="round"
      />
      <circle cx={fmt(h[0])} cy={fmt(h[1])} r={SIZE.hand * k} fill={skin} />
    </g>
  );
}

function Leg({ hip, knee, foot, far, k }: { hip: Pt; knee: Pt; foot: Pt; far: boolean; k: number }) {
  return (
    <g>
      <Limb a={hip} b={knee} c={foot} color={far ? C.legFar : C.leg} width={W.leg * k} />
      <circle cx={fmt(foot[0])} cy={fmt(foot[1])} r={SIZE.foot * k} fill={far ? C.skinFar : C.skin} />
    </g>
  );
}

function Head({ j, k }: { j: Joints; k: number }) {
  const angle = (Math.atan2(j.up[0], -j.up[1]) * 180) / Math.PI;
  const r = SIZE.head;
  const fx = j.faceX;
  const front = Math.abs(fx) < 0.5;
  const eye = (x: number, y: number, key: string) => (
    <path key={key} d={`M${x - 2.1} ${y} Q${x} ${y + 1.9} ${x + 2.1} ${y}`} fill="none" stroke={C.hair} strokeWidth={1.4} strokeLinecap="round" />
  );
  return (
    <g>
      <g transform={`translate(${fmt(j.h[0])} ${fmt(j.h[1])}) rotate(${fmt(angle)}) scale(${fmt(k * 100) / 100})`}>
        {/* bun and hair tie */}
        <circle cx={-fx * 3.5} cy={-(r + 3.5)} r={6.4} fill={C.hair} />
        <circle cx={-fx * 2.8} cy={-(r - 0.5)} r={2.5} fill={C.top} />
        {/* hair */}
        <circle cx={-fx * 2.2} cy={front ? -2.4 : -1.6} r={r + 0.9} fill={C.hair} />
        {/* face */}
        <circle cx={fx * 1.8} cy={front ? 2.4 : 1.7} r={r - 0.7} fill={C.skin} />
        {front ? (
          <>
            {eye(-5, 1.5, 'l')}
            {eye(5, 1.5, 'r')}
            <circle cx={-8} cy={5} r={2.3} fill={C.cheek} opacity={0.55} />
            <circle cx={8} cy={5} r={2.3} fill={C.cheek} opacity={0.55} />
            <path d="M-2.2 6.6 Q0 8.6 2.2 6.6" fill="none" stroke={C.hair} strokeWidth={1.3} strokeLinecap="round" />
          </>
        ) : (
          <>
            {eye(fx * 7.4, 1, 'e')}
            <circle cx={fx * 5} cy={5.4} r={2.3} fill={C.cheek} opacity={0.55} />
            <path d={`M${fx * 8} 7.4 Q${fx * 9.6} 8.6 ${fx * 11} 7.2`} fill="none" stroke={C.hair} strokeWidth={1.3} strokeLinecap="round" />
          </>
        )}
      </g>
    </g>
  );
}

/** Pure drawing of the character for a given set of fitted joints. */
export function FigureDrawing({ j }: { j: Joints }) {
  const k: number = (j as any).scale ?? 1;
  const front = Math.abs(j.faceX) < 0.5;
  // torso: full length in leggings colour, top covers the upper ~78%
  const t = 0.8;
  const q0 = j.n, q1 = j.c, q2 = j.p;
  const a = mix(q0, q1, t), b = mix(q1, q2, t);
  const end = mix(a, b, t);
  const torsoBottom = `M${pt(q0)} Q${pt(q1)} ${pt(q2)}`;
  const torsoTop = `M${pt(q0)} Q${pt(a)} ${pt(end)}`;

  const farArm = <Arm s={j.ls} e={j.le} h={j.lh} far={!front} k={k} />;
  const nearArm = <Arm s={j.rs} e={j.re} h={j.rh} far={false} k={k} />;
  // arms reaching past the head are drawn behind it so they never cover her face
  const reach = (hand: Pt) => (hand[0] - j.n[0]) * j.up[0] + (hand[1] - j.n[1]) * j.up[1];
  const farBehind = !front || reach(j.lh) > 14 * k;
  const nearBehind = front && reach(j.rh) > 14 * k;
  const farLeg = <Leg hip={j.lp} knee={j.lk} foot={j.lf} far={!front} k={k} />;
  const nearLeg = <Leg hip={j.rp} knee={j.rk} foot={j.rf} far={false} k={k} />;

  const neckTop: Pt = [j.n[0] + j.up[0] * 10 * k, j.n[1] + j.up[1] * 10 * k];
  return (
    <g>
      <path d={`M${pt(j.n)} L${pt(neckTop)}`} stroke={C.skinFar} strokeWidth={W.neck * k} strokeLinecap="round" />
      {farBehind && farArm}
      {nearBehind && nearArm}
      {farLeg}
      {!front ? null : nearLeg}
      <circle cx={fmt(j.p[0])} cy={fmt(j.p[1])} r={W.pelvis * k} fill={C.leg} />
      <path d={torsoBottom} fill="none" stroke={C.leg} strokeWidth={W.torso * k} strokeLinecap="round" />
      <path d={torsoTop} fill="none" stroke={C.top} strokeWidth={W.torso * k} strokeLinecap="round" />
      {!front && nearLeg}
      <Head j={j} k={k} />
      {!farBehind && farArm}
      {!nearBehind && nearArm}
    </g>
  );
}

interface PoseFigureProps {
  pose: string;
  /** breathe and morph between poses */
  animate?: boolean;
  className?: string;
  title?: string;
  showGround?: boolean;
  /** hide from screen readers when a visible label already names the pose */
  decorative?: boolean;
}

const easeInOut = (t: number) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);

/** The illustrated character. With `animate`, she breathes and flows into each new pose. */
export default function PoseFigure({ pose, animate = false, className, title, showGround = true, decorative = false }: PoseFigureProps) {
  const [joints, setJoints] = useState<Joints>(() => jointsFor(pose));
  const current = useRef<Joints>(joints);
  const raf = useRef<number>(0);

  useEffect(() => {
    const target = jointsFor(pose);
    if (target === current.current) return;
    const reduce = typeof window !== 'undefined' && window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
    if (!animate || reduce) {
      current.current = target;
      setJoints(target);
      return;
    }
    const from = current.current;
    const start = performance.now();
    const DURATION = 750;
    cancelAnimationFrame(raf.current);
    const step = (now: number) => {
      const t = Math.min(1, (now - start) / DURATION);
      const next = lerpJoints(from, target, easeInOut(t));
      current.current = next;
      setJoints(next);
      if (t < 1) raf.current = requestAnimationFrame(step);
    };
    raf.current = requestAnimationFrame(step);
    return () => cancelAnimationFrame(raf.current);
  }, [pose, animate]);

  return (
    <svg
      viewBox="0 0 200 200"
      className={className}
      {...(decorative ? { 'aria-hidden': true } : { role: 'img', 'aria-label': title ?? pose })}
    >
      {showGround && <ellipse cx="100" cy="181" rx="62" ry="4.5" fill={C.shadow} opacity="0.07" />}
      <g className={animate ? 'pt-breathe' : undefined}>
        <FigureDrawing j={joints} />
      </g>
    </svg>
  );
}
