import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import { emptyInvitation, makeId, withoutEmDashes } from './invitation';
import type { GuestInvite, Invitation, RsvpResponse } from './types';

/*
 * Prototype persistence: everything lives in this browser's localStorage.
 * Guest links carry their own (answer-free) invitation data in the URL, so they
 * open on any device without a backend. RSVPs are stored on the guest's device only.
 */

const DRAFT_KEY = 'koikoi.partypass.draft';
const PUBLISHED_KEY = 'koikoi.partypass.published';
const RSVP_KEY = 'koikoi.partypass.rsvp';
const UNLOCK_KEY = 'koikoi.partypass.unlocked';

export function readJSON<T>(key: string, fallback: T, storage: 'local' | 'session' = 'local'): T {
  try {
    const raw = (storage === 'local' ? localStorage : sessionStorage).getItem(key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
}

export function writeJSON(key: string, value: unknown, storage: 'local' | 'session' = 'local') {
  try {
    (storage === 'local' ? localStorage : sessionStorage).setItem(key, JSON.stringify(value));
  } catch {
    /* storage unavailable (private mode); the session still works in memory */
  }
}

interface DraftCtx {
  draft: Invitation;
  update: (patch: Partial<Invitation>) => void;
  reset: () => void;
  publish: () => Invitation;
  forAnotherGuest: () => void;
}

const Ctx = createContext<DraftCtx | null>(null);

function loadDraft(): Invitation {
  const saved = withoutEmDashes(readJSON<Partial<Invitation> | null>(DRAFT_KEY, null));
  if (saved?.track && !(saved.track.provider === 'spotify' || saved.track.previewUrl)) saved.track = null;
  const base = emptyInvitation();
  return saved ? { ...base, ...saved, code: { ...base.code, ...saved.code }, words: { ...base.words, ...saved.words }, puzzle: { ...base.puzzle, ...saved.puzzle } } : base;
}

export function DraftProvider({ children }: { children: ReactNode }) {
  const [draft, setDraft] = useState<Invitation>(loadDraft);

  useEffect(() => writeJSON(DRAFT_KEY, draft), [draft]);

  const update = useCallback((patch: Partial<Invitation>) => {
    // Any edit after publishing produces a fresh invitation with its own link.
    setDraft((d) => ({ ...d, ...patch, ...(d.status === 'published' ? { status: 'draft', id: makeId(), publishedAt: undefined } : {}) }));
  }, []);

  const reset = useCallback(() => setDraft(emptyInvitation()), []);

  const publish = useCallback(() => {
    const published: Invitation = { ...draft, status: 'published', publishedAt: new Date().toISOString() };
    const all = readJSON<Record<string, Invitation>>(PUBLISHED_KEY, {});
    all[published.id] = published;
    writeJSON(PUBLISHED_KEY, all);
    setDraft(published);
    return published;
  }, [draft]);

  const forAnotherGuest = useCallback(() => {
    setDraft((d) => ({ ...d, id: makeId(), guestName: '', status: 'draft', publishedAt: undefined }));
  }, []);

  const value = useMemo(() => ({ draft, update, reset, publish, forAnotherGuest }), [draft, update, reset, publish, forAnotherGuest]);
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useDraft() {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error('useDraft must be used inside DraftProvider');
  return ctx;
}

/* ---------- guest-side state ---------- */

export function cacheGuestInvite(g: GuestInvite) {
  writeJSON(`koikoi.partypass.invite.${g.id}`, g, 'session');
}

export function cachedGuestInvite(id: string) {
  return withoutEmDashes(readJSON<GuestInvite | null>(`koikoi.partypass.invite.${id}`, null, 'session'));
}

export interface UnlockState {
  venue?: string;
  address?: string;
}

export function markUnlocked(id: string, data: UnlockState) {
  const all = readJSON<Record<string, UnlockState>>(UNLOCK_KEY, {}, 'session');
  all[id] = data;
  writeJSON(UNLOCK_KEY, all, 'session');
}

export function unlockedState(id: string): UnlockState | null {
  return readJSON<Record<string, UnlockState>>(UNLOCK_KEY, {}, 'session')[id] ?? null;
}

export function saveRsvp(id: string, response: RsvpResponse) {
  const all = readJSON<Record<string, { response: RsvpResponse; at: string }>>(RSVP_KEY, {});
  all[id] = { response, at: new Date().toISOString() };
  writeJSON(RSVP_KEY, all);
}

export function savedRsvp(id: string) {
  return readJSON<Record<string, { response: RsvpResponse; at: string }>>(RSVP_KEY, {})[id] ?? null;
}
