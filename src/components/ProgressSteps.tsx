import { motion } from 'framer-motion';
import { Check } from 'lucide-react';
import { Fragment } from 'react';
import { useNavigate } from 'react-router-dom';

export const CORE_STEPS = [
  { label: 'Personalise', path: '/create/personalise' },
  { label: 'Event Details', path: '/create/event-details' },
  { label: 'Choose Game', path: '/create/choose-game' },
];

/** current: 0–2 for the core steps; 3 means all core steps are complete. */
export function ProgressSteps({ current, maxReached, extra }: { current: number; maxReached: number; extra?: string }) {
  const navigate = useNavigate();
  return (
    <nav className="progress" aria-label="Invitation progress">
      <ol className="progress-list">
        {CORE_STEPS.map((s, i) => {
          const state = i < current ? 'done' : i === current ? 'active' : 'todo';
          const reachable = i <= maxReached && i !== current;
          return (
            <Fragment key={s.path}>
              {i > 0 && (
                <li className="progress-line" aria-hidden>
                  <motion.span className="progress-line-fill" initial={false} animate={{ scaleX: i <= current ? 1 : i === current + 1 ? 0.5 : 0 }} transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }} />
                </li>
              )}
              <li className={`progress-step is-${state}`}>
                <button type="button" className="progress-btn" onClick={() => reachable && navigate(s.path)} disabled={!reachable} aria-current={state === 'active' ? 'step' : undefined}>
                  <motion.span className="progress-dot" initial={false} animate={{ scale: state === 'active' ? 1.06 : 1 }}>
                    {state === 'done' ? <Check size={16} strokeWidth={3} aria-hidden /> : i + 1}
                  </motion.span>
                  <span className="progress-label">
                    {s.label}
                    <span className="sr-only">{state === 'done' ? ' (completed)' : state === 'todo' ? ' (not started)' : ''}</span>
                  </span>
                </button>
              </li>
            </Fragment>
          );
        })}
      </ol>
      {extra && <p className="progress-extra">{extra}</p>}
    </nav>
  );
}
