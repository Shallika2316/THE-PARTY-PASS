import { AnimatePresence, motion } from 'framer-motion';
import { ArrowLeft, Eye, EyeOff, Gamepad2, KeyRound, Lightbulb, MessageSquareQuote, Play, Shuffle, Wand2 } from 'lucide-react';
import { useState } from 'react';
import { FindTheVibe } from '../../components/games/FindTheVibe';
import { PuzzleArtwork, PuzzleGame } from '../../components/games/PuzzleGame';
import { GameVisual } from '../../components/GameVisual';
import { Modal } from '../../components/Modal';
import { Button, Eyebrow, FieldError, PillGroup, SelectCard, TextField } from '../../components/ui';
import { GAMES, partyTitle, PUZZLE_ARTS, WORD_THEMES } from '../../lib/constants';
import { customWordList, hasErrors, randomSeed, validateGame, wordsFor } from '../../lib/invitation';
import { useDraft } from '../../lib/store';
import type { GameType, Invitation, WordTheme } from '../../lib/types';
import { useStepNav } from './CreateLayout';
import { focusFirstError } from './Personalise';

export default function ChooseGame() {
  const { draft, update } = useDraft();
  const { next, back, returnTo } = useStepNav();
  const [submitted, setSubmitted] = useState(false);
  const errors = validateGame(draft);
  const shown = submitted ? errors : {};
  const valid = !hasErrors(errors);

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitted(true);
    if (valid) next();
    else focusFirstError();
  };

  return (
    <form onSubmit={submit} noValidate className="step-form">
      <Eyebrow>Step 3 of 3</Eyebrow>
      <h1 className="step-title">
        Make them <span className="accent">play for it.</span>
      </h1>
      <p className="step-lede">Choose how your guest unlocks the invitation.</p>

      <div className="game-layout">
        <fieldset className={`field ${shown.game ? 'has-error' : ''}`}>
          <legend className="label">The game</legend>
          <div className="game-grid" role="radiogroup" aria-label="Mini-game">
            {GAMES.map((g) => (
              <SelectCard
                key={g.value}
                selected={draft.game === g.value}
                onSelect={() => update({ game: g.value as GameType })}
                className="game-card"
                label={`${g.label}${g.value === 'crack-the-code' ? ' (recommended)' : ''}`}
              >
                <GameVisual type={g.value} />
                <span className="game-card-text">
                  {g.value === 'crack-the-code' && <span className="badge badge-card">Recommended</span>}
                  <span className="game-card-title">{g.label}</span>
                  <span className="game-card-desc">{g.description}</span>
                </span>
              </SelectCard>
            ))}
          </div>
          <FieldError id="game-err" message={shown.game} />
        </fieldset>

        <AnimatePresence mode="wait" initial={false}>
          <motion.section key={draft.game || 'none'} className="config-panel" initial={{ opacity: 0, x: 12 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -8 }} transition={{ duration: 0.22 }} aria-label="Game settings">
            {!draft.game && (
              <div className="config-empty">
                <Gamepad2 size={32} aria-hidden />
                <p>Pick a game to set it up.</p>
              </div>
            )}
            {draft.game === 'crack-the-code' && <CodeConfig draft={draft} update={update} errors={shown} />}
            {draft.game === 'find-the-vibe' && <WordsConfig draft={draft} update={update} errors={shown} />}
            {draft.game === 'piece-together' && <PuzzleConfigPanel draft={draft} update={update} />}
          </motion.section>
        </AnimatePresence>
      </div>

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

type PanelProps = { draft: Invitation; update: (p: Partial<Invitation>) => void; errors?: Record<string, string | undefined> };

function CodeConfig({ draft, update, errors = {} }: PanelProps) {
  const [showAnswer, setShowAnswer] = useState(false);
  const setCode = (patch: Partial<Invitation['code']>) => update({ code: { ...draft.code, ...patch } });
  return (
    <div className="config">
      <div className="config-head">
        <h2 className="config-title">Set the secret</h2>
        <button type="button" className="btn btn-quiet btn-sm" onClick={() => setCode({ clue: 'The place where we first met.', answer: 'The library', hint: 'Quiet please. Lots of books there.' })}>
          <Wand2 size={16} aria-hidden />
          <span>Use the example</span>
        </button>
      </div>
      <TextField label="Your clue" placeholder="e.g. The place where we first met." icon={<MessageSquareQuote size={20} />} value={draft.code.clue} maxLength={120} onChange={(e) => setCode({ clue: e.target.value })} error={errors.clue} />
      <div className="field-row">
        <div className="field-with-action">
          <TextField
            label="Secret answer"
            type={showAnswer ? 'text' : 'password'}
            placeholder="e.g. The library"
            icon={<KeyRound size={20} />}
            value={draft.code.answer}
            maxLength={60}
            autoComplete="off"
            onChange={(e) => setCode({ answer: e.target.value })}
            error={errors.answer}
            hint="Never shown to your guest. Capitals and a leading “the” don’t matter."
          />
          <button type="button" className="icon-btn field-action" onClick={() => setShowAnswer((s) => !s)} aria-label={showAnswer ? 'Hide answer' : 'Show answer'}>
            {showAnswer ? <EyeOff size={18} /> : <Eye size={18} />}
          </button>
        </div>
        <TextField label="Hint" optional placeholder="Shown after a wrong guess" icon={<Lightbulb size={20} />} value={draft.code.hint} maxLength={100} onChange={(e) => setCode({ hint: e.target.value })} />
      </div>
    </div>
  );
}

function WordsConfig({ draft, update, errors = {} }: PanelProps) {
  const [reveal, setReveal] = useState(true);
  const setWords = (patch: Partial<Invitation['words']>) => update({ words: { ...draft.words, ...patch } });
  const words = wordsFor(draft);
  const customOk = draft.words.theme !== 'custom' || !hasErrors(validateGame({ ...draft, game: 'find-the-vibe' }));
  const themeOptions = [...WORD_THEMES.map((t) => ({ value: t.value, label: t.label })), { value: 'custom' as WordTheme, label: 'Your own words' }];
  return (
    <div className="config config-words">
      <h2 className="config-title">Pick the hidden words</h2>
      <PillGroup label="Word theme" options={themeOptions} value={draft.words.theme} onChange={(v) => setWords({ theme: v })} />
      {draft.words.theme === 'custom' && (
        <TextField
          label="Your words"
          placeholder="e.g. RIYA, CAKE, GOA, DANCE"
          value={draft.words.customWords}
          maxLength={60}
          onChange={(e) => setWords({ customWords: e.target.value })}
          error={errors.customWords}
          hint={`3–6 words, 3–8 letters each, separated by commas. ${customWordList(draft.words.customWords).length} so far.`}
        />
      )}
      {customOk && words.length > 0 ? (
        <>
          <div className="config-actions">
            <button type="button" className="btn btn-quiet btn-sm" onClick={() => setReveal((r) => !r)} aria-pressed={reveal}>
              {reveal ? <EyeOff size={16} aria-hidden /> : <Eye size={16} aria-hidden />}
              <span>{reveal ? 'Hide answers' : 'Show answers'}</span>
            </button>
            <button type="button" className="btn btn-quiet btn-sm" onClick={() => setWords({ seed: randomSeed() })}>
              <Shuffle size={16} aria-hidden />
              <span>Shuffle grid</span>
            </button>
          </div>
          <div className="grid-preview" aria-label="Grid preview">
            <FindTheVibe words={words} seed={draft.words.seed} showAnswers={reveal} interactive={false} />
          </div>
        </>
      ) : (
        <p className="field-hint">Add your words to see the grid.</p>
      )}
    </div>
  );
}

function PuzzleConfigPanel({ draft, update }: PanelProps) {
  const [trying, setTrying] = useState(false);
  const setPuzzle = (patch: Partial<Invitation['puzzle']>) => update({ puzzle: { ...draft.puzzle, ...patch } });
  const label = partyTitle(draft.partyType, draft.partyTypeOther);
  return (
    <div className="config">
      <h2 className="config-title">Choose the picture</h2>
      <div className="art-grid" role="radiogroup" aria-label="Puzzle artwork">
        {PUZZLE_ARTS.map((a) => (
          <SelectCard key={a.value} selected={draft.puzzle.art === a.value} onSelect={() => setPuzzle({ art: a.value })} className="art-card" label={a.label}>
            <span className="art-thumb">
              <PuzzleArtwork art={a.value} guestName={draft.guestName} partyLabel={label} />
            </span>
            <span className="art-label">{a.label}</span>
          </SelectCard>
        ))}
      </div>
      <PillGroup
        label="Difficulty"
        options={[
          { value: 'easy', label: 'Easy · 3×3' },
          { value: 'standard', label: 'Standard · 4×4' },
        ]}
        value={draft.puzzle.difficulty}
        onChange={(v) => setPuzzle({ difficulty: v as 'easy' | 'standard' })}
      />
      <Button type="button" variant="secondary" size="sm" icon={<Play size={15} aria-hidden />} onClick={() => setTrying(true)}>
        Try the puzzle yourself
      </Button>
      <Modal open={trying} onClose={() => setTrying(false)} title="Try the puzzle" size="md">
        <PuzzleGame key={`${draft.puzzle.art}-${draft.puzzle.difficulty}`} art={draft.puzzle.art} difficulty={draft.puzzle.difficulty} seed={draft.puzzle.seed} guestName={draft.guestName} partyLabel={label} onSolved={() => setTrying(false)} />
      </Modal>
    </div>
  );
}
