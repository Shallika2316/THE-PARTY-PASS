import { AnimatePresence, motion } from 'framer-motion';
import { ArrowLeft, Check, Link2, Music2, RefreshCw, Search, Trash2, VolumeX } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { ClipPicker } from '../../components/ClipPicker';
import { Artwork, PlayButton, TrackCard } from '../../components/TrackCard';
import { Button, Eyebrow, FieldError, SelectCard, TextField } from '../../components/ui';
import { useAudio } from '../../lib/audio';
import { formatDuration, hasErrors, validateMusic } from '../../lib/invitation';
import { searchSongs, SUGGESTED_SEARCHES } from '../../lib/music';
import { parseSpotifyLink, spotifyTrackInfo } from '../../lib/spotify';
import { useDraft } from '../../lib/store';
import type { Track } from '../../lib/types';
import { useStepNav } from './CreateLayout';
import { focusFirstError } from './Personalise';

type Status = 'idle' | 'loading' | 'done' | 'error';

export default function Music() {
  const { draft, update } = useDraft();
  const { next, back, returnTo } = useStepNav();
  const { stop } = useAudio();
  const [submitted, setSubmitted] = useState(false);
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<Track[]>([]);
  const [status, setStatus] = useState<Status>('idle');
  const [retry, setRetry] = useState(0);
  const [linkOpen, setLinkOpen] = useState(false);
  const searchRef = useRef<HTMLInputElement>(null);
  const errors = validateMusic(draft);
  const shown = submitted ? errors : {};
  const valid = !hasErrors(errors);
  const track = draft.track;

  useEffect(() => {
    const term = query.trim();
    if (term.length < 2) {
      setStatus('idle');
      setResults([]);
      return;
    }
    const ctrl = new AbortController();
    setStatus('loading');
    const t = window.setTimeout(() => {
      searchSongs(term, ctrl.signal)
        .then((r) => {
          setResults(r);
          setStatus('done');
        })
        .catch((e) => {
          if (e.name !== 'AbortError') setStatus('error');
        });
    }, 350);
    return () => {
      window.clearTimeout(t);
      ctrl.abort();
    };
  }, [query, retry]);

  const choose = (t: Track) => update({ soundtrack: 'track', track: { ...t, clipStart: 0 } });

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitted(true);
    if (valid) {
      stop();
      next();
    } else focusFirstError();
  };

  return (
    <form onSubmit={submit} noValidate className="step-form step-music">
      <Eyebrow>Optional extra</Eyebrow>
      <h1 className="step-title">
        Give this invite a <span className="accent">soundtrack.</span>
      </h1>
      <p className="step-lede">Choose the song, then pick the 15 seconds that set the mood.</p>

      <fieldset className={`field ${shown.soundtrack ? 'has-error' : ''}`}>
        <legend className="sr-only">Soundtrack</legend>
        <div className="choice-row" role="radiogroup" aria-label="Soundtrack">
          <SelectCard selected={draft.soundtrack === 'track'} onSelect={() => update({ soundtrack: 'track' })} className="choice-card" label="Add a song">
            <Music2 size={24} aria-hidden />
            <span className="choice-title">Add a song</span>
            <span className="choice-desc">Guests can play it on their invite.</span>
          </SelectCard>
          <SelectCard
            selected={draft.soundtrack === 'none'}
            onSelect={() => {
              stop();
              update({ soundtrack: 'none' });
            }}
            className="choice-card"
            label="No soundtrack"
          >
            <VolumeX size={24} aria-hidden />
            <span className="choice-title">No soundtrack</span>
            <span className="choice-desc">Keep it quiet. You can add one later.</span>
          </SelectCard>
        </div>
        <FieldError id="soundtrack-err" message={shown.soundtrack} />
      </fieldset>

      <AnimatePresence initial={false}>
        {draft.soundtrack === 'track' && (
          <motion.div className="music-picker" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} transition={{ duration: 0.25 }}>
            <div className="music-search">
              <div className={`field ${shown.track && !track ? 'has-error' : ''}`}>
                <label className="label" htmlFor="song-search">
                  Search for a song
                </label>
                <div className="input-wrap has-icon">
                  <span className="input-icon">
                    <Search size={20} />
                  </span>
                  <input ref={searchRef} id="song-search" type="search" className="input" placeholder="Song or artist" value={query} onChange={(e) => setQuery(e.target.value)} autoComplete="off" />
                </div>
                <FieldError id="track-err" message={!track ? shown.track : undefined} />
              </div>

              {status === 'idle' && !linkOpen && (
                <div className="suggestions">
                  <span>Try:</span>
                  {SUGGESTED_SEARCHES.map((s) => (
                    <button key={s} type="button" className="chip" onClick={() => setQuery(s)}>
                      {s}
                    </button>
                  ))}
                </div>
              )}

              <div className="sr-only" aria-live="polite">
                {status === 'loading' ? 'Searching…' : status === 'done' ? `${results.length} songs found` : status === 'error' ? 'Search failed' : ''}
              </div>

              {status === 'loading' && (
                <ul className="results" aria-hidden>
                  {[0, 1, 2].map((i) => (
                    <li key={i} className="result is-skeleton">
                      <span className="sk sk-art" />
                      <span className="sk sk-line" />
                    </li>
                  ))}
                </ul>
              )}

              {status === 'error' && (
                <div className="music-error" role="alert">
                  <p>We couldn’t reach Apple Music search. Check your connection and try again.</p>
                  <button type="button" className="btn btn-secondary btn-sm" onClick={() => setRetry((r) => r + 1)}>
                    <RefreshCw size={15} aria-hidden />
                    <span>Try again</span>
                  </button>
                </div>
              )}

              {status === 'done' && results.length === 0 && <p className="field-hint">No songs found for “{query}”. Try the artist’s name.</p>}

              {status === 'done' && results.length > 0 && !linkOpen && (
                <motion.ul className="results" initial="hidden" animate="show" variants={{ show: { transition: { staggerChildren: 0.03 } } }}>
                  {results.map((t) => {
                    const selected = track?.id === t.id;
                    return (
                      <motion.li key={t.id} className={`result ${selected ? 'is-selected' : ''}`} variants={{ hidden: { opacity: 0, y: 6 }, show: { opacity: 1, y: 0 } }}>
                        <Artwork track={t} size={48} />
                        <div className="result-meta">
                          <span className="result-title">{t.title}</span>
                          <span className="result-artist">
                            {t.artist}
                            {t.album ? ` · ${t.album}` : ''}
                          </span>
                        </div>
                        <span className="result-duration">{formatDuration(t.durationMs)}</span>
                        <PlayButton track={t} size="sm" />
                        <button type="button" className={`btn btn-sm ${selected ? 'btn-primary' : 'btn-secondary'} result-select`} onClick={() => choose(t)} aria-pressed={selected} aria-label={selected ? `${t.title} selected` : `Select ${t.title} by ${t.artist}`}>
                          {selected ? <Check size={15} aria-hidden /> : null}
                          <span>{selected ? 'Selected' : 'Select'}</span>
                        </button>
                      </motion.li>
                    );
                  })}
                </motion.ul>
              )}

              <LinkInput open={linkOpen} setOpen={setLinkOpen} onUse={(t) => update({ soundtrack: 'track', track: t })} />
            </div>

            <div className="music-side">
              {track ? (
                <TrackCard
                  track={track}
                  heading="Selected soundtrack"
                  actions={
                    <div className="track-actions">
                      <button type="button" className="btn btn-quiet btn-sm" onClick={() => searchRef.current?.focus()}>
                        <RefreshCw size={15} aria-hidden />
                        <span>Replace</span>
                      </button>
                      <button
                        type="button"
                        className="btn btn-quiet btn-sm"
                        onClick={() => {
                          stop();
                          update({ track: null });
                        }}
                      >
                        <Trash2 size={15} aria-hidden />
                        <span>Remove</span>
                      </button>
                    </div>
                  }
                >
                  {track.previewUrl && <ClipPicker track={track} onChange={(clipStart) => update({ track: { ...track, clipStart } })} />}
                </TrackCard>
              ) : (
                <div className="music-empty">
                  <Music2 size={28} aria-hidden />
                  <p>Search for a song and press Select. It will show up here and on {draft.guestName ? `${draft.guestName}’s` : 'the'} invite.</p>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="step-footer">
        <Button type="button" variant="ghost" size="lg" icon={<ArrowLeft size={18} aria-hidden />} onClick={back}>
          {returnTo ? 'Back to preview' : 'Back'}
        </Button>
        <Button type="submit" size="lg" arrow softDisabled={!valid} className="step-continue">
          {returnTo ? 'Save & back to preview' : 'Preview invite'}
        </Button>
      </div>
    </form>
  );
}

/** First-version option: use a Spotify song by pasting its link. */
function LinkInput({ open, setOpen, onUse }: { open: boolean; setOpen: (v: boolean) => void; onUse: (t: Track) => void }) {
  const [url, setUrl] = useState('');
  const [title, setTitle] = useState('');
  const [artist, setArtist] = useState('');
  const [artwork, setArtwork] = useState<string | undefined>();
  const [error, setError] = useState('');

  // Fill in the title and artwork as soon as a valid Spotify link is pasted.
  const lookUp = async (value: string) => {
    const parsed = parseSpotifyLink(value);
    if (!parsed) return;
    try {
      const info = await spotifyTrackInfo(parsed.url);
      if (info.title) setTitle((t) => t || info.title);
      setArtwork(info.artwork);
    } catch {
      /* the host can still type the title */
    }
  };

  const use = () => {
    const parsed = parseSpotifyLink(url);
    if (!parsed) return setError('Paste a Spotify song link, like https://open.spotify.com/track/…');
    if (!title.trim() || !artist.trim()) return setError('Add the song title and artist so your guest knows what it is.');
    setError('');
    onUse({ provider: 'spotify', id: parsed.id, externalUrl: parsed.url, title: title.trim(), artist: artist.trim(), artwork });
    setUrl('');
    setTitle('');
    setArtist('');
    setArtwork(undefined);
    setOpen(false);
  };

  return (
    <div className="link-input">
      <button type="button" className="btn btn-quiet btn-sm" onClick={() => setOpen(!open)} aria-expanded={open}>
        <Link2 size={15} aria-hidden />
        <span>{open ? 'Hide Spotify option' : 'Have a Spotify link instead?'}</span>
      </button>
      <AnimatePresence initial={false}>
        {open && (
          <motion.div className="link-fields" initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }}>
            <TextField
              label="Spotify song link"
              placeholder="https://open.spotify.com/track/…"
              value={url}
              inputMode="url"
              onChange={(e) => {
                setUrl(e.target.value);
                setError('');
                lookUp(e.target.value);
              }}
            />
            <div className="field-row">
              <TextField label="Song title" value={title} maxLength={80} onChange={(e) => setTitle(e.target.value)} />
              <TextField label="Artist" value={artist} maxLength={80} onChange={(e) => setArtist(e.target.value)} />
            </div>
            <FieldError id="link-err" message={error} />
            <Button type="button" variant="secondary" size="sm" onClick={use}>
              Use this song
            </Button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
