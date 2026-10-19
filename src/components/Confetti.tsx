import { motion, useReducedMotion } from 'framer-motion';
import { useMemo } from 'react';

const COLORS = ['#D20D4B', '#D7A34A', '#2346C6', '#E9C8BC', '#A9083B', '#F3D27A'];

/** A short, one-off confetti burst. Skipped entirely for reduced-motion users. */
export function ConfettiBurst({ count = 46, className }: { count?: number; className?: string }) {
  const reduce = useReducedMotion();
  const pieces = useMemo(
    () =>
      Array.from({ length: count }, (_, i) => {
        const angle = (Math.PI * 2 * i) / count + Math.random() * 0.4;
        const dist = 120 + Math.random() * 220;
        return {
          x: Math.cos(angle) * dist,
          y: Math.sin(angle) * dist * 0.7 - 40,
          rot: Math.random() * 540 - 270,
          c: COLORS[i % COLORS.length],
          w: 6 + Math.random() * 8,
          round: Math.random() > 0.6,
          delay: Math.random() * 0.12,
        };
      }),
    [count],
  );
  if (reduce) return null;
  return (
    <div className={`confetti-burst ${className ?? ''}`} aria-hidden>
      {pieces.map((p, i) => (
        <motion.span
          key={i}
          style={{ background: p.c, width: p.w, height: p.round ? p.w : p.w * 0.5, borderRadius: p.round ? '50%' : 2 }}
          initial={{ x: 0, y: 0, opacity: 1, rotate: 0, scale: 0.6 }}
          animate={{ x: p.x, y: [0, p.y, p.y + 160], opacity: [1, 1, 0], rotate: p.rot, scale: 1 }}
          transition={{ duration: 1.6, delay: p.delay, ease: [0.16, 1, 0.3, 1], times: [0, 0.45, 1] }}
        />
      ))}
    </div>
  );
}
