import { motion, useAnimationControls } from 'framer-motion';
import { KeyRound, Lightbulb, Lock } from 'lucide-react';
import { useState } from 'react';
import { checkAnswer, unseal } from '../../lib/invitation';
import type { GuestInvite } from '../../lib/types';
import { Button } from '../ui';

interface Props {
  invite: GuestInvite;
  onSolved: (location: { venue?: string; address?: string }) => void;
}

/**
 * Prototype note: the answer is checked against a salted SHA-256 verifier carried in the link,
 * and a private location is encrypted with a key derived from the answer. The plaintext answer
 * is never in the guest payload, but a production build should verify on a server to stop guessing.
 */
export function CrackTheCode({ invite, onSolved }: Props) {
  const [attempt, setAttempt] = useState('');
  const [tries, setTries] = useState(0);
  const [feedback, setFeedback] = useState('');
  const controls = useAnimationControls();
  const clue = invite.game.clue || 'What’s the secret word?';

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!attempt.trim()) {
      setFeedback('Type your answer first.');
      return;
    }
    if (checkAnswer(invite, attempt)) {
      const location = invite.sealed ? unseal(invite, attempt) : null;
      onSolved(location ?? {});
      return;
    }
    const n = tries + 1;
    setTries(n);
    controls.start({ x: [0, -10, 10, -7, 7, -3, 0], transition: { duration: 0.42 } });
    if (invite.game.hint) setFeedback(n === 1 ? `Not quite! Here’s a hint: ${invite.game.hint}` : `Still not it. Hint: ${invite.game.hint}`);
    else setFeedback(n < 3 ? 'Not quite. Give it another go.' : 'So close (maybe). Think of something only you two would know.');
  };

  return (
    <div className="game game-code">
      <div className="code-lock" aria-hidden>
        <Lock size={30} />
      </div>
      <div className="clue-card">
        <p className="eyebrow">The clue</p>
        <p className="clue-text">{clue}</p>
        <div className="clue-tiles" aria-hidden>
          {['?', '?', '?', '?'].map((q, i) => (
            <span key={i}>{q}</span>
          ))}
        </div>
      </div>
      <motion.form animate={controls} onSubmit={submit} className="code-form" noValidate>
        <label htmlFor="code-answer" className="label">
          Your answer
        </label>
        <div className="input-wrap has-icon">
          <span className="input-icon">
            <KeyRound size={18} />
          </span>
          <input
            id="code-answer"
            className="input"
            autoComplete="off"
            autoCapitalize="off"
            spellCheck={false}
            placeholder="Type your answer"
            value={attempt}
            onChange={(e) => {
              setAttempt(e.target.value);
              if (feedback) setFeedback('');
            }}
            aria-invalid={!!feedback || undefined}
            aria-describedby="code-feedback"
          />
        </div>
        <p id="code-feedback" className={`code-feedback ${feedback ? 'is-visible' : ''}`} role="status">
          {feedback && <Lightbulb size={16} aria-hidden />}
          {feedback}
        </p>
        <Button type="submit" size="lg" block arrow>
          Unlock the Invite
        </Button>
        <p className="game-small">Capital letters and a leading “the” don’t matter.</p>
      </motion.form>
    </div>
  );
}
