import { CalendarDays, Clock, Lock, MapPin, Shirt } from 'lucide-react';
import type { ReactNode } from 'react';
import { formatDate, formatTimeRange } from '../lib/invitation';
import type { GuestInvite } from '../lib/types';
import { DiscoBall } from './decor/DiscoBall';
import { Burst, Cocktail, Heart, Star } from './decor/Ornaments';
import { WATERMARK } from './Watermark';

interface Props {
  invite: GuestInvite;
  /** Location to show (unsealed, or the host's own view). */
  location?: { venue?: string; address?: string } | null;
  /** Slot under the details, used for the soundtrack player. */
  children?: ReactNode;
  className?: string;
  size?: 'full' | 'thumb';
}

const VIBE_ORNAMENT = {
  'chaotic-fun': <DiscoBall size={86} seed={21} className="pass-ornament" />,
  cozy: <Heart size={64} className="pass-ornament" />,
  'dress-to-impress': <Cocktail size={66} liquid="blue" className="pass-ornament" />,
};

/** The printed "party pass": editorial typography, paper grain and a perforated admit-one stub. */
export function InvitationCard({ invite, location, children, className, size = 'full' }: Props) {
  const venue = location?.venue ?? invite.venue;
  const address = location?.address ?? invite.address;
  const hidden = invite.privateLocation && !venue;
  const serial = invite.id.slice(0, 6).toUpperCase();

  return (
    <article className={`pass pass-${invite.vibe} pass-${size} ${className ?? ''}`} aria-label={`Invitation for ${invite.guestName || 'your guest'}`}>
      <div className="pass-main">
        <span className="pass-watermark" aria-hidden="true">
          {WATERMARK}
        </span>
        <div className="pass-top">
          <span>KoiKoi · The Party Pass</span>
          <span>No. {serial}</span>
        </div>
        {VIBE_ORNAMENT[invite.vibe]}
        <Star size={22} tone="gold" className="pass-star pass-star-a" />
        <Burst size={28} color="#2346C6" className="pass-star pass-star-b" />

        <p className="pass-kicker">{invite.guestName || 'Your guest'}, you’re invited to</p>
        <h2 className="pass-title">{invite.partyLabel}</h2>
        <p className="pass-host">
          hosted by <strong>{invite.hostName || 'you'}</strong>
        </p>

        <dl className="pass-details">
          <div>
            <dt>
              <CalendarDays size={16} aria-hidden /> Date
            </dt>
            <dd>{invite.date ? formatDate(invite.date) : 'Date to be announced'}</dd>
          </div>
          <div>
            <dt>
              <Clock size={16} aria-hidden /> Time
            </dt>
            <dd>{invite.startTime ? formatTimeRange(invite.startTime, invite.endTime) : 'Time to be announced'}</dd>
          </div>
          <div className="pass-where">
            <dt>
              {hidden ? <Lock size={16} aria-hidden /> : <MapPin size={16} aria-hidden />} Where
            </dt>
            <dd>
              {hidden ? (
                <span className="pass-secret">The location is a surprise</span>
              ) : (
                <>
                  <strong>{venue || 'Venue to be announced'}</strong>
                  {address && <span className="pass-address">{address}</span>}
                </>
              )}
            </dd>
          </div>
          {invite.dressCode && (
            <div>
              <dt>
                <Shirt size={16} aria-hidden /> Dress code
              </dt>
              <dd>{invite.dressCode}</dd>
            </div>
          )}
        </dl>

        {invite.message && (
          <blockquote className="pass-message">
            <p>“{invite.message}”</p>
            <cite>Love, {invite.hostName}</cite>
          </blockquote>
        )}
        {children}
      </div>

      <aside className="pass-stub" aria-hidden="true">
        <span className="stub-admit">Admit one</span>
        <span className="stub-name">{invite.guestName || 'Guest'}</span>
        <span className="stub-date">{invite.date ? formatDate(invite.date, 'short') : 'Date TBA'}</span>
        <span className="stub-barcode" />
        <span className="stub-serial">{serial}</span>
      </aside>
    </article>
  );
}
