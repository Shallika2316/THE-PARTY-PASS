import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';
import { ArrowLeft, CalendarPlus, Lock, MessageCircle, Navigation, PartyPopper, RotateCcw, Sparkles } from 'lucide-react';
import { useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { gameLabel, GAMES } from '../lib/constants';
import { possessive, revealHidden } from '../lib/invitation';
import { buildIcs, downloadFile, mapsLink, whatsappLink } from '../lib/share';
import type { GuestInvite, RsvpResponse } from '../lib/types';
import { ConfettiBurst } from './Confetti';
import { DiscoBall } from './decor/DiscoBall';
import { Star } from './decor/Ornaments';
import { CrackTheCode } from './games/CrackTheCode';
import { FindTheVibe } from './games/FindTheVibe';
import { PuzzleGame } from './games/PuzzleGame';
import { InvitationCard } from './InvitationCard';
import { Artwork, PlayButton, TrackCard } from './TrackCard';
import { Button, PrototypeNote } from './ui';

export type GuestStage = 'welcome' | 'game' | 'unlocking' | 'reveal' | 'rsvp';
export type Location = { venue?: string; address?: string };

interface Props {
  invite: GuestInvite;
  stage: GuestStage;
  go: (stage: GuestStage) => void;
  unlocked: Location | null;
  onUnlock: (loc: Location) => void;
  rsvp: RsvpResponse | null;
  onRsvp: (r: RsvpResponse | null) => void;
  /** Demo/preview mode: nothing is saved and copy says so. */
  demo?: boolean;
}

const scene = {
  initial: { opacity: 0, y: 18 },
  animate: { opacity: 1, y: 0, transition: { duration: 0.4, ease: [0.22, 1, 0.36, 1] } },
  exit: { opacity: 0, y: -12, transition: { duration: 0.2 } },
};

export function GuestExperience({ invite, stage, go, unlocked, onUnlock, rsvp, onRsvp, demo }: Props) {
  const game = GAMES.find((g) => g.value === invite.game.type) ?? GAMES[0];

  const solve = (loc: Location) => {
    const fromHidden = invite.hidden ? revealHidden(invite) : null;
    onUnlock({ venue: invite.venue, address: invite.address, ...fromHidden, ...loc });
    go('unlocking');
  };

  return (
    <div className={`guest guest-${invite.vibe}`}>
      <AnimatePresence mode="wait">
        {stage === 'welcome' && (
          <motion.section key="welcome" className="guest-scene guest-welcome" {...scene}>
            <SealedPass invite={invite} />
            <p className="eyebrow">KoiKoi · The Party Pass</p>
            <h1 className="guest-title">
              <span className="accent">{invite.guestName || 'Hey you'}</span>, you’ve got a Party&nbsp;Pass.
            </h1>
            <p className="guest-lede">But first, there’s a little something to solve.</p>
            <div className="guest-game-chip">
              <Sparkles size={16} aria-hidden />
              <span>
                <strong>{game.label}</strong> · {game.guestLine}
              </span>
            </div>
            {invite.track && <SoundtrackChip invite={invite} />}
            <Button size="lg" arrow onClick={() => go('game')} className="guest-cta">
              Let’s play
            </Button>
            <p className="guest-from">From {invite.hostName || 'your host'}, with love (and a little mischief).</p>
          </motion.section>
        )}

        {stage === 'game' && (
          <motion.section key="game" className="guest-scene guest-game" {...scene}>
            <button type="button" className="back-link" onClick={() => go('welcome')}>
              <ArrowLeft size={16} aria-hidden /> Back
            </button>
            <p className="eyebrow">{game.label}</p>
            <h1 className="guest-title guest-title-sm">{gameHeadline(invite)}</h1>
            {invite.game.type === 'crack-the-code' && <CrackTheCode invite={invite} onSolved={solve} />}
            {invite.game.type === 'find-the-vibe' && <FindTheVibe words={invite.game.words ?? []} seed={invite.game.seed ?? 1} onSolved={() => solve({})} />}
            {invite.game.type === 'piece-together' && (
              <PuzzleGame art={invite.game.art ?? 'poster'} difficulty={invite.game.difficulty ?? 'easy'} seed={invite.game.seed ?? 1} guestName={invite.guestName} partyLabel={invite.partyLabel} onSolved={() => solve({})} />
            )}
            {demo && invite.id === 'demo-riya' && <p className="demo-tip">Demo tip: the answer is “the library”.</p>}
          </motion.section>
        )}

        {stage === 'unlocking' && (
          <motion.section key="unlocking" className="guest-scene guest-unlocking" {...scene} aria-live="assertive">
            <UnlockAnimation onDone={() => go('reveal')} />
          </motion.section>
        )}

        {stage === 'reveal' && (
          <motion.section key="reveal" className="guest-scene guest-reveal" {...scene}>
            <p className="eyebrow">Unlocked</p>
            <h1 className="guest-title guest-title-sm">
              It’s official, <span className="accent">{invite.guestName || 'friend'}</span>.
            </h1>
            <motion.div initial={{ rotateX: -70, opacity: 0 }} animate={{ rotateX: 0, opacity: 1 }} transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }} style={{ transformOrigin: 'top center' }}>
              <InvitationCard invite={invite} location={unlocked}>
                {invite.track && <TrackCard track={invite.track} heading="The soundtrack" />}
              </InvitationCard>
            </motion.div>
            <InviteActions invite={invite} location={unlocked} />
            <RsvpBlock invite={invite} rsvp={rsvp} onRsvp={(r) => { onRsvp(r); go('rsvp'); }} />
          </motion.section>
        )}

        {stage === 'rsvp' && (
          <motion.section key="rsvp" className="guest-scene guest-rsvp-done" {...scene}>
            <RsvpConfirmation invite={invite} rsvp={rsvp} demo={demo} onChange={() => { onRsvp(null); go('reveal'); }} onBack={() => go('reveal')} />
          </motion.section>
        )}
      </AnimatePresence>
    </div>
  );
}

