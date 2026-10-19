import { AnimatePresence, motion } from 'framer-motion';
import { Eye } from 'lucide-react';
import { useMemo, useRef, useState } from 'react';
import { mulberry32, shuffledTiles } from '../../lib/games';
import type { PuzzleArt } from '../../lib/types';
import { DiscoBall } from '../decor/DiscoBall';
import { Burst, Star } from '../decor/Ornaments';

/** Square artwork rendered with real elements, so each puzzle piece can show its slice of it. */
export function PuzzleArtwork({ art, guestName, partyLabel }: { art: PuzzleArt; guestName: string; partyLabel: string }) {
  if (art === 'photo') {
    return (
      <div className="pz-art pz-photo">
        <img src="/img/friends.webp" alt="" draggable={false} />
        <span className="pz-photo-tag">
          {guestName ? `${guestName}, ` : ''}you’re invited
        </span>
      </div>
    );
  }
  if (art === 'disco') {
    return (
      <div className="pz-art pz-disco">
        <span className="pz-rays" />
        <DiscoBall size={200} seed={33} className="pz-disco-ball" />
        <span className="pz-disco-title">Party time</span>
        <Star size={40} tone="gold" className="pz-disco-star" />
        <Star size={26} tone="silver" className="pz-disco-star2" />
      </div>
    );
  }
  return (
    <div className="pz-art pz-poster">
      <Burst size={90} color="#2346C6" className="pz-burst" />
      <DiscoBall size={110} seed={9} className="pz-ball" />
      <span className="pz-youre">You’re</span>
      <span className="pz-invited">Invited!</span>
      <span className="pz-label">{partyLabel}</span>
      {guestName && <span className="pz-name">for {guestName}</span>}
      <Star size={34} tone="gold" className="pz-star" />
      <span className="pz-stripe" />
    </div>
  );
}

interface Props {
  art: PuzzleArt;
  difficulty: 'easy' | 'standard';
  seed: number;
  guestName: string;
  partyLabel: string;
  onSolved?: () => void;
  /** Walkthrough: show the first N tray pieces already placed, no interaction. */
  demoPlaced?: number;
}

type Drag = { piece: number; x: number; y: number; size: number; offX: number; offY: number };

function Slice({ piece, n, art }: { piece: number; n: number; art: React.ReactNode }) {
  return (
    <span className="puzzle-slice" style={{ width: `${n * 100}%`, height: `${n * 100}%`, left: `${-(piece % n) * 100}%`, top: `${-Math.floor(piece / n) * 100}%` }}>
      {art}
    </span>
  );
}

/**
 * Jigsaw-style: the pieces start in a tray outside the board. Drag a piece onto its spot,
 * or tap a piece and then tap a spot. The right spot locks it in; a wrong spot sends it back.
 */
