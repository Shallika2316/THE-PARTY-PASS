export function mulberry32(seed: number) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export type Cell = [number, number];
export interface WordGrid {
  size: number;
  grid: string[][];
  placements: { word: string; cells: Cell[] }[];
}

const DIRECTIONS: Cell[] = [
  [0, 1], // across
  [1, 0], // down
  [1, 1], // diagonal
];

/** Deterministic word search: the host preview and the guest's grid are identical for the same seed. */
export function buildWordGrid(words: string[], seed: number): WordGrid {
  const longest = Math.max(...words.map((w) => w.length), 6);
  const size = Math.min(10, Math.max(8, longest + 1));
  for (let attempt = 0; attempt < 50; attempt++) {
    const rand = mulberry32(seed + attempt * 7919);
    const grid: string[][] = Array.from({ length: size }, () => Array(size).fill(''));
    const placements: WordGrid['placements'] = [];
    const sorted = [...words].sort((a, b) => b.length - a.length);
    let ok = true;
    for (const word of sorted) {
      let placed = false;
      for (let tries = 0; tries < 300 && !placed; tries++) {
        const [dr, dc] = DIRECTIONS[Math.floor(rand() * DIRECTIONS.length)];
        const r0 = Math.floor(rand() * (size - dr * (word.length - 1)));
        const c0 = Math.floor(rand() * (size - dc * (word.length - 1)));
        const cells: Cell[] = [...word].map((_, i) => [r0 + dr * i, c0 + dc * i]);
        if (cells.every(([r, c], i) => grid[r][c] === '' || grid[r][c] === word[i])) {
          cells.forEach(([r, c], i) => (grid[r][c] = word[i]));
          placements.push({ word, cells });
          placed = true;
        }
      }
      if (!placed) {
        ok = false;
        break;
      }
    }
    if (!ok) continue;
    const filler = 'ABCDEFGHIJKLMNOPRSTUVWY';
    for (const row of grid) for (let c = 0; c < size; c++) if (!row[c]) row[c] = filler[Math.floor(rand() * filler.length)];
    return { size, grid, placements };
  }
  throw new Error('Could not build word grid');
}

/** Returns the straight line of cells between two cells, or null if they aren't aligned. */
export function lineBetween(a: Cell, b: Cell): Cell[] | null {
  const dr = Math.sign(b[0] - a[0]);
  const dc = Math.sign(b[1] - a[1]);
  const len = Math.max(Math.abs(b[0] - a[0]), Math.abs(b[1] - a[1]));
  if (Math.abs(b[0] - a[0]) !== 0 && Math.abs(b[1] - a[1]) !== 0 && Math.abs(b[0] - a[0]) !== Math.abs(b[1] - a[1])) return null;
  return Array.from({ length: len + 1 }, (_, i) => [a[0] + dr * i, a[1] + dc * i] as Cell);
}

/** A shuffled tile order that is never already solved. */
export function shuffledTiles(count: number, seed: number) {
  const rand = mulberry32(seed);
  const order = Array.from({ length: count }, (_, i) => i);
  do {
    for (let i = order.length - 1; i > 0; i--) {
      const j = Math.floor(rand() * (i + 1));
      [order[i], order[j]] = [order[j], order[i]];
    }
  } while (order.every((v, i) => v === i));
  return order;
}
