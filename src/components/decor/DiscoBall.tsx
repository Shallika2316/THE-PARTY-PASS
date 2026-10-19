import { useId, useMemo } from 'react';
import { mulberry32 } from '../../lib/games';

interface Props {
  size?: number;
  seed?: number;
  tint?: 'silver' | 'pink';
  className?: string;
  style?: React.CSSProperties;
}

const R = 96;
const toRad = (d: number) => (d * Math.PI) / 180;
const LIGHT = (() => {
  const v = [-0.55, 0.62, 0.56];
  const l = Math.hypot(...v);
  return v.map((x) => x / l);
})();

/** Procedurally drawn mirror ball: projected facets with lighting and random reflections. */
export function DiscoBall({ size = 200, seed = 7, tint = 'silver', className, style }: Props) {
  const uid = useId().replace(/:/g, '');
  const tiles = useMemo(() => {
    const rand = mulberry32(seed);
    const out: { d: string; fill: string }[] = [];
    const bands = 22;
    for (let b = 0; b < bands; b++) {
      const lat0 = -90 + (180 / bands) * b;
      const lat1 = lat0 + 180 / bands;
      const mid = (lat0 + lat1) / 2;
      const count = Math.max(6, Math.round(44 * Math.cos(toRad(mid))));
      const step = 360 / count;
      const phase = rand() * step;
      for (let t = 0; t < count; t++) {
        let lon0 = -180 + phase + step * t;
        let lon1 = lon0 + step;
        if (lon1 <= -90 || lon0 >= 90) continue;
        lon0 = Math.max(lon0, -90);
        lon1 = Math.min(lon1, 90);
        const pt = (lat: number, lon: number) => [R * Math.cos(toRad(lat)) * Math.sin(toRad(lon)), -R * Math.sin(toRad(lat))];
        const pts = [pt(lat0, lon0), pt(lat0, lon1), pt(lat1, lon1), pt(lat1, lon0)];
        const cl = (lon0 + lon1) / 2;
        const n = [Math.cos(toRad(mid)) * Math.sin(toRad(cl)), Math.sin(toRad(mid)), Math.cos(toRad(mid)) * Math.cos(toRad(cl))];
        const diffuse = Math.max(0, n[0] * LIGHT[0] + n[1] * LIGHT[1] + n[2] * LIGHT[2]);
        const r = rand();
        let fill: string;
        if (diffuse > 0.95 || r > 0.975) fill = '#ffffff';
        else {
          const base = 105 + diffuse * 115 + (rand() - 0.5) * 70;
          const g = Math.max(45, Math.min(240, Math.round(base)));
          if (tint === 'pink') {
            fill = r < 0.45 ? `rgb(${Math.min(255, g + 70)},${Math.round(g * 0.3)},${Math.round(g * 0.45)})` : `rgb(${Math.min(255, g + 35)},${Math.round(g * 0.72)},${Math.round(g * 0.78)})`;
          } else if (r < 0.035) fill = `rgb(${Math.min(255, g + 40)},${Math.round(g * 0.8)},${Math.round(g * 0.85)})`;
          else if (r < 0.06) fill = `rgb(${Math.min(255, g + 25)},${Math.min(255, g + 15)},${Math.round(g * 0.78)})`;
          else fill = `rgb(${g},${g},${Math.min(255, g + 8)})`;
        }
        out.push({ d: `M${pts.map((p) => p.map((v) => v.toFixed(2)).join(' ')).join('L')}Z`, fill });
      }
    }
    return out;
  }, [seed, tint]);

  return (
    <svg className={className} style={style} width={size} height={size} viewBox="-100 -100 200 200" aria-hidden="true" focusable="false">
      <defs>
        <radialGradient id={`shade-${uid}`} cx="38%" cy="32%" r="70%">
          <stop offset="0%" stopColor="#fff" stopOpacity="0.18" />
          <stop offset="55%" stopColor="#000" stopOpacity="0" />
          <stop offset="100%" stopColor="#000" stopOpacity="0.55" />
        </radialGradient>
        <clipPath id={`clip-${uid}`}>
          <circle r={R} />
        </clipPath>
      </defs>
      <g clipPath={`url(#clip-${uid})`} transform="rotate(-14)">
        <circle r={R} fill="#2b2a2d" />
        {tiles.map((t, i) => (
          <path key={i} d={t.d} fill={t.fill} stroke="#3a393d" strokeWidth="0.55" />
        ))}
        <circle r={R} fill={`url(#shade-${uid})`} />
      </g>
      <path d="M-40 -52 l3 -14 l3 14 l14 3 l-14 3 l-3 14 l-3 -14 l-14 -3z" fill="#fff" opacity="0.95" />
    </svg>
  );
}