export function gameHeadline(invite: GuestInvite) {
  if (invite.game.type === 'find-the-vibe') return 'Find every word to unlock the party.';
  if (invite.game.type === 'piece-together') return 'Piece the picture back together.';
  return 'Crack the code, claim your pass.';
}

export function SealedPass({ invite }: { invite: GuestInvite }) {
  return (
    <div className="sealed-pass" aria-hidden>
      <DiscoBall size={120} seed={5} className="sealed-ball" />
      <div className="sealed-card">
        <span className="sealed-top">Admit one</span>
        <span className="sealed-name">{invite.guestName || 'Guest'}</span>
        <span className="sealed-lock">
          <Lock size={22} />
        </span>
        <span className="sealed-game">{gameLabel(invite.game.type)}</span>
      </div>
      <Star size={30} tone="gold" className="sealed-star" />
    </div>
  );
}

export function SoundtrackChip({ invite }: { invite: GuestInvite }) {
  const t = invite.track!;
  return (
    <div className="soundtrack-chip">
      <Artwork track={t} size={44} />
      <div className="soundtrack-meta">
        <span className="soundtrack-label">Your host picked a soundtrack</span>
        <span className="soundtrack-title">
          {t.title} · {t.artist}
        </span>
      </div>
      {t.previewUrl ? (
        <PlayButton track={t} label="soundtrack" />
      ) : t.externalUrl ? (
        <a className="btn btn-secondary btn-sm" href={t.externalUrl} target="_blank" rel="noopener noreferrer">
          Open song
        </a>
      ) : null}
    </div>
  );
}

export function UnlockAnimation({ onDone }: { onDone?: () => void }) {
  const reduce = useReducedMotion();
  const done = useRef(onDone);
  done.current = onDone;
  useEffect(() => {
    const t = window.setTimeout(() => done.current?.(), reduce ? 500 : 1700);
    return () => window.clearTimeout(t);
  }, [reduce]);
  return (
    <div className="unlock-stage">
      <ConfettiBurst />
      <svg className="unlock-lock" viewBox="0 0 120 140" width="120" height="140" aria-hidden>
        <motion.path
          d="M30 62 V40 a30 30 0 0 1 60 0 V62"
          fill="none"
          stroke="currentColor"
          strokeWidth="12"
          strokeLinecap="round"
          initial={{ y: 0, rotate: 0 }}
          animate={reduce ? {} : { y: -14, rotate: -18 }}
          style={{ originX: '25%', originY: '100%' }}
          transition={{ delay: 0.2, duration: 0.45, ease: [0.34, 1.56, 0.64, 1] }}
        />
        <rect x="16" y="60" width="88" height="70" rx="16" fill="currentColor" />
        <circle cx="60" cy="92" r="9" fill="#FFF9F0" />
        <rect x="56" y="96" width="8" height="16" rx="4" fill="#FFF9F0" />
      </svg>
      <motion.p className="unlock-text" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: reduce ? 0 : 0.5 }}>
        <PartyPopper size={20} aria-hidden /> Unlocked! Opening your invite…
      </motion.p>
    </div>
  );
}

