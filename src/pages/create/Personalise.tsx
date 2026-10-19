import { AnimatePresence, motion } from 'framer-motion';
import { Shuffle, User } from 'lucide-react';
import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { DiscoBall } from '../../components/decor/DiscoBall';
import { Cocktail, Heart, Star } from '../../components/decor/Ornaments';
import { Button, Eyebrow, FieldError, PillGroup, SelectCard, TextField } from '../../components/ui';
import { PARTY_TYPES, VIBES } from '../../lib/constants';
import { hasErrors, validatePersonalise } from '../../lib/invitation';
import { useDraft } from '../../lib/store';
import type { PartyType, Vibe } from '../../lib/types';
import { useStepNav } from './CreateLayout';

const VIBE_ART: Record<Vibe | 'surprise', React.ReactNode> = {
  'chaotic-fun': <DiscoBall size={64} seed={8} tint="pink" />,
  cozy: <Heart size={58} />,
  'dress-to-impress': <Cocktail size={56} liquid="blue" />,
  surprise: <Star size={64} tone="gold" />,
};

export function focusFirstError() {
  window.setTimeout(() => {
    document.querySelector<HTMLElement>('.has-error input, .has-error textarea, .has-error button, .has-error [role="radio"]')?.focus();
  }, 30);
}

export default function Personalise() {
  const { draft, update } = useDraft();
  const { next, returnTo } = useStepNav();
  const [params] = useSearchParams();
  const [submitted, setSubmitted] = useState(false);
  const errors = validatePersonalise(draft);
  const shown = submitted ? errors : {};
  const valid = !hasErrors(errors);

  useEffect(() => {
    const type = params.get('type') as PartyType | null;
    if (type && PARTY_TYPES.some((p) => p.value === type)) update({ partyType: type });
    // Runs once, for the occasion shortcut from the landing page.
  }, []);

  const surprise = () => {
    const options = VIBES.filter((v) => v.value !== draft.vibe);
    const pick = options[Math.floor(Math.random() * options.length)];
    update({ vibe: pick.value, surprised: true });
  };

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitted(true);
    if (valid) next();
    else focusFirstError();
  };

  const picked = VIBES.find((v) => v.value === draft.vibe);

  return (
    <form onSubmit={submit} noValidate className="step-form">
      <Eyebrow className="is-kept">Step 1 of 4</Eyebrow>
      <h1 className="step-title">
        Who’s getting the <span className="accent">party pass?</span>
      </h1>
      <p className="step-lede">Let’s make this invite feel personal.</p>

      <PillGroup label="Party type" options={PARTY_TYPES} value={draft.partyType} onChange={(v) => update({ partyType: v })} error={shown.partyType} />
      <AnimatePresence initial={false}>
        {draft.partyType === 'other' && (
          <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} transition={{ duration: 0.25 }} className="reveal-wrap">
            <TextField label="What are you celebrating?" placeholder="e.g. Graduation, farewell, game night" value={draft.partyTypeOther} maxLength={40} onChange={(e) => update({ partyTypeOther: e.target.value })} error={shown.partyTypeOther} autoFocus />
          </motion.div>
        )}
      </AnimatePresence>

      <div className="field-row">
        <TextField label="Guest’s name" placeholder="Enter guest’s name" icon={<User size={20} />} value={draft.guestName} maxLength={40} autoComplete="off" onChange={(e) => update({ guestName: e.target.value })} error={shown.guestName} />
        <TextField label="Your name" placeholder="Enter your name" icon={<User size={20} />} value={draft.hostName} maxLength={40} autoComplete="given-name" onChange={(e) => update({ hostName: e.target.value })} error={shown.hostName} />
      </div>

      <fieldset className={`field ${shown.vibe ? 'has-error' : ''}`}>
        <legend className="label">The vibe</legend>
        <div className="vibe-grid" role="radiogroup" aria-label="The vibe">
          {VIBES.map((v) => (
            <SelectCard key={v.value} selected={draft.vibe === v.value && !draft.surprised} onSelect={() => update({ vibe: v.value, surprised: false })} className="vibe-card" label={v.label}>
              <span className="vibe-art">{VIBE_ART[v.value]}</span>
              <span className="vibe-label">{v.label}</span>
            </SelectCard>
          ))}
          <SelectCard selected={draft.surprised} onSelect={surprise} className="vibe-card" label={draft.surprised && picked ? `Surprise Me, picked ${picked.label}. Select again to reshuffle.` : 'Surprise Me'}>
            <span className="vibe-art">{VIBE_ART.surprise}</span>
            <span className="vibe-label">Surprise Me</span>
            {draft.surprised && picked && (
              <span className="vibe-sub">
                <Shuffle size={12} aria-hidden /> {picked.label}
              </span>
            )}
          </SelectCard>
        </div>
        <FieldError id="vibe-err" message={shown.vibe} />
        <AnimatePresence>
          {draft.surprised && picked && (
            <motion.p key={picked.value} className="vibe-result" initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} role="status">
              Surprise! Your vibe is <strong>{picked.label}</strong>: {picked.blurb.toLowerCase()} Tap again to reshuffle.
            </motion.p>
          )}
        </AnimatePresence>
      </fieldset>

      <div className="step-footer">
        <span />
        <Button type="submit" size="lg" arrow softDisabled={!valid} className="step-continue">
          {returnTo ? 'Save & back to preview' : 'Continue'}
        </Button>
      </div>
    </form>
  );
}
