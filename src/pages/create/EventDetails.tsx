import { ArrowLeft, Building2, CalendarDays, Clock, MapPin, Shirt } from 'lucide-react';
import { useState } from 'react';
import { Button, Checkbox, Eyebrow, TextArea, TextField } from '../../components/ui';
import { hasErrors, todayISO, validateDetails } from '../../lib/invitation';
import { useDraft } from '../../lib/store';
import { useStepNav } from './CreateLayout';
import { focusFirstError } from './Personalise';

export default function EventDetails() {
  const { draft, update } = useDraft();
  const { next, back, returnTo } = useStepNav();
  const [submitted, setSubmitted] = useState(false);
  const errors = validateDetails(draft);
  const shown = submitted ? errors : {};
  // Past dates are flagged as soon as they're picked, not only on submit.
  if (!submitted && errors.date && draft.date) shown.date = errors.date;
  const valid = !hasErrors(errors);

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitted(true);
    if (valid) next();
    else focusFirstError();
  };

  return (
    <form onSubmit={submit} noValidate className="step-form">
      <Eyebrow>Step 2 of 3</Eyebrow>
      <h1 className="step-title">
        When does the <span className="accent">fun begin?</span>
      </h1>
      <p className="step-lede">Give them the details they need to show up.</p>
      <div className="field-row field-row-3">
        <TextField label="Event date" type="date" icon={<CalendarDays size={20} />} min={todayISO()} value={draft.date} onChange={(e) => update({ date: e.target.value })} error={shown.date} required />
        <TextField label="Start time" type="time" icon={<Clock size={20} />} value={draft.startTime} onChange={(e) => update({ startTime: e.target.value })} error={shown.startTime} required />
        <TextField
          label="End time"
          optional
          type="time"
          icon={<Clock size={20} />}
          value={draft.endTime}
          onChange={(e) => update({ endTime: e.target.value })}
          hint={draft.endTime && draft.startTime && draft.endTime <= draft.startTime ? 'Ends after midnight (next day).' : undefined}
        />
      </div>

      <div className="field-row">
        <TextField label="Venue name" placeholder="e.g. The Loft, or Vihaan’s place" icon={<Building2 size={20} />} value={draft.venue} maxLength={60} onChange={(e) => update({ venue: e.target.value })} error={shown.venue} required />
        <TextField label="Address or location" placeholder="Street, area, city" icon={<MapPin size={20} />} value={draft.address} maxLength={120} autoComplete="street-address" onChange={(e) => update({ address: e.target.value })} error={shown.address} required />
      </div>

      <div className="field-row field-row-align">
        <TextField label="Dress code" optional placeholder="e.g. Disco glam, all black" icon={<Shirt size={20} />} value={draft.dressCode} maxLength={60} onChange={(e) => update({ dressCode: e.target.value })} />
        <Checkbox checked={draft.privateLocation} onChange={(v) => update({ privateLocation: v })} label="Keep the location private until the invite is unlocked." description="Guests see “The location is a surprise” until they win." />
      </div>

      <TextArea
        label={`A personal message · ${draft.message.length}/280`}
        optional
        placeholder={`Say something only ${draft.guestName || 'they'} would get…`}
        rows={2}
        value={draft.message}
        maxLength={280}
        onChange={(e) => update({ message: e.target.value })}
        error={shown.message}
      />

      <div className="step-footer">
        <Button type="button" variant="ghost" size="lg" icon={<ArrowLeft size={18} aria-hidden />} onClick={back}>
          {returnTo ? 'Back to preview' : 'Back'}
        </Button>
        <Button type="submit" size="lg" arrow softDisabled={!valid} className="step-continue">
          {returnTo ? 'Save & back to preview' : 'Continue'}
        </Button>
      </div>
    </form>
  );
}
