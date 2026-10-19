import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';
import { KeyRound, Pause, Play, Sparkles } from 'lucide-react';
import { useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import { GAMES } from '../lib/constants';
import type { GuestInvite } from '../lib/types';
import { FitScale } from './FitScale';
import { FindTheVibe } from './games/FindTheVibe';
import { PuzzleGame } from './games/PuzzleGame';
import { gameHeadline, RsvpBlock, SealedPass, SoundtrackChip, UnlockAnimation, type Location } from './GuestExperience';
import { InvitationCard } from './InvitationCard';
import { TrackCard } from './TrackCard';

const SCREEN_W = 375;
const SCREEN_H = 740;

export interface Scene {
  id: 'open' | 'play' | 'unlock' | 'reveal' | 'rsvp';
  ms: number;
  label: string;
}

export function walkthroughScenes(invite: GuestInvite): Scene[] {
  const game = GAMES.find((g) => g.value === invite.game.type)?.label ?? 'the game';
  return [
    { id: 'open', ms: 3400, label: 'Opens the Party Pass' },
    { id: 'play', ms: 5200, label: `Plays ${game}` },
    { id: 'unlock', ms: 1900, label: 'Unlocks the invite' },
    { id: 'reveal', ms: 5800, label: invite.track ? 'Sees the details & soundtrack' : 'Sees the party details' },
    { id: 'rsvp', ms: 3600, label: 'RSVPs to you' },
  ];
}

interface Props {
  invite: GuestInvite;
  location: Location;
  /** Host-only: used to animate the answer being typed. Never part of the guest link. */
  answer?: string;
  scene: number;
  onScene: (i: number) => void;
  playing: boolean;
  onPlaying: (p: boolean) => void;
}

/** A looping, story-style walkthrough of the guest's real screens, rendered inside a phone. */
export function GuestWalkthrough({ invite, location, answer = '', scene, onScene, playing, onPlaying }: Props) {
  const scenes = useMemo(() => walkthroughScenes(invite), [invite]);
  const [elapsed, setElapsed] = useState(0);
  const current = scenes[scene];
  const progress = Math.min(1, elapsed / current.ms);

  useEffect(() => setElapsed(0), [scene]);

  useEffect(() => {
    if (!playing) return;
    const started = performance.now() - elapsed;
    const id = window.setInterval(() => {
      const e = performance.now() - started;
      if (e >= current.ms) {
        onScene((scene + 1) % scenes.length);
      } else setElapsed(e);
    }, 80);
    return () => window.clearInterval(id);
  }, [playing, scene, current.ms]);

  return (
    <div className="wt">
      <div className="phone-frame wt-phone">
        <div className="wt-screen">
          <div className="wt-bars" aria-hidden>
            {scenes.map((s, i) => (
              <span key={s.id}>
                <span style={{ transform: `scaleX(${i < scene ? 1 : i === scene ? progress : 0})` }} />
              </span>
            ))}
          </div>
          <FitScale width={SCREEN_W} height={SCREEN_H} className="wt-fit">
            <div className={`guest guest-${invite.vibe} wt-canvas`} aria-hidden>
              <AnimatePresence mode="wait">
                <motion.div key={current.id} className="wt-scene" initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} transition={{ duration: 0.3 }}>
                  {current.id === 'open' && <OpenScene invite={invite} progress={progress} />}
                  {current.id === 'play' && <PlayScene invite={invite} answer={answer} progress={progress} />}
                  {current.id === 'unlock' && <UnlockAnimation />}
                  {current.id === 'reveal' && <RevealScene invite={invite} location={location} playing={playing} ms={current.ms} />}
                  {current.id === 'rsvp' && <RsvpScene invite={invite} progress={progress} />}
                </motion.div>
              </AnimatePresence>
            </div>
          </FitScale>
        </div>
      </div>
      <button type="button" className="wt-toggle" onClick={() => onPlaying(!playing)} aria-label={playing ? 'Pause walkthrough' : 'Play walkthrough'}>
        {playing ? <Pause size={16} fill="currentColor" /> : <Play size={16} fill="currentColor" />}
      </button>
    </div>
  );
}

function OpenScene({ invite, progress }: { invite: GuestInvite; progress: number }) {
  const game = GAMES.find((g) => g.value === invite.game.type) ?? GAMES[0];
  return (
    <div className="guest-scene guest-welcome">
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
      <span className={`btn btn-primary btn-lg guest-cta wt-press ${progress > 0.8 ? 'is-pressed' : ''}`}>Let’s play →</span>
    </div>
  );
}

