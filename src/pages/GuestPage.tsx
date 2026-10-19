import { useCallback, useMemo, useState } from 'react';
import { Link, Navigate, useLocation, useNavigate, useParams } from 'react-router-dom';
import { DiscoBall } from '../components/decor/DiscoBall';
import { ConfettiScatter, Star } from '../components/decor/Ornaments';
import { GuestExperience, type GuestStage, type Location } from '../components/GuestExperience';
import { Logo } from '../components/Header';
import { decodeInvite, toGuestInvite } from '../lib/invitation';
import { cachedGuestInvite, cacheGuestInvite, markUnlocked, readJSON, saveRsvp, savedRsvp, unlockedState } from '../lib/store';
import type { GuestInvite, Invitation, RsvpResponse } from '../lib/types';

/** Loads the invitation for this URL: from the link's own data, or from this browser's published invites. */
function useGuestInvite(id: string): GuestInvite | null {
  const { search } = useLocation();
  return useMemo(() => {
    const fromUrl = decodeInvite(new URLSearchParams(search).get('d') ?? '');
    if (fromUrl && fromUrl.id === id) {
      cacheGuestInvite(fromUrl);
      return fromUrl;
    }
    const cached = cachedGuestInvite(id);
    if (cached) return cached;
    const local = readJSON<Record<string, Invitation>>('koikoi.partypass.published', {})[id];
    return local ? toGuestInvite(local) : null;
  }, [id, search]);
}

export default function GuestPage({ view }: { view: 'play' | 'reveal' | 'rsvp' }) {
  const { id = '' } = useParams();
  const { search } = useLocation();
  const navigate = useNavigate();
  const invite = useGuestInvite(id);
  const [unlocked, setUnlocked] = useState<Location | null>(() => unlockedState(id));
  const [rsvp, setRsvp] = useState<RsvpResponse | null>(() => savedRsvp(id)?.response ?? null);
  const [playStage, setPlayStage] = useState<GuestStage>('welcome');

  const base = `/invite/${id}`;
  const go = useCallback(
    (stage: GuestStage) => {
      if (stage === 'reveal') navigate(`${base}/reveal${search}`);
      else if (stage === 'rsvp') navigate(`${base}/rsvp${search}`);
      else {
        if (view !== 'play') navigate(`${base}${search}`);
        setPlayStage(stage);
      }
      window.scrollTo({ top: 0 });
    },
    [base, search, navigate, view],
  );

  if (!invite) return <InviteNotFound />;
  // The reveal and RSVP pages only open after the game has been won in this browser session.
  if (view !== 'play' && !unlocked) return <Navigate to={`${base}${search}`} replace />;

  const stage: GuestStage = view === 'reveal' ? 'reveal' : view === 'rsvp' ? 'rsvp' : playStage;

  return (
    <div className={`page guest-page vibe-${invite.vibe}`}>
      <GuestBackdrop />
      <header className="guest-header">
        <Logo />
      </header>
      <main id="main" className="guest-main">
        <GuestExperience
          invite={invite}
          stage={stage}
          go={go}
          unlocked={unlocked}
          onUnlock={(loc) => {
            markUnlocked(invite.id, loc);
            setUnlocked(loc);
          }}
          rsvp={rsvp}
          onRsvp={(r) => {
            if (r) saveRsvp(invite.id, r);
            setRsvp(r);
          }}
        />
      </main>
    </div>
  );
}

function GuestBackdrop() {
  return (
    <div className="guest-backdrop" aria-hidden>
      <DiscoBall size={260} seed={17} className="gb-disco" />
      <Star tone="gold" size={40} className="gb-star1" />
      <Star tone="pink" size={28} className="gb-star2" />
      <ConfettiScatter
        pieces={[
          { x: '6%', y: '40%', c: '#D7A34A', s: 14, shape: 'rect', r: 30 },
          { x: '90%', y: '30%', c: '#D20D4B', s: 12 },
          { x: '86%', y: '78%', c: '#2346C6', s: 14 },
          { x: '10%', y: '86%', c: '#D20D4B', s: 16, shape: 'rect', r: -20 },
        ]}
      />
    </div>
  );
}

function InviteNotFound() {
  return (
    <div className="page guest-page">
      <header className="guest-header">
        <Logo />
      </header>
      <main id="main" className="guest-main">
        <div className="guest-scene not-found">
          <p className="eyebrow">Hmm</p>
          <h1 className="guest-title guest-title-sm">We can’t find this Party Pass.</h1>
          <p className="guest-lede">The link may be incomplete. Try opening it again from the original message, or ask your host to resend it.</p>
          <Link className="btn btn-primary btn-md" to="/">
            <span>Go to The Party Pass</span>
          </Link>
        </div>
      </main>
    </div>
  );
}
