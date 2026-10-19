import { useMemo, useState } from 'react';
import { GuestExperience, type GuestStage, type Location } from '../../components/GuestExperience';
import { Modal } from '../../components/Modal';
import { toGuestInvite } from '../../lib/invitation';
import { useDraft } from '../../lib/store';
import type { RsvpResponse } from '../../lib/types';

/** Interactive, nothing-saved play-through of the host's current invite. */
export function GuestDemo({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { draft } = useDraft();
  const invite = useMemo(() => toGuestInvite(draft), [draft]);
  const [stage, setStage] = useState<GuestStage>('welcome');
  const [unlocked, setUnlocked] = useState<Location | null>(null);
  const [rsvp, setRsvp] = useState<RsvpResponse | null>(null);
  const close = () => {
    onClose();
    setStage('welcome');
    setUnlocked(null);
    setRsvp(null);
  };
  return (
    <Modal open={open} onClose={close} title="Guest experience preview" size="lg" className="preview-modal">
      <p className="preview-intro">Play it exactly as {draft.guestName} will. Nothing here is saved or sent.</p>
      <div className="phone-frame">
        <div className="phone-screen">
          <GuestExperience invite={invite} stage={stage} go={setStage} unlocked={unlocked} onUnlock={setUnlocked} rsvp={rsvp} onRsvp={setRsvp} demo />
        </div>
      </div>
    </Modal>
  );
}
