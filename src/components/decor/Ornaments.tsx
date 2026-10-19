import { useId } from 'react';

type SvgProps = { size?: number; className?: string; style?: React.CSSProperties };

const PALETTES = {
  gold: ['#FBE3A1', '#D7A34A', '#9C6B1E'],
  silver: ['#FFFFFF', '#C9CBD1', '#7C7F88'],
  pink: ['#FF8DB0', '#D20D4B', '#8E0631'],
  blue: ['#6E86F0', '#2346C6', '#132A86'],
};

/** Five-point metallic star built from bevelled facets. */
export function Star({ size = 40, tone = 'gold', className, style }: SvgProps & { tone?: keyof typeof PALETTES }) {
  const [light, mid, dark] = PALETTES[tone];
  const pts = Array.from({ length: 10 }, (_, i) => {
    const r = i % 2 === 0 ? 48 : 20;
    const a = (Math.PI / 5) * i - Math.PI / 2;
    return [r * Math.cos(a), r * Math.sin(a)];
  });
  return (
    <svg className={className} style={style} width={size} height={size} viewBox="-50 -50 100 100" aria-hidden="true" focusable="false">
      {pts.map((p, i) => {
        const q = pts[(i + 1) % 10];
        return <path key={i} d={`M0 0L${p[0]} ${p[1]}L${q[0]} ${q[1]}Z`} fill={i % 2 === 0 ? (i < 5 ? light : mid) : i < 5 ? mid : dark} />;
      })}
      <path d={`M${pts.map((p) => p.join(' ')).join('L')}Z`} fill="none" stroke={dark} strokeOpacity="0.35" strokeWidth="1" />
    </svg>
  );
}

/** Flat paper-cut burst (the blue eight-point star on the invite). */
export function Burst({ size = 60, color = '#2346C6', points = 8, className, style }: SvgProps & { color?: string; points?: number }) {
  const d = Array.from({ length: points * 2 }, (_, i) => {
    const r = i % 2 === 0 ? 48 : 17;
    const a = (Math.PI / points) * i - Math.PI / 2;
    return `${(r * Math.cos(a)).toFixed(1)} ${(r * Math.sin(a)).toFixed(1)}`;
  }).join('L');
  return (
    <svg className={className} style={style} width={size} height={size} viewBox="-50 -50 100 100" aria-hidden="true" focusable="false">
      <path d={`M${d}Z`} fill={color} />
    </svg>
  );
}

