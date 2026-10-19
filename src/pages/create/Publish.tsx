import { motion } from 'framer-motion';
import { Copy, ExternalLink, MessageCircle, Plus, Share2, UserPlus } from 'lucide-react';
import { useMemo } from 'react';
import { Navigate, useNavigate } from 'react-router-dom';
import { ConfettiBurst } from '../../components/Confetti';
import { InvitationCard } from '../../components/InvitationCard';
import { useToast } from '../../components/Toast';
import { FitScale } from '../../components/FitScale';
import { Button, Eyebrow, PrototypeNote } from '../../components/ui';
import { guestUrl, toGuestInvite } from '../../lib/invitation';
import { canNativeShare, copyText, whatsappLink } from '../../lib/share';
import { useDraft } from '../../lib/store';

export default function Publish() {
  const { draft, forAnotherGuest, reset } = useDraft();
  const navigate = useNavigate();
  const toast = useToast();
  const guest = useMemo(() => toGuestInvite(draft), [draft]);
  const url = useMemo(() => guestUrl(guest), [guest]);

  const shareText = `${draft.guestName}, you’ve got a Party Pass from ${draft.hostName} 🎟️ Play to unlock your invite:`;

  if (draft.status !== 'published') return <Navigate to="/create/preview" replace />;

  const copy = async () => {
    const ok = await copyText(url);
    toast(ok ? 'Link copied. Paste it anywhere.' : 'Couldn’t copy automatically. Select the link and copy it.', ok ? 'success' : 'info');
  };

  const share = async () => {
    try {
      await navigator.share({ title: 'You’ve got a Party Pass', text: shareText, url });
    } catch {
      /* the user closed the share sheet */
    }
  };

  return (
    <div className="step-form publish-step is-done">
      <ConfettiBurst count={60} className="publish-confetti" />
      <Eyebrow>All done</Eyebrow>
      <motion.h1 className="step-title" initial={{ scale: 0.96, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ duration: 0.5 }}>
        Your Party Pass is <span className="accent">ready!</span>
      </motion.h1>
      <p className="step-lede">Send this private link to {draft.guestName}. They’ll play {draft.game === 'crack-the-code' ? 'Crack the Code' : 'the game'} to unlock the details.</p>

      <div className="publish-grid">
        <FitScale width={440} className="thumb-wrap">
          <InvitationCard invite={guest} location={{ venue: draft.venue, address: draft.address }} />
        </FitScale>
        <div className="share">
          <label className="label" htmlFor="invite-link">
            Private invitation link
          </label>
          <div className="link-box">
            <input id="invite-link" className="input" readOnly value={url} onFocus={(e) => e.currentTarget.select()} />
            <Button onClick={copy} icon={<Copy size={18} aria-hidden />}>
              Copy Link
            </Button>
          </div>
          <div className="share-buttons">
            {canNativeShare() && (
              <Button variant="secondary" icon={<Share2 size={18} aria-hidden />} onClick={share}>
                Share
              </Button>
            )}
            <a className="btn btn-secondary btn-md" href={whatsappLink(`${shareText} ${url}`)} target="_blank" rel="noopener noreferrer">
              <MessageCircle size={18} aria-hidden />
              <span>WhatsApp</span>
            </a>
            <a className="btn btn-secondary btn-md" href={url} target="_blank" rel="noopener noreferrer">
              <ExternalLink size={18} aria-hidden />
              <span>Open Guest Preview</span>
            </a>
          </div>
          <PrototypeNote>
            The link carries the invitation details itself (never your secret answer), so it opens on any device. RSVPs stay on your guest’s device, and they’ll get a button to message you their answer.
          </PrototypeNote>
          <div className="share-next">
            <Button
              variant="ghost"
              icon={<UserPlus size={18} aria-hidden />}
              onClick={() => {
                forAnotherGuest();
                navigate('/create/personalise');
              }}
            >
              Make one for another guest
            </Button>
            <Button
              variant="ghost"
              icon={<Plus size={18} aria-hidden />}
              onClick={() => {
                reset();
                navigate('/create/personalise');
              }}
            >
              Start a new invite
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
