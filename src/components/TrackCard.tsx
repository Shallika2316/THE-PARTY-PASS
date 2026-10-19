import { motion } from 'framer-motion';
import { ExternalLink, Loader2, Music2, Pause, Play } from 'lucide-react';
import { useState, type ReactNode } from 'react';
import { CLIP_SECONDS, clipFor, useAudio } from '../lib/audio';
import { formatDuration } from '../lib/invitation';
import type { Track } from '../lib/types';

export function Artwork({ track, size = 56 }: { track: Track; size?: number }) {
  return track.artwork ? (
    <img className="track-art" src={track.artwork} alt="" width={size} height={size} loading="lazy" />
  ) : (
    <span className="track-art track-art-empty" style={{ width: size, height: size }} aria-hidden>
      <Music2 size={size * 0.4} />
    </span>
  );
}

export const clipLabel = (track: Track) =>
  track.provider === 'spotify' ? 'Spotify' : `${formatDuration((track.clipStart ?? 0) * 1000)}–${formatDuration(((track.clipStart ?? 0) + CLIP_SECONDS) * 1000)}`;

export function PlayButton({ track, size = 'md', label }: { track: Track; size?: 'sm' | 'md'; label?: string }) {
  const { playing, loading, toggle, progress } = useAudio(track.previewUrl, clipFor(track));
  if (!track.previewUrl) return null;
  const name = label ?? `${track.title} preview`;
  return (
    <button type="button" className={`play-btn play-${size} ${playing ? 'is-playing' : ''}`} onClick={toggle} aria-label={playing ? `Pause ${name}` : `Play ${name}`} aria-pressed={playing}>
      <svg className="play-ring" viewBox="0 0 36 36" aria-hidden>
        <circle cx="18" cy="18" r="16" />
        <circle cx="18" cy="18" r="16" className="play-ring-fill" style={{ strokeDashoffset: 100.5 * (1 - progress) }} />
      </svg>
      <motion.span key={playing ? 'pause' : 'play'} initial={{ scale: 0.6, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ duration: 0.15 }} className="play-icon">
        {loading ? <Loader2 size={size === 'sm' ? 14 : 18} className="spin" /> : playing ? <Pause size={size === 'sm' ? 14 : 18} fill="currentColor" /> : <Play size={size === 'sm' ? 14 : 18} fill="currentColor" />}
      </motion.span>
    </button>
  );
}

/** The soundtrack card: an Apple preview plays the host's 15-second moment; a Spotify song uses Spotify's own player. */
export function TrackCard({ track, actions, tone = 'light', heading, children, staticPlayer }: { track: Track; actions?: ReactNode; tone?: 'light' | 'dark'; heading?: string; children?: ReactNode; staticPlayer?: boolean }) {
  const { error, progress, playing } = useAudio(track.previewUrl, clipFor(track));
  const [spotifyOpen, setSpotifyOpen] = useState(false);
  const spotify = track.provider === 'spotify';
  return (
    <div className={`track-card track-${tone}`}>
      {heading && <p className="track-heading">{heading}</p>}
      <div className="track-row">
        <Artwork track={track} size={64} />
        <div className="track-meta">
          <p className="track-title">{track.title}</p>
          <p className="track-artist">
            {track.artist}
            <span className="track-duration"> · {clipLabel(track)}</span>
          </p>
          {!spotify && (
            <div className="track-progress" aria-hidden>
              <span style={{ transform: `scaleX(${progress})` }} className={playing ? 'is-live' : ''} />
            </div>
          )}
        </div>
        <PlayButton track={track} />
      </div>
      {error && <p className="field-error">{error}</p>}
      {children}
      {spotify && !staticPlayer && (
        <div className="track-spotify">
          {spotifyOpen ? (
            <iframe
              title={`${track.title} on Spotify`}
              src={`https://open.spotify.com/embed/track/${track.id}?utm_source=generator`}
              width="100%"
              height="80"
              loading="lazy"
              allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture"
            />
          ) : (
            <button type="button" className="btn btn-secondary btn-sm" onClick={() => setSpotifyOpen(true)}>
              <Play size={16} aria-hidden />
              <span>Load Spotify player</span>
            </button>
          )}
        </div>
      )}
      <div className="track-footer">
        {track.externalUrl && (
          <a className="track-link" href={track.externalUrl} target="_blank" rel="noopener noreferrer">
            {spotify ? 'Open in Spotify' : 'Listen on Apple Music'}
            <ExternalLink size={14} aria-hidden />
          </a>
        )}
        {actions}
      </div>
      <p className="track-note">
        {spotify ? 'Plays in Spotify’s own player. ' : `${CLIP_SECONDS}-second moment from the Apple Music preview. `}
        Music playback depends on your device and the selected music service.
      </p>
    </div>
  );
}