/** Martini glass with liquid. */
export function Cocktail({ size = 120, liquid = 'pink', className, style }: SvgProps & { liquid?: 'pink' | 'blue' }) {
  const id = useId().replace(/:/g, '');
  const [top, bottom] = liquid === 'pink' ? ['#E0335F', '#7C0425'] : ['#3756E0', '#13207A'];
  return (
    <svg className={className} style={style} width={size} height={size * 1.15} viewBox="0 0 100 115" aria-hidden="true" focusable="false">
      <defs>
        <linearGradient id={`liq-${id}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor={top} />
          <stop offset="1" stopColor={bottom} />
        </linearGradient>
        <linearGradient id={`glass-${id}`} x1="0" y1="0" x2="1" y2="0">
          <stop offset="0" stopColor="#fff" stopOpacity="0.55" />
          <stop offset="0.5" stopColor="#fff" stopOpacity="0.08" />
          <stop offset="1" stopColor="#fff" stopOpacity="0.4" />
        </linearGradient>
      </defs>
      <path d="M8 10 L92 10 L52 56 L48 56 Z" fill={`url(#glass-${id})`} stroke="#9aa0ae" strokeWidth="1.3" />
      <path d="M16 18 L84 18 L51.5 54 L48.5 54 Z" fill={`url(#liq-${id})`} />
      <ellipse cx="50" cy="18" rx="34" ry="3.2" fill={top} opacity="0.9" />
      <ellipse cx="50" cy="10" rx="42" ry="3.5" fill="none" stroke="#b9bfcc" strokeWidth="1.3" />
      <path d="M22 16 L46 46" stroke="#fff" strokeOpacity="0.55" strokeWidth="2.5" strokeLinecap="round" />
      <rect x="48.4" y="56" width="3.2" height="44" fill="#c9ced8" />
      <rect x="49" y="56" width="1" height="44" fill="#fff" opacity="0.7" />
      <ellipse cx="50" cy="104" rx="22" ry="5" fill="#d9dde5" stroke="#9aa0ae" strokeWidth="1.2" />
    </svg>
  );
}

/** Glossy paper heart. */
export function Heart({ size = 60, className, style }: SvgProps) {
  const id = useId().replace(/:/g, '');
  return (
    <svg className={className} style={style} width={size} height={size} viewBox="0 0 100 92" aria-hidden="true" focusable="false">
      <defs>
        <radialGradient id={`h-${id}`} cx="35%" cy="30%" r="80%">
          <stop offset="0" stopColor="#FF8A8E" />
          <stop offset="0.55" stopColor="#E3343F" />
          <stop offset="1" stopColor="#A10F25" />
        </radialGradient>
      </defs>
      <path d="M50 88 C20 66 4 48 4 28 C4 13 15 4 28 4 C38 4 46 10 50 19 C54 10 62 4 72 4 C85 4 96 13 96 28 C96 48 80 66 50 88Z" fill={`url(#h-${id})`} />
      <path d="M20 22 C22 15 28 12 34 13" stroke="#fff" strokeOpacity="0.7" strokeWidth="5" fill="none" strokeLinecap="round" />
    </svg>
  );
}

export function Vinyl({ size = 260, className, style }: SvgProps) {
  return (
    <svg className={className} style={style} width={size} height={size} viewBox="-100 -100 200 200" aria-hidden="true" focusable="false">
      <circle r="99" fill="#141313" />
      {Array.from({ length: 16 }, (_, i) => (
        <circle key={i} r={94 - i * 3.6} fill="none" stroke="#2a2828" strokeWidth="0.8" />
      ))}
      <path d="M-70 -60 A92 92 0 0 1 10 -91" stroke="#fff" strokeOpacity="0.16" strokeWidth="10" fill="none" />
      <circle r="34" fill="#E2B84F" />
      <circle r="26" fill="none" stroke="#B8902F" strokeWidth="1" />
      <circle r="4" fill="#141313" />
    </svg>
  );
}

/** Curling satin ribbon. */
export function Ribbon({ width = 520, className, style }: { width?: number; className?: string; style?: React.CSSProperties }) {
  const id = useId().replace(/:/g, '');
  return (
    <svg className={className} style={style} width={width} height={width * 0.32} viewBox="0 0 500 160" aria-hidden="true" focusable="false" fill="none">
      <defs>
        <linearGradient id={`r-${id}`} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#B80A3A" />
          <stop offset="0.5" stopColor="#E3214F" />
          <stop offset="1" stopColor="#8E0631" />
        </linearGradient>
      </defs>
      <path d="M6 40 C60 10 110 20 140 60 C170 100 150 140 120 130 C90 120 110 70 170 70 C240 70 250 140 320 130 C390 120 380 50 430 60 C470 68 480 110 496 120" stroke={`url(#r-${id})`} strokeWidth="13" strokeLinecap="round" />
      <path d="M6 37 C60 7 110 17 140 57 M170 67 C240 67 250 137 320 127" stroke="#fff" strokeOpacity="0.28" strokeWidth="2.5" strokeLinecap="round" />
    </svg>
  );
}

/** Scattered paper confetti. Positions are fixed so the layout stays calm. */
export function ConfettiScatter({ pieces, className }: { pieces: { x: string; y: string; c: string; s?: number; r?: number; shape?: 'dot' | 'rect' }[]; className?: string }) {
  return (
    <div className={`confetti-scatter ${className ?? ''}`} aria-hidden="true">
      {pieces.map((p, i) => (
        <span
          key={i}
          className={`confetti-piece ${p.shape ?? 'dot'}`}
          style={{ left: p.x, top: p.y, background: p.c, width: p.s ?? 14, height: p.shape === 'rect' ? (p.s ?? 14) * 0.6 : p.s ?? 14, transform: `rotate(${p.r ?? 0}deg)` }}
        />
      ))}
    </div>
  );
}

export function Ticket({ className, style, lines = ['Good', 'Music', 'Great', 'People'] }: { className?: string; style?: React.CSSProperties; lines?: string[] }) {
  return (
    <div className={`paper-ticket ${className ?? ''}`} style={style} aria-hidden="true">
      <div className="paper-ticket-inner">
        {lines.map((l) => (
          <span key={l}>{l}</span>
        ))}
        <Star size={14} tone="pink" />
      </div>
    </div>
  );
}

export function FilmStrip({ photos, className, style }: { photos: string[]; className?: string; style?: React.CSSProperties }) {
  return (
    <div className={`film-strip ${className ?? ''}`} style={style} aria-hidden="true">
      {photos.map((p) => (
        <div key={p} className="film-frame">
          <img src={p} alt="" />
        </div>
      ))}
    </div>
  );
}
