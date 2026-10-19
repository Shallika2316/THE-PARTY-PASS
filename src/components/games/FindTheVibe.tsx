import { motion } from 'framer-motion';
import { Check } from 'lucide-react';
import { useMemo, useRef, useState } from 'react';
import { buildWordGrid, lineBetween, type Cell } from '../../lib/games';

const WORD_COLORS = ['#D20D4B', '#2346C6', '#D7A34A', '#7A3FB8', '#1F8A63', '#E3672B'];

interface Props {
  words: string[];
  seed: number;
  onSolved?: () => void;
  /** Host preview: highlight answers, no interaction needed. */
  showAnswers?: boolean;
  interactive?: boolean;
  /** Walkthrough: treat the first N words as found. */
  revealed?: number;
}

const key = (c: Cell) => `${c[0]}-${c[1]}`;

/** Word search. Tap first + last letter, or drag across a word (works with mouse, touch and keyboard). */
export function FindTheVibe({ words, seed, onSolved, showAnswers, interactive = true, revealed = 0 }: Props) {
  const grid = useMemo(() => buildWordGrid(words, seed), [words, seed]);
  const [found, setFound] = useState<string[]>([]);
  const [start, setStart] = useState<Cell | null>(null);
  const [hover, setHover] = useState<Cell | null>(null);
  const [miss, setMiss] = useState(false);
  const [focus, setFocus] = useState<Cell>([0, 0]);
  const dragging = useRef(false);
  const startedNow = useRef(false);
  const gridRef = useRef<HTMLDivElement>(null);

  const cellColor = useMemo(() => {
    const map = new Map<string, string>();
    grid.placements.forEach((p) => {
      const idx = words.indexOf(p.word);
      if (showAnswers || found.includes(p.word) || idx < revealed) p.cells.forEach((c) => map.set(key(c), WORD_COLORS[idx % WORD_COLORS.length]));
    });
    return map;
  }, [grid, found, showAnswers, words, revealed]);

  const preview = useMemo(() => {
    if (!start) return new Set<string>();
    const line = hover ? lineBetween(start, hover) : [start];
    return new Set((line ?? [start]).map(key));
  }, [start, hover]);

  const attempt = (a: Cell, b: Cell) => {
    const line = lineBetween(a, b);
    setStart(null);
    setHover(null);
    if (!line) return flagMiss();
    const text = line.map(([r, c]) => grid.grid[r][c]).join('');
    const match = grid.placements.find((p) => !found.includes(p.word) && (p.word === text || p.word === [...text].reverse().join('')) && p.cells.length === line.length);
    if (!match) return flagMiss();
    const next = [...found, match.word];
    setFound(next);
    if (next.length === grid.placements.length) window.setTimeout(() => onSolved?.(), 450);
  };

  const flagMiss = () => {
    setMiss(true);
    window.setTimeout(() => setMiss(false), 420);
  };

  const select = (c: Cell) => {
    if (!interactive) return;
    if (!start) setStart(c);
    else if (key(start) === key(c)) setStart(null);
    else attempt(start, c);
  };

  const cellFromPoint = (x: number, y: number): Cell | null => {
    const el = document.elementFromPoint(x, y) as HTMLElement | null;
    const r = el?.closest<HTMLElement>('[data-r]');
    return r ? [Number(r.dataset.r), Number(r.dataset.c)] : null;
  };

  const onKey = (e: React.KeyboardEvent, c: Cell) => {
    const moves: Record<string, Cell> = { ArrowUp: [-1, 0], ArrowDown: [1, 0], ArrowLeft: [0, -1], ArrowRight: [0, 1] };
    const m = moves[e.key];
    if (!m) return;
    e.preventDefault();
    const next: Cell = [Math.min(grid.size - 1, Math.max(0, c[0] + m[0])), Math.min(grid.size - 1, Math.max(0, c[1] + m[1]))];
    setFocus(next);
    if (start) setHover(next);
    gridRef.current?.querySelector<HTMLElement>(`[data-r="${next[0]}"][data-c="${next[1]}"]`)?.focus();
  };

  return (
    <div className="game game-words">
      <ul className="word-list" aria-label="Words to find">
        {words.map((w, i) => {
          const done = found.includes(w) || showAnswers || i < revealed;
          return (
            <li key={w} className={done ? 'is-found' : ''} style={{ ['--word-color' as string]: WORD_COLORS[i % WORD_COLORS.length] }}>
              {done && <Check size={14} strokeWidth={3} aria-hidden />}
              {w}
              <span className="sr-only">{done ? ' (found)' : ''}</span>
            </li>
          );
        })}
      </ul>
      <motion.div
        ref={gridRef}
        className={`word-grid ${interactive ? 'is-interactive' : ''}`}
        style={{ gridTemplateColumns: `repeat(${grid.size}, 1fr)` }}
        animate={miss ? { x: [0, -6, 6, -3, 0] } : { x: 0 }}
        transition={{ duration: 0.35 }}
        role="group"
        aria-label={`Letter grid, ${grid.size} by ${grid.size}. Select the first and last letter of a word.`}
        onPointerMove={(e) => {
          if (!dragging.current || !start) return;
          const c = cellFromPoint(e.clientX, e.clientY);
          if (c) setHover(c);
        }}
        onPointerUp={(e) => {
          if (!dragging.current) return;
          dragging.current = false;
          const c = cellFromPoint(e.clientX, e.clientY);
          if (start && c && key(c) !== key(start)) {
            startedNow.current = false;
            attempt(start, c);
          }
        }}
      >
        {grid.grid.map((row, r) =>
          row.map((letter, c) => {
            const k = `${r}-${c}`;
            const color = cellColor.get(k);
            const isFocus = focus[0] === r && focus[1] === c;
            return (
              <button
                key={k}
                type="button"
                data-r={r}
                data-c={c}
                tabIndex={interactive && isFocus ? 0 : -1}
                disabled={!interactive}
                className={`word-cell ${color ? 'is-found' : ''} ${preview.has(k) ? 'is-selecting' : ''}`}
                style={color ? { ['--word-color' as string]: color } : undefined}
                aria-label={`${letter}, row ${r + 1}, column ${c + 1}${start && key(start) === k ? ', selected' : ''}`}
                aria-pressed={start ? key(start) === k : undefined}
                onPointerDown={(e) => {
                  if (!interactive) return;
                  e.currentTarget.releasePointerCapture?.(e.pointerId);
                  if (!start) {
                    dragging.current = true;
                    startedNow.current = true;
                    setStart([r, c]);
                    setHover([r, c]);
                  }
                }}
                onClick={() => {
                  // A selection started on pointerdown already handled this press.
                  if (startedNow.current) {
                    startedNow.current = false;
                    return;
                  }
                  select([r, c]);
                }}
                onKeyDown={(e) => onKey(e, [r, c])}
                onFocus={() => setFocus([r, c])}
              >
                {letter}
              </button>
            );
          }),
        )}
      </motion.div>
      {interactive && (
        <p className="game-small" role="status">
          {found.length}/{words.length} found · Tap the first and last letter of a word, or drag across it.
        </p>
      )}
    </div>
  );
}
