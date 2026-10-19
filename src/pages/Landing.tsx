import { motion } from 'framer-motion';
import { Header } from '../components/Header';
import { ButtonLink, Eyebrow } from '../components/ui';

const ease = [0.22, 1, 0.36, 1] as const;
const rise = (delay: number) => ({
  initial: { opacity: 0, y: 24 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.7, delay, ease },
});

export default function Landing() {
  return (
    <div className="page landing">
      <HeroArt className="hero-art-desktop" src="/img/hero-plate.webp" crop={PLATE} />
      <Header />
      <main id="main" className="hero">
        <div className="hero-copy">
          <motion.div {...rise(0.05)}>
            <Eyebrow className="hero-eyebrow">
              Not just an invite.
              <br />
              An experience.
            </Eyebrow>
          </motion.div>
          <motion.h1 id="hero-title" className="hero-title" {...rise(0.15)}>
            <span>The</span>
            <span className="accent">Party</span>
            <span>Pass</span>
          </motion.h1>
          <motion.p className="hero-sub" {...rise(0.32)}>
            Turn your party invite into a game,{' '}
            <br />a surprise, a whole vibe.
          </motion.p>
          <motion.p className="hero-desc" {...rise(0.4)}>
            Create a personalised, interactive invitation{' '}
            <br />
            your friends will actually want to open, play and RSVP to.
          </motion.p>
          <motion.div className="hero-actions" {...rise(0.5)}>
            <ButtonLink to="/create/personalise" size="lg" arrow className="hero-cta">
              Create Your Invite
            </ButtonLink>
          </motion.div>
        </div>
        <HeroArt className="hero-art-mobile" src="/img/hero-collage.webp" crop={COLLAGE} />
      </main>
    </div>
  );
}

/* ---------- Hero imagery ---------- */

/** Rectangles (in source-image pixels, 1883×835) for the full plate and the collage-only crop. */
type Rect = { x: number; y: number; w: number; h: number };
const PLATE: Rect = { x: 0, y: 0, w: 1883, h: 835 };
const COLLAGE: Rect = { x: 870, y: 96, w: 1013, h: 739 };

const BALLS = [
  { cx: 1100, cy: 246, r: 118, glints: [[-0.42, -0.38, 1], [0.18, -0.55, 0.7], [-0.1, 0.25, 0.55], [0.5, 0.05, 0.6]] },
  { cx: 1187, cy: 345, r: 62, glints: [[-0.35, -0.3, 0.8], [0.3, 0.2, 0.55]] },
];
const WALL_GLINTS = [
  [905, 210, 14], [858, 300, 10], [935, 170, 9], [822, 236, 8], [880, 410, 11], [960, 470, 7], [1300, 120, 9],
];
const VINYL = { cx: 1773, cy: 584, r: 59 };

function HeroArt({ src, crop, className }: { src: string; crop: Rect; className: string }) {
  const at = (x: number, y: number) => ({ left: `${((x - crop.x) / crop.w) * 100}%`, top: `${((y - crop.y) / crop.h) * 100}%` });
  const size = (d: number) => `${(d / crop.w) * 100}%`;
  return (
    <motion.div className={`hero-art ${className}`} style={{ aspectRatio: `${crop.w} / ${crop.h}` }} initial={{ opacity: 0, scale: 1.02 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 1.1, ease }} aria-hidden="true">
      <img src={src} alt="" draggable={false} />
      {BALLS.map((b, i) => (
        <span key={i} className="ball-shine" style={{ ...at(b.cx, b.cy), width: size(b.r * 2) }}>
          <span className="ball-sheen" style={{ animationDelay: `${i * -2.3}s` }} />
          {b.glints.map(([gx, gy, s], j) => (
            <Glint key={j} style={{ left: `${50 + gx * 50}%`, top: `${50 + gy * 50}%`, width: `${s * 34}%`, animationDelay: `${(i * 3 + j) * 0.9}s` }} />
          ))}
        </span>
      ))}
      {WALL_GLINTS.map(([x, y, d], i) => (
        <Glint key={i} className="wall-glint" style={{ ...at(x, y), width: size(d * 2.4), animationDelay: `${i * 0.7}s` }} />
      ))}
      <span className="vinyl-spin" style={{ ...at(VINYL.cx, VINYL.cy), width: size(VINYL.r * 2) }}>
        <VinylLabel />
      </span>
    </motion.div>
  );
}

function Glint({ style, className }: { style: React.CSSProperties; className?: string }) {
  return (
    <svg className={`glint ${className ?? ''}`} style={style} viewBox="-12 -12 24 24">
      <path d="M0 -12 L1.6 -1.6 L12 0 L1.6 1.6 L0 12 L-1.6 1.6 L-12 0 L-1.6 -1.6Z" fill="#fff" />
      <circle r="2.2" fill="#fff" />
    </svg>
  );
}

/** Printed label that spins over the record in the photo. */
function VinylLabel() {
  return (
    <svg viewBox="-50 -50 100 100">
      <defs>
        <radialGradient id="label-gold" cx="45%" cy="40%" r="65%">
          <stop offset="0" stopColor="#fbc35c" />
          <stop offset="1" stopColor="#eaa63c" />
        </radialGradient>
        <path id="label-arc" d="M0 -36 A36 36 0 1 1 -0.01 -36" />
      </defs>
      <circle r="50" fill="url(#label-gold)" />
      <circle r="45" fill="none" stroke="#c98a2e" strokeOpacity="0.45" strokeWidth="0.8" />
      <circle r="21" fill="none" stroke="#c98a2e" strokeOpacity="0.45" strokeWidth="0.8" />
      <text fontSize="7" fontWeight="800" letterSpacing="1.6" fill="#a8702a" fillOpacity="0.75" fontFamily="Manrope, sans-serif">
        <textPath href="#label-arc">THE PARTY PASS • SIDE A • KOIKOI •</textPath>
      </text>
      <path d="M0 -15 l2.4 5 5.4 .6 -4 3.6 1.2 5.3 -5 -2.8 -5 2.8 1.2 -5.3 -4 -3.6 5.4 -.6z" fill="#d20d4b" opacity="0.6" />
      <text y="13" fontSize="5" fontWeight="800" textAnchor="middle" letterSpacing="1" fill="#9a6420" fontFamily="Manrope, sans-serif">
        33⅓
      </text>
      <circle r="3.6" fill="#2a1d12" />
    </svg>
  );
}