export function PuzzleGame({ art, difficulty, seed, guestName, partyLabel, onSolved, demoPlaced }: Props) {
  const n = difficulty === 'easy' ? 3 : 4;
  const count = n * n;
  const trayOrder = useMemo(() => shuffledTiles(count, seed), [count, seed]);
  const tilts = useMemo(() => {
    const rand = mulberry32(seed + 99);
    return Array.from({ length: count }, () => Math.round((rand() - 0.5) * 16));
  }, [count, seed]);
  const [placed, setPlaced] = useState<boolean[]>(() => Array(count).fill(false));
  const [picked, setPicked] = useState<number | null>(null);
  const [miss, setMiss] = useState<{ piece: number; slot: number } | null>(null);
  const [drag, setDrag] = useState<Drag | null>(null);
  const [peek, setPeek] = useState(false);
  const pressRef = useRef<{ piece: number; x: number; y: number; rect: DOMRect } | null>(null);
  const draggedRef = useRef(false);
  const demo = demoPlaced != null;

  const isPlaced = (p: number) => (demo ? trayOrder.indexOf(p) < (demoPlaced ?? 0) : placed[p]);
  const placedCount = demo ? Math.min(count, demoPlaced ?? 0) : placed.filter(Boolean).length;
  const artwork = <PuzzleArtwork art={art} guestName={guestName} partyLabel={partyLabel} />;

  const place = (piece: number, slot: number) => {
    setPicked(null);
    if (piece !== slot) {
      setMiss({ piece, slot });
      window.setTimeout(() => setMiss(null), 650);
      return;
    }
    const next = placed.map((v, i) => (i === piece ? true : v));
    setPlaced(next);
    if (next.every(Boolean)) window.setTimeout(() => onSolved?.(), 650);
  };

  const onPointerDown = (e: React.PointerEvent<HTMLButtonElement>, piece: number) => {
    if (demo) return;
    draggedRef.current = false;
    pressRef.current = { piece, x: e.clientX, y: e.clientY, rect: e.currentTarget.getBoundingClientRect() };
    e.currentTarget.setPointerCapture(e.pointerId);
  };
  const onPointerMove = (e: React.PointerEvent<HTMLButtonElement>) => {
    const press = pressRef.current;
    if (!press) return;
    if (!draggedRef.current && Math.hypot(e.clientX - press.x, e.clientY - press.y) < 6) return;
    draggedRef.current = true;
    setPicked(null);
    setDrag({ piece: press.piece, x: e.clientX, y: e.clientY, size: press.rect.width * 1.15, offX: (press.x - press.rect.left) * 1.15, offY: (press.y - press.rect.top) * 1.15 });
  };
  const onPointerUp = (e: React.PointerEvent<HTMLButtonElement>) => {
    const press = pressRef.current;
    pressRef.current = null;
    if (!press || !draggedRef.current) return;
    setDrag(null);
    const target = document.elementFromPoint(e.clientX, e.clientY)?.closest<HTMLElement>('[data-slot]');
    if (target && !target.classList.contains('is-filled')) place(press.piece, Number(target.dataset.slot));
  };

  return (
    <div className={`game game-puzzle ${demo ? 'is-demo' : ''}`}>
      <div className="puzzle-board" style={{ gridTemplateColumns: `repeat(${n}, 1fr)` }} role="group" aria-label={`Puzzle board, ${n} by ${n}`}>
        {difficulty === 'easy' && (
          <div className="puzzle-ghost" aria-hidden>
            {artwork}
          </div>
        )}
        {Array.from({ length: count }, (_, slot) => {
          const filled = isPlaced(slot);
          return (
            <button
              key={slot}
              type="button"
              data-slot={slot}
              className={`puzzle-slot ${filled ? 'is-filled' : ''} ${miss?.slot === slot ? 'is-miss' : ''} ${picked != null && !filled ? 'is-target' : ''}`}
              onClick={() => picked != null && !filled && place(picked, slot)}
              disabled={filled || demo}
              aria-label={`Spot ${slot + 1}${filled ? ', done' : ''}`}
            >
              <AnimatePresence>
                {filled && (
                  <motion.span className="puzzle-piece-in" initial={{ scale: 1.18, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ type: 'spring', stiffness: 420, damping: 24 }}>
                    <Slice piece={slot} n={n} art={artwork} />
                  </motion.span>
                )}
              </AnimatePresence>
            </button>
          );
        })}
        {peek && (
          <div className="puzzle-peek" aria-hidden>
            {artwork}
          </div>
        )}
      </div>

      <div className={`puzzle-tray tray-${n}`} role="group" aria-label="Puzzle pieces">
        {trayOrder.map((piece, i) =>
          isPlaced(piece) ? null : (
            <motion.button
              layout
              key={piece}
              type="button"
              className={`puzzle-piece ${picked === piece ? 'is-picked' : ''} ${drag?.piece === piece ? 'is-dragging' : ''}`}
              style={{ rotate: picked === piece ? 0 : tilts[i] }}
              animate={miss?.piece === piece ? { x: [0, -8, 8, -5, 5, 0] } : { x: 0 }}
              transition={{ duration: 0.4 }}
              onClick={() => {
                if (draggedRef.current) return;
                setPicked(picked === piece ? null : piece);
              }}
              onPointerDown={(e) => onPointerDown(e, piece)}
              onPointerMove={onPointerMove}
              onPointerUp={onPointerUp}
              onPointerCancel={() => {
                pressRef.current = null;
                setDrag(null);
              }}
              disabled={demo}
              aria-pressed={picked === piece}
              aria-label={`Piece ${i + 1}${picked === piece ? ', picked up' : ''}`}
            >
              <Slice piece={piece} n={n} art={artwork} />
            </motion.button>
          ),
        )}
        {placedCount === count && <p className="puzzle-done">All pieces in place!</p>}
      </div>

      {drag && (
        <span className="puzzle-drag" style={{ width: drag.size, height: drag.size, left: drag.x - drag.offX, top: drag.y - drag.offY }} aria-hidden>
          <Slice piece={drag.piece} n={n} art={artwork} />
        </span>
      )}

      {!demo && (
        <>
          <div className="puzzle-bar">
            <p className="game-small" role="status">
              {miss ? 'Not that spot. Try another.' : picked != null ? 'Now tap the spot it belongs in.' : `${placedCount}/${count} pieces placed`}
            </p>
            <button
              type="button"
              className="btn btn-quiet btn-sm"
              onPointerDown={() => setPeek(true)}
              onPointerUp={() => setPeek(false)}
              onPointerLeave={() => setPeek(false)}
              onKeyDown={(e) => (e.key === ' ' || e.key === 'Enter') && setPeek(true)}
              onKeyUp={() => setPeek(false)}
            >
              <Eye size={16} aria-hidden />
              <span>Hold to peek</span>
            </button>
          </div>
          <p className="game-small">Drag a piece onto the board, or tap a piece and then tap its spot.</p>
        </>
      )}
    </div>
  );
}