function PlayScene({ invite, answer, progress }: { invite: GuestInvite; answer: string; progress: number }) {
  const type = invite.game.type;
  return (
    <div className="guest-scene guest-game">
      <p className="eyebrow">{GAMES.find((g) => g.value === type)?.label}</p>
      <h1 className="guest-title guest-title-sm">{gameHeadline(invite)}</h1>
      {type === 'crack-the-code' && <CodeDemo clue={invite.game.clue ?? ''} answer={answer} progress={progress} />}
      {type === 'find-the-vibe' && <FindTheVibe words={invite.game.words ?? []} seed={invite.game.seed ?? 1} interactive={false} revealed={Math.floor(progress * ((invite.game.words?.length ?? 0) + 1))} />}
      {type === 'piece-together' && (
        <PuzzleGame
          art={invite.game.art ?? 'poster'}
          difficulty={invite.game.difficulty ?? 'easy'}
          seed={invite.game.seed ?? 1}
          guestName={invite.guestName}
          partyLabel={invite.partyLabel}
          demoPlaced={Math.floor(Math.max(0, progress - 0.1) * 1.25 * (invite.game.difficulty === 'standard' ? 16 : 9))}
        />
      )}
    </div>
  );
}

function CodeDemo({ clue, answer, progress }: { clue: string; answer: string; progress: number }) {
  const shown = answer || 'the answer';
  const typed = shown.slice(0, Math.floor(Math.max(0, progress - 0.15) * 1.6 * shown.length));
  return (
    <div className="game game-code">
      <div className="clue-card">
        <p className="eyebrow">The clue</p>
        <p className="clue-text">{clue}</p>
      </div>
      <div className="code-form">
        <span className="label">Your answer</span>
        <div className="input-wrap has-icon">
          <span className="input-icon">
            <KeyRound size={18} />
          </span>
          <span className="input wt-input">
            {typed}
            <span className="wt-caret" />
          </span>
        </div>
        <span className={`btn btn-primary btn-lg btn-block wt-press ${progress > 0.85 ? 'is-pressed' : ''}`}>Unlock the Invite →</span>
      </div>
    </div>
  );
}

function RevealScene({ invite, location, playing, ms }: { invite: GuestInvite; location: Location; playing: boolean; ms: number }) {
  const ref = useRef<HTMLDivElement>(null);
  const [distance, setDistance] = useState(0);
  const reduce = useReducedMotion();
  useLayoutEffect(() => {
    const h = ref.current?.scrollHeight ?? 0;
    setDistance(Math.max(0, h - (SCREEN_H - 60)));
  }, []);
  return (
    <div className="wt-reveal">
      <motion.div
        ref={ref}
        className="guest-scene guest-reveal"
        initial={{ y: 0 }}
        animate={playing && !reduce ? { y: -distance } : { y: 0 }}
        transition={{ duration: (ms - 1600) / 1000, delay: 0.9, ease: 'easeInOut' }}
      >
        <p className="eyebrow">Unlocked</p>
        <h1 className="guest-title guest-title-sm">
          It’s official, <span className="accent">{invite.guestName || 'friend'}</span>.
        </h1>
        <InvitationCard invite={invite} location={location}>
          {invite.track && <TrackCard track={invite.track} heading="The soundtrack" staticPlayer />}
        </InvitationCard>
      </motion.div>
    </div>
  );
}

function RsvpScene({ invite, progress }: { invite: GuestInvite; progress: number }) {
  const answered = progress > 0.4;
  return (
    <div className="guest-scene wt-rsvp">
      {!answered ? (
        <RsvpBlock invite={invite} rsvp={progress > 0.3 ? 'yes' : null} onRsvp={() => {}} />
      ) : (
        <div className="rsvp-confirm">
          <motion.div className="rsvp-stamp is-yes" initial={{ scale: 1.6, rotate: -18, opacity: 0 }} animate={{ scale: 1, rotate: -8, opacity: 1 }} transition={{ type: 'spring', stiffness: 260, damping: 16 }}>
            You’re in!
          </motion.div>
          <h1 className="guest-title guest-title-sm">See you there, {invite.guestName || 'friend'}.</h1>
          <p className="guest-lede">One tap tells {invite.hostName || 'the host'} the good news.</p>
        </div>
      )}
    </div>
  );
}
