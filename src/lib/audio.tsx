import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import type { Track } from './types';

/** Every soundtrack plays as a 15-second moment the host picks from the preview. */
export const CLIP_SECONDS = 15;

export interface Clip {
  start: number;
  duration: number;
  loop?: boolean;
}

export function clipFor(track: Track | null | undefined, loop = false): Clip | undefined {
  if (!track?.previewUrl) return undefined;
  return { start: track.clipStart ?? 0, duration: CLIP_SECONDS, loop };
}

/** One shared <audio> element so only one song plays at a time. */
interface AudioCtx {
  currentSrc: string | null;
  playing: boolean;
  loading: boolean;
  progress: number;
  error: string | null;
  toggle: (src: string, clip?: Clip) => void;
  play: (src: string, clip?: Clip) => Promise<boolean>;
  stop: () => void;
}

const Ctx = createContext<AudioCtx | null>(null);

export function AudioProvider({ children }: { children: ReactNode }) {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const clipRef = useRef<Clip | undefined>(undefined);
  const [currentSrc, setCurrentSrc] = useState<string | null>(null);
  const [playing, setPlaying] = useState(false);
  const [loading, setLoading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const a = new Audio();
    a.preload = 'none';
    audioRef.current = a;
    const onTime = () => {
      const clip = clipRef.current;
      if (!clip) {
        setProgress(a.duration ? a.currentTime / a.duration : 0);
        return;
      }
      const end = clip.start + clip.duration;
      if (a.currentTime >= end) {
        a.currentTime = clip.start;
        if (!clip.loop) {
          a.pause();
          setProgress(0);
          return;
        }
      }
      setProgress(Math.max(0, Math.min(1, (a.currentTime - clip.start) / clip.duration)));
    };
    const onPlay = () => {
      setPlaying(true);
      setLoading(false);
    };
    const onPause = () => setPlaying(false);
    const onWaiting = () => setLoading(true);
    const onEnded = () => {
      const clip = clipRef.current;
      if (clip?.loop) {
        a.currentTime = clip.start;
        a.play().catch(() => {});
      } else {
        setPlaying(false);
        setProgress(0);
      }
    };
    const onError = () => {
      setPlaying(false);
      setLoading(false);
      setError('This preview couldn’t be played on this device.');
    };
    a.addEventListener('timeupdate', onTime);
    a.addEventListener('playing', onPlay);
    a.addEventListener('pause', onPause);
    a.addEventListener('waiting', onWaiting);
    a.addEventListener('ended', onEnded);
    a.addEventListener('error', onError);
    return () => {
      a.pause();
      a.src = '';
    };
  }, []);

  const play = useCallback(async (src: string, clip?: Clip) => {
    const a = audioRef.current;
    if (!a) return false;
    setError(null);
    const sameClip = clipRef.current?.start === clip?.start && clipRef.current?.loop === clip?.loop;
    clipRef.current = clip;
    const seek = () => {
      if (!clip) return;
      if (a.currentTime < clip.start || a.currentTime >= clip.start + clip.duration || !sameClip) a.currentTime = clip.start;
    };
    if (a.src !== src) {
      a.src = src;
      setCurrentSrc(src);
      setProgress(0);
      if (clip) a.addEventListener('loadedmetadata', () => (a.currentTime = clip.start), { once: true });
    } else if (a.readyState >= 1) seek();
    setLoading(true);
    try {
      await a.play();
      return true;
    } catch {
      setLoading(false);
      return false;
    }
  }, []);

  const toggle = useCallback(
    (src: string, clip?: Clip) => {
      const a = audioRef.current;
      if (!a) return;
      if (currentSrc === src && !a.paused) {
        a.pause();
        return;
      }
      play(src, clip).then((ok) => {
        if (!ok) setError('Playback was blocked or unavailable. Tap play to try again.');
      });
    },
    [currentSrc, play],
  );

  const stop = useCallback(() => {
    audioRef.current?.pause();
  }, []);

  const value = useMemo(() => ({ currentSrc, playing, loading, progress, error, toggle, play, stop }), [currentSrc, playing, loading, progress, error, toggle, play, stop]);
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useAudio(src?: string, clip?: Clip) {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error('useAudio must be used inside AudioProvider');
  const active = !!src && ctx.currentSrc === src;
  return {
    playing: active && ctx.playing,
    loading: active && ctx.loading,
    progress: active ? ctx.progress : 0,
    error: active ? ctx.error : null,
    toggle: () => src && ctx.toggle(src, clip),
    play: () => (src ? ctx.play(src, clip) : Promise.resolve(false)),
    stop: ctx.stop,
  };
}
