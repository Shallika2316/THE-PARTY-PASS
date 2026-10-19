import { motion, useReducedMotion } from 'framer-motion';
import { ArrowLeft, Gamepad2, Lock, Music2, PenLine, PlayCircle, Volume2, VolumeX, Zap } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { Link, Navigate, useNavigate } from 'react-router-dom';
import { FitScale } from '../../components/FitScale';
import { GuestWalkthrough, walkthroughScenes } from '../../components/GuestWalkthrough';
import { InvitationCard } from '../../components/InvitationCard';
import { Watermark } from '../../components/Watermark';
import { clipLabel } from '../../components/TrackCard';
import { Button, SelectCard } from '../../components/ui';
import { clipFor, useAudio } from '../../lib/audio';
import { toGuestInvite } from '../../lib/invitation';
import { useDraft } from '../../lib/store';
import { completedSteps, FLOW } from './CreateLayout';
import { GuestDemo } from './GuestDemo';

const PLANS = [
  { id: 'one', name: '1 Party Pass', price: '₹199', was: '₹499', off: '60% off', note: 'send this one' },
  { id: 'five', name: '5 Party Passes', price: '₹599', was: '₹995', off: '40% off', note: '₹119 / pass' },
];

/** Final screen: the invite, a walkthrough of what the guest will see, then the unlock. */
export default function Ready() {
  const { draft, publish } = useDraft();
  const navigate = useNavigate();
  const reduce = useReducedMotion();
  const guest = useMemo(() => toGuestInvite(draft), [draft]);
  const scenes = useMemo(() => walkthroughScenes(guest), [guest]);
  const [scene, setScene] = useState(0);
  const [playing, setPlaying] = useState(!reduce);
  const [plan, setPlan] = useState('one');
  const [processing, setProcessing] = useState(false);
  const [demoOpen, setDemoOpen] = useState(false);
  const track = guest.track;
  const [soundOn, setSoundOn] = useState(true);
  const [blocked, setBlocked] = useState(false);
  const music = useAudio(track?.previewUrl, clipFor(track, true));

  // The chosen 15-second moment loops alongside the walkthrough. Browsers may block sound
  // until the page has been clicked; then the pill asks for a tap instead.
  useEffect(() => {
    if (!track?.previewUrl) return;
    if (playing && soundOn && !demoOpen) music.play().then((ok) => setBlocked(!ok));
    else music.stop();
  }, [playing, soundOn, demoOpen, track?.previewUrl, track?.clipStart]); // eslint-disable-line react-hooks/exhaustive-deps
  useEffect(() => () => music.stop(), []); // eslint-disable-line react-hooks/exhaustive-deps

  const done = completedSteps(draft);
  if (done < 4) return <Navigate to={FLOW[done]} replace />;

  const location = { venue: draft.venue, address: draft.address };
  const edit = (path: string) => navigate(path, { state: { returnTo: '/create/preview' } });
  const unlock = () => {
    setProcessing(true);
    // Simulated checkout: no payment provider is configured in this prototype.
    window.setTimeout(() => {
      publish();
      navigate('/create/publish');
    }, 1200);
  };

  return (
    <div className="page ready">
      <section className="ready-top" aria-label="Preview">
        <button type="button" className="ready-back" onClick={() => navigate('/create/music')} aria-label="Back to soundtrack">
          <ArrowLeft size={20} />
        </button>

        <div className="ready-stage">
          <div className="ready-col ready-invite">
            <p className="ready-label">The invite</p>
            <FitScale width={460} className="ready-invite-fit">
              <InvitationCard invite={guest} location={location} />
            </FitScale>
            <div className="ready-edits">
              <button type="button" onClick={() => edit('/create/event-details')}>
                <PenLine size={14} aria-hidden /> Details
              </button>
              <button type="button" onClick={() => edit('/create/choose-game')}>
                <Gamepad2 size={14} aria-hidden /> Game
              </button>
              <button type="button" onClick={() => edit('/create/music')}>
                <Music2 size={14} aria-hidden /> Song
              </button>
            </div>
          </div>

          <div className="ready-col ready-phone">
            <GuestWalkthrough invite={guest} location={location} answer={draft.code.answer} scene={scene} onScene={setScene} playing={playing} onPlaying={setPlaying} />
            {track?.provider === 'spotify' && (
              <a className="ready-sound" href={track.externalUrl} target="_blank" rel="noopener noreferrer">
                <Music2 size={16} aria-hidden />
                <span className="ready-sound-text">
                  <strong>{track.title}</strong> · {track.artist} <em>Open in Spotify</em>
                </span>
              </a>
            )}
            {track?.previewUrl && (
              <button
                type="button"
                className={`ready-sound ${music.playing ? 'is-on' : ''}`}
                onClick={() => {
                  if (blocked || !music.playing) {
                    setSoundOn(true);
                    setPlaying(true);
                    music.play().then((ok) => setBlocked(!ok));
                  } else setSoundOn(false);
                }}
                aria-label={music.playing ? 'Mute soundtrack' : 'Play soundtrack'}
              >
                {music.playing ? <Volume2 size={16} aria-hidden /> : <VolumeX size={16} aria-hidden />}
                <span className="ready-sound-text">
                  {blocked && !music.playing ? 'Tap to play ' : ''}
                  <strong>{track.title}</strong> · {track.artist} <em>{clipLabel(track)}</em>
                </span>
                {music.playing && (
                  <span className="eq" aria-hidden>
                    <i />
                    <i />
                    <i />
                  </span>
                )}
              </button>
            )}
          </div>

          <div className="ready-col ready-steps">
            <p className="ready-label">What {draft.guestName} will experience</p>
            <ol>
              {scenes.map((s, i) => (
                <li key={s.id}>
                  <button type="button" className={i === scene ? 'is-current' : ''} onClick={() => setScene(i)} aria-current={i === scene ? 'step' : undefined}>
                    <span className="ready-step-num">{i + 1}</span>
                    {s.label}
                  </button>
                </li>
              ))}
            </ol>
            <button type="button" className="ready-try" onClick={() => { setPlaying(false); setDemoOpen(true); }}>
              <PlayCircle size={18} aria-hidden /> Play it yourself
            </button>
          </div>
        </div>
      </section>

      <section className="ready-bottom" aria-labelledby="ready-title">
        <motion.p id="ready-title" className="ready-title" initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }}>
          🎟️ {draft.guestName}’s Party Pass is ready
        </motion.p>
        <div className="ready-plans" role="radiogroup" aria-label="Choose a plan">
          {PLANS.map((p) => (
            <SelectCard key={p.id} selected={plan === p.id} onSelect={() => setPlan(p.id)} className="ready-plan" label={`${p.name}, ${p.price}`}>
              <span className="ready-plan-name">{p.name}</span>
              <span className="ready-plan-price">{p.price}</span>
              <span className="ready-plan-was">
                <s>{p.was}</s> · <em>{p.off}</em>
              </span>
              <span className="ready-plan-note">{p.note}</span>
            </SelectCard>
          ))}
        </div>
        <p className="ready-validity">{plan === 'five' ? 'Party Pack is valid for 12 months' : 'One private link, made for ' + draft.guestName}</p>
        <Button size="lg" arrow loading={processing} onClick={unlock} className="ready-unlock">
          {processing ? 'Unlocking…' : 'Unlock your Party Pass'}
        </Button>
        <p className="ready-trust">
          <Lock size={13} aria-hidden /> Prototype checkout, no payment taken · <Zap size={13} aria-hidden /> Instant link · Your secret answer never leaves this device ·{' '}
          <Link to="/legal">Details</Link>
        </p>
        <Watermark />
      </section>

      <GuestDemo open={demoOpen} onClose={() => setDemoOpen(false)} />
    </div>
  );
}