function InviteActions({ invite, location }: { invite: GuestInvite; location: Location | null }) {
  const address = [location?.venue, location?.address].filter(Boolean).join(', ');
  return (
    <div className="invite-actions">
      <Button variant="secondary" icon={<CalendarPlus size={18} aria-hidden />} onClick={() => downloadFile(`party-pass-${invite.id}.ics`, buildIcs(invite, location ?? {}), 'text/calendar;charset=utf-8')} disabled={!invite.date || !invite.startTime}>
        Add to calendar
      </Button>
      {address && (
        <a className="btn btn-secondary btn-md" href={mapsLink(address)} target="_blank" rel="noopener noreferrer">
          <Navigation size={18} aria-hidden />
          <span>Get directions</span>
        </a>
      )}
    </div>
  );
}

export function RsvpBlock({ invite, rsvp, onRsvp }: { invite: GuestInvite; rsvp: RsvpResponse | null; onRsvp: (r: RsvpResponse) => void }) {
  return (
    <div className="rsvp-block">
      <h2 className="rsvp-title">So, are you in?</h2>
      <p className="rsvp-sub">Let {invite.hostName || 'your host'} know if you’re coming.</p>
      <div className="rsvp-buttons">
        <Button size="lg" onClick={() => onRsvp('yes')} aria-pressed={rsvp === 'yes'}>
          I’m so in!
        </Button>
        <Button size="lg" variant="secondary" onClick={() => onRsvp('no')} aria-pressed={rsvp === 'no'}>
          Can’t make it
        </Button>
      </div>
    </div>
  );
}

function RsvpConfirmation({ invite, rsvp, demo, onChange, onBack }: { invite: GuestInvite; rsvp: RsvpResponse | null; demo?: boolean; onChange: () => void; onBack: () => void }) {
  const yes = rsvp === 'yes';
  const host = invite.hostName || 'your host';
  const text = yes
    ? `Hey ${host}! I unlocked my Party Pass and I’m so in for the ${invite.partyLabel.toLowerCase()}! 🎉`
    : `Hey ${host}, I unlocked my Party Pass but sadly can’t make the ${invite.partyLabel.toLowerCase()}. Have the best time! 💗`;
  if (!rsvp) {
    return (
      <div className="rsvp-confirm">
        <p className="guest-lede">You haven’t replied yet.</p>
        <Button onClick={onBack}>Back to the invite</Button>
      </div>
    );
  }
  return (
    <div className="rsvp-confirm">
      {yes && <ConfettiBurst count={30} />}
      <motion.div className={`rsvp-stamp ${yes ? 'is-yes' : 'is-no'}`} initial={{ scale: 1.6, rotate: -18, opacity: 0 }} animate={{ scale: 1, rotate: -8, opacity: 1 }} transition={{ type: 'spring', stiffness: 260, damping: 16 }}>
        {yes ? 'You’re in!' : 'Maybe next time'}
      </motion.div>
      <h1 className="guest-title guest-title-sm">{yes ? `See you at ${possessive(host)} ${invite.partyLabel.toLowerCase()}.` : `We’ll miss you, ${invite.guestName || 'friend'}.`}</h1>
      <p className="guest-lede">{yes ? 'Your Party Pass is saved. Bring your best energy.' : 'Thanks for letting them know. It means a lot.'}</p>

      <PrototypeNote>
        {demo
          ? 'This is a demo. Nothing was saved or sent.'
          : `Your answer is saved on this device only. This prototype has no server, so ${host} isn’t notified automatically. Send them a quick message:`}
      </PrototypeNote>
      {!demo && (
        <a className="btn btn-primary btn-lg" href={whatsappLink(text)} target="_blank" rel="noopener noreferrer">
          <MessageCircle size={20} aria-hidden />
          <span>Tell {host} on WhatsApp</span>
        </a>
      )}
      <div className="rsvp-after">
        <button type="button" className="btn btn-quiet btn-md" onClick={onChange}>
          <RotateCcw size={16} aria-hidden />
          <span>Change my answer</span>
        </button>
        <button type="button" className="btn btn-quiet btn-md" onClick={onBack}>
          <span>View the invite</span>
        </button>
      </div>
      {!demo && (
        <p className="guest-made">
          Made with <Link to="/">The Party Pass by KoiKoi</Link>. <Link to="/create/personalise">Make your own</Link>.
        </p>
      )}
    </div>
  );
}
