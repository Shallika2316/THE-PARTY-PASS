import { AnimatePresence, motion } from 'framer-motion';
import { useEffect, useRef } from 'react';
import { Navigate, useLocation, useNavigate, useOutlet } from 'react-router-dom';
import { Header } from '../../components/Header';
import { ProgressSteps } from '../../components/ProgressSteps';
import { hasErrors, validateDetails, validateGame, validateMusic, validatePersonalise } from '../../lib/invitation';
import { useDraft } from '../../lib/store';
import type { Invitation } from '../../lib/types';

export const FLOW = [
  '/create/personalise',
  '/create/event-details',
  '/create/choose-game',
  '/create/music',
  '/create/preview',
  '/create/publish',
];

const EXTRA: Record<string, string> = {
  '/create/publish': 'Final step · Unlock & share',
};

/** How many flow steps are complete, in order. */
export function completedSteps(d: Invitation) {
  const checks = [validatePersonalise, validateDetails, validateGame, validateMusic];
  let n = 0;
  for (const check of checks) {
    if (hasErrors(check(d))) break;
    n++;
  }
  return n;
}

/** Moves to the next step, or back to the preview when the host came from there to edit. */
export function useStepNav() {
  const navigate = useNavigate();
  const { pathname, state } = useLocation();
  const returnTo = (state as { returnTo?: string } | null)?.returnTo;
  const idx = FLOW.indexOf(pathname);
  return {
    returnTo,
    next: () => navigate(returnTo ?? FLOW[idx + 1]),
    back: () => navigate(returnTo ?? FLOW[idx - 1]),
  };
}

export default function CreateLayout() {
  const { pathname } = useLocation();
  const outlet = useOutlet();
  const { draft } = useDraft();
  const idx = FLOW.indexOf(pathname);
  const prevIdx = useRef(idx);
  const direction = idx >= prevIdx.current ? 1 : -1;

  useEffect(() => {
    prevIdx.current = idx;
    window.scrollTo({ top: 0, behavior: 'auto' });
  }, [idx]);

  const done = completedSteps(draft);
  if (idx > done && pathname !== '/create/publish') return <Navigate to={FLOW[done]} replace />;

  const wide = idx >= 2;

  return (
    <div className="page create">
      <CreateBackdrop />
      <Header />
      <main id="main" className="create-main">
        <ProgressSteps current={Math.min(idx, 4)} maxReached={Math.min(done, 3)} extra={EXTRA[pathname]} />
        <AnimatePresence mode="wait" initial={false} custom={direction}>
          <motion.div
            key={pathname}
            custom={direction}
            className={`create-card ${wide ? 'is-wide' : ''}`}
            variants={{
              enter: (d: number) => ({ opacity: 0, x: 40 * d }),
              center: { opacity: 1, x: 0 },
              exit: (d: number) => ({ opacity: 0, x: -40 * d }),
            }}
            initial="enter"
            animate="center"
            exit="exit"
            transition={{ duration: 0.32, ease: [0.22, 1, 0.36, 1] }}
          >
            {outlet}
          </motion.div>
        </AnimatePresence>
      </main>
    </div>
  );
}

/** The photographed party table from the design reference, with the form area left clear. */
function CreateBackdrop() {
  return <div className="create-backdrop" aria-hidden="true" />;
}
