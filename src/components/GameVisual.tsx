import { Lock } from 'lucide-react';
import type { GameType } from '../lib/types';

/** Small illustrative motifs for each mini-game. */
export function GameVisual({ type }: { type: GameType }) {
  if (type === 'crack-the-code')
    return (
      <div className="game-visual gv-code" aria-hidden>
        <span className="gv-lock">
          <Lock size={26} />
        </span>
        <div className="gv-tiles">
          {['L', 'I', 'B', '?'].map((t, i) => (
            <span key={i}>{t}</span>
          ))}
        </div>
        <span className="gv-clue">“The place where we first met.”</span>
      </div>
    );
  if (type === 'find-the-vibe')
    return (
      <div className="game-visual gv-words" aria-hidden>
        {'DANCEXQMUSICRKPCAKEJVIBES'.split('').map((l, i) => (
          <span key={i} className={i < 5 || (i >= 7 && i < 12) ? 'hit' : ''}>
            {l}
          </span>
        ))}
      </div>
    );
  return (
    <div className="game-visual gv-puzzle" aria-hidden>
      {Array.from({ length: 9 }, (_, i) => (
        <span key={i} style={{ backgroundPosition: `${(i % 3) * 50}% ${Math.floor(i / 3) * 50}%`, transform: i === 4 ? 'translate(10px,-8px) rotate(6deg)' : i === 7 ? 'translate(-6px,8px) rotate(-5deg)' : undefined }} />
      ))}
    </div>
  );
}
