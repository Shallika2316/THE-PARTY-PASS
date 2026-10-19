import { Pause, Play, Scissors } from 'lucide-react';
import { useEffect, useMemo, useRef, useState } from 'react';
import { CLIP_SECONDS, clipFor, useAudio } from '../lib/audio';
import { formatDuration } from '../lib/invitation';
import type { Track } from '../lib/types';

const BARS = 90;
const waveCache = new Map<string, { peaks: number[]; duration: number }>();

/** Decodes the preview (Apple allows cross-origin reads) to draw the song's real waveform. */
function useWaveform(url?: string) {
  const [wave, setWave] = useState(() => (url ? waveCache.get(url) ?? null : null));
  const [failed, setFailed] = useState(false);
  useEffect(() => {
    if (!url) return;
    const cached = waveCache.get(url);
    if (cached) return setWave(cached);
    let cancelled = false;
    setWave(null);
    setFailed(false);
    (async () => {
      try {
        const buf = await (await fetch(url)).arrayBuffer();
        const ctx = new OfflineAudioContext(1, 1, 44100);
        const audio = await ctx.decodeAudioData(buf);
        const data = audio.getChannelData(0);
        const step = Math.floor(data.length / BARS);
        const peaks = Array.from({ length: BARS }, (_, i) => {
          let sum = 0;
          for (let j = i * step; j < (i + 1) * step; j += 16) sum += Math.abs(data[j]);
          return sum / (step / 16);
        });
        const max = Math.max(...peaks) || 1;
        const result = { peaks: peaks.map((p) => Math.max(0.08, p / max)), duration: audio.duration };
        waveCache.set(url, result);
        if (!cancelled) setWave(result);
      } catch {
        if (!cancelled) setFailed(true);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [url]);
  return { wave, failed };
}

/** Lets the host choose which 15 seconds of the preview the guest hears. */
export function ClipPicker({ track, onChange }: { track: Track; onChange: (start: number) => void }) {
  const { wave, failed } = useWaveform(track.previewUrl);
  const duration = wave?.duration ?? 30;
  const maxStart = Math.max(0, Math.floor((duration - CLIP_SECONDS) * 2) / 2);
  const start = Math.min(track.clipStart ?? 0, maxStart);
  const { playing, progress, toggle, play } = useAudio(track.previewUrl, clipFor(track));
  // Moving the window while it plays jumps playback to the new moment.
  useEffect(() => {
    if (playing) play();
  }, [start]); // eslint-disable-line react-hooks/exhaustive-deps
  const left = (start / duration) * 100;
  const width = (CLIP_SECONDS / duration) * 100;
  const peaks = useMemo(() => wave?.peaks ?? Array.from({ length: BARS }, () => 0.35), [wave]);
  const dragging = useRef(false);

  const fromPointer = (e: React.PointerEvent<HTMLDivElement>) => {
    const r = e.currentTarget.getBoundingClientRect();
    const t = ((e.clientX - r.left) / r.width) * duration - CLIP_SECONDS / 2;
    onChange(Math.max(0, Math.min(maxStart, Math.round(t * 2) / 2)));
  };

  return (
    <div className="clip-picker">
      <div className="clip-head">
        <p className="label">
          <Scissors size={14} aria-hidden /> Pick the {CLIP_SECONDS}-second moment
        </p>
        <span className="clip-time">
          {formatDuration(start * 1000)} – {formatDuration((start + CLIP_SECONDS) * 1000)}
        </span>
      </div>
      <div
        className="clip-track"
        onPointerDown={(e) => {
          dragging.current = true;
          e.currentTarget.setPointerCapture(e.pointerId);
          fromPointer(e);
        }}
        onPointerMove={(e) => dragging.current && fromPointer(e)}
        onPointerUp={() => (dragging.current = false)}
        onPointerCancel={() => (dragging.current = false)}
      >
        <div className={`clip-wave ${wave ? '' : 'is-loading'}`} aria-hidden>
          {peaks.map((p, i) => {
            const t = ((i + 0.5) / BARS) * duration;
            const inside = t >= start && t <= start + CLIP_SECONDS;
            const played = inside && playing && t <= start + progress * CLIP_SECONDS;
            return <span key={i} className={`${inside ? 'in' : ''} ${played ? 'played' : ''}`} style={{ height: `${p * 100}%` }} />;
          })}
        </div>
        <input
          type="range"
          className="clip-range"
          min={0}
          max={maxStart}
          step={0.5}
          value={start}
          onChange={(e) => onChange(Number(e.target.value))}
          aria-label={`Clip start, ${formatDuration(start * 1000)}`}
          aria-valuetext={`Plays ${formatDuration(start * 1000)} to ${formatDuration((start + CLIP_SECONDS) * 1000)}`}
        />
        <span className="clip-window" style={{ left: `${left}%`, width: `${width}%` }} aria-hidden />
      </div>
      <div className="clip-foot">
        <button type="button" className="btn btn-secondary btn-sm" onClick={toggle} aria-pressed={playing}>
          {playing ? <Pause size={15} aria-hidden /> : <Play size={15} aria-hidden />}
          <span>{playing ? 'Pause' : `Play these ${CLIP_SECONDS} seconds`}</span>
        </button>
        <span className="clip-note">{failed ? 'Waveform unavailable, but the clip still works.' : `Drag to choose · from a ${Math.round(duration)}s preview`}</span>
      </div>
    </div>
  );
}
