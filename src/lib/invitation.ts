import { sha256 } from 'js-sha256';
import { partyTitle, WORD_THEMES } from './constants';
import type { GuestInvite, Invitation } from './types';

export function makeId(len = 10) {
  const alphabet = 'abcdefghjkmnpqrstuvwxyz23456789';
  const bytes = new Uint8Array(len);
  crypto.getRandomValues(bytes);
  return Array.from(bytes, (b) => alphabet[b % alphabet.length]).join('');
}

export const randomSeed = () => Math.floor(Math.random() * 2 ** 31);

export function emptyInvitation(): Invitation {
  return {
    id: makeId(),
    partyType: 'birthday',
    partyTypeOther: '',
    guestName: '',
    hostName: '',
    vibe: '',
    surprised: false,
    date: '',
    startTime: '',
    endTime: '',
    venue: '',
    address: '',
    privateLocation: false,
    dressCode: '',
    message: '',
    game: '',
    code: { clue: '', answer: '', hint: '' },
    words: { theme: 'party', customWords: '', seed: randomSeed() },
    puzzle: { art: 'poster', difficulty: 'easy', seed: randomSeed() },
    soundtrack: '',
    track: null,
    status: 'draft',
  };
}

/** Older drafts and links may carry em dashes in their copy; swap them for commas. */
export function withoutEmDashes<T>(value: T): T {
  if (typeof value === 'string') return value.replace(/\s*\u2014\s*/g, ', ') as T;
  if (Array.isArray(value)) return value.map(withoutEmDashes) as T;
  if (value && typeof value === 'object') return Object.fromEntries(Object.entries(value).map(([k, v]) => [k, withoutEmDashes(v)])) as T;
  return value;
}

/* ---------- validation ---------- */

export type Errors = Partial<Record<string, string>>;

export function todayISO() {
  const d = new Date();
  d.setMinutes(d.getMinutes() - d.getTimezoneOffset());
  return d.toISOString().slice(0, 10);
}

export function validatePersonalise(inv: Invitation): Errors {
  const e: Errors = {};
  if (!inv.partyType) e.partyType = 'Pick the kind of party.';
  if (inv.partyType === 'other' && !inv.partyTypeOther.trim()) e.partyTypeOther = 'Tell us what you’re celebrating.';
  if (!inv.guestName.trim()) e.guestName = 'Who’s the invite for?';
  if (!inv.hostName.trim()) e.hostName = 'Add your name so they know who’s inviting them.';
  if (!inv.vibe) e.vibe = 'Choose a vibe, or let us surprise you.';
  return e;
}

export function validateDetails(inv: Invitation): Errors {
  const e: Errors = {};
  if (!inv.date) e.date = 'Pick the date of the party.';
  else if (inv.date < todayISO()) e.date = 'That date has already passed. Choose today or later.';
  if (!inv.startTime) e.startTime = 'When should people arrive?';
  if (!inv.venue.trim()) e.venue = 'Add the venue name.';
  if (!inv.address.trim()) e.address = 'Add an address or location so guests can find you.';
  if (inv.message.length > 280) e.message = 'Keep the message under 280 characters.';
  return e;
}

export function customWordList(raw: string) {
  return raw
    .split(/[\s,]+/)
    .map((w) => w.trim().toUpperCase())
    .filter(Boolean);
}

export function wordsFor(inv: Pick<Invitation, 'words'>) {
  if (inv.words.theme === 'custom') return customWordList(inv.words.customWords);
  return WORD_THEMES.find((t) => t.value === inv.words.theme)?.words ?? WORD_THEMES[0].words;
}

export function validateGame(inv: Invitation): Errors {
  const e: Errors = {};
  if (!inv.game) e.game = 'Choose how your guest unlocks the invite.';
  if (inv.game === 'crack-the-code') {
    if (!inv.code.clue.trim()) e.clue = 'Write a clue only your guest would get.';
    if (normaliseAnswer(inv.code.answer).length < 2) e.answer = 'Add the secret answer (at least 2 letters).';
  }
  if (inv.game === 'find-the-vibe' && inv.words.theme === 'custom') {
    const list = customWordList(inv.words.customWords);
    if (list.length < 3 || list.length > 6) e.customWords = 'Use 3 to 6 words.';
    else if (list.some((w) => !/^[A-Z]{3,8}$/.test(w))) e.customWords = 'Each word needs 3–8 letters, no numbers or symbols.';
    else if (new Set(list).size !== list.length) e.customWords = 'Each word should be different.';
  }
  return e;
}

export function validateMusic(inv: Invitation): Errors {
  const e: Errors = {};
  if (!inv.soundtrack) e.soundtrack = 'Add a song, or choose “No soundtrack”.';
  if (inv.soundtrack === 'track' && !inv.track) e.track = 'Pick a song, or switch to “No soundtrack”.';
  else if (inv.soundtrack === 'track' && inv.track && !inv.track.artist.trim()) e.track = 'Add the artist’s name.';
  return e;
}

export const hasErrors = (e: Errors) => Object.keys(e).length > 0;

/* ---------- answers & sealing ---------- */

/** Forgiving comparison: case, accents, punctuation, extra spaces and a leading article don't matter. */
export function normaliseAnswer(s: string) {
  return s
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .replace(/^(the|a|an) /, '');
}

const verifier = (id: string, answer: string) => sha256(`verify|${id}|${normaliseAnswer(answer)}`);

export function checkAnswer(invite: GuestInvite, attempt: string) {
  return !!invite.game.verify && verifier(invite.id, attempt) === invite.game.verify;
}

function keystream(key: string, length: number) {
  const out = new Uint8Array(length);
  for (let i = 0, block = 0; i < length; block++) {
    const chunk = sha256.array(`${key}|${block}`);
    for (let j = 0; j < chunk.length && i < length; j++, i++) out[i] = chunk[j];
  }
  return out;
}

const utf8 = new TextEncoder();
const fromUtf8 = new TextDecoder();

function toB64Url(bytes: Uint8Array) {
  let bin = '';
  bytes.forEach((b) => (bin += String.fromCharCode(b)));
  return btoa(bin).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

function fromB64Url(s: string) {
  const bin = atob(s.replace(/-/g, '+').replace(/_/g, '/'));
  return Uint8Array.from(bin, (c) => c.charCodeAt(0));
}

function seal(id: string, answer: string, data: object) {
  const plain = utf8.encode(JSON.stringify(data));
  const ks = keystream(`seal|${id}|${normaliseAnswer(answer)}`, plain.length);
  return toB64Url(plain.map((b, i) => b ^ ks[i]));
}

export function unseal(invite: GuestInvite, answer: string): { venue: string; address: string } | null {
  if (!invite.sealed) return null;
  try {
    const cipher = fromB64Url(invite.sealed);
    const ks = keystream(`seal|${invite.id}|${normaliseAnswer(answer)}`, cipher.length);
    return JSON.parse(fromUtf8.decode(cipher.map((b, i) => b ^ ks[i])));
  } catch {
    return null;
  }
}

export function revealHidden(invite: GuestInvite): { venue: string; address: string } | null {
  if (!invite.hidden) return null;
  try {
    return JSON.parse(fromUtf8.decode(fromB64Url(invite.hidden)));
  } catch {
    return null;
  }
}

/* ---------- guest projection & links ---------- */

/** Builds the guest-safe invitation: no plaintext answer, no host-only settings. */
export function toGuestInvite(inv: Invitation): GuestInvite {
  const location = { venue: inv.venue.trim(), address: inv.address.trim() };
  const isCode = inv.game === 'crack-the-code';
  const g: GuestInvite = {
    v: 1,
    id: inv.id,
    guestName: inv.guestName.trim(),
    hostName: inv.hostName.trim(),
    partyLabel: partyTitle(inv.partyType, inv.partyTypeOther),
    vibe: inv.vibe || 'chaotic-fun',
    date: inv.date,
    startTime: inv.startTime,
    endTime: inv.endTime,
    privateLocation: inv.privateLocation,
    dressCode: inv.dressCode.trim(),
    message: inv.message.trim(),
    game: { type: inv.game || 'crack-the-code' },
    track: inv.soundtrack === 'track' ? inv.track : null,
  };
  if (!inv.privateLocation) Object.assign(g, location);
  else if (isCode) g.sealed = seal(inv.id, inv.code.answer, location);
  else g.hidden = toB64Url(utf8.encode(JSON.stringify(location)));

  if (isCode) {
    g.game.clue = inv.code.clue.trim();
    if (inv.code.hint.trim()) g.game.hint = inv.code.hint.trim();
    g.game.verify = verifier(inv.id, inv.code.answer);
  } else if (inv.game === 'find-the-vibe') {
    g.game.words = wordsFor(inv);
    g.game.seed = inv.words.seed;
  } else if (inv.game === 'piece-together') {
    g.game.art = inv.puzzle.art;
    g.game.difficulty = inv.puzzle.difficulty;
    g.game.seed = inv.puzzle.seed;
  }
  return g;
}

export function encodeInvite(g: GuestInvite) {
  return toB64Url(utf8.encode(JSON.stringify(g)));
}

export function decodeInvite(s: string): GuestInvite | null {
  try {
    const g = JSON.parse(fromUtf8.decode(fromB64Url(s)));
    if (!(g && g.v === 1 && typeof g.id === 'string')) return null;
    if (g.track && !(g.track.provider === 'spotify' || g.track.previewUrl)) g.track = null;
    return withoutEmDashes(g as GuestInvite);
  } catch {
    return null;
  }
}

export function guestUrl(g: GuestInvite) {
  return `${window.location.origin}/invite/${g.id}?d=${encodeInvite(g)}`;
}

/* ---------- formatting ---------- */

export function formatDate(iso: string, style: 'long' | 'short' = 'long') {
  if (!iso) return '';
  const [y, m, d] = iso.split('-').map(Number);
  const date = new Date(y, m - 1, d);
  return date.toLocaleDateString('en-GB', style === 'long'
    ? { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' }
    : { weekday: 'short', day: 'numeric', month: 'short' });
}

export function formatTime(t: string) {
  if (!t) return '';
  const [h, m] = t.split(':').map(Number);
  const suffix = h >= 12 ? 'PM' : 'AM';
  const hr = h % 12 || 12;
  return `${hr}${m ? `:${String(m).padStart(2, '0')}` : ''} ${suffix}`;
}

export function formatTimeRange(start: string, end: string) {
  if (!start) return '';
  if (!end) return `From ${formatTime(start)}`;
  return `${formatTime(start)} – ${formatTime(end)}${end <= start ? ' (next day)' : ''}`;
}

export function formatDuration(ms?: number) {
  if (ms == null || Number.isNaN(ms)) return '';
  const s = Math.round(ms / 1000);
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;
}

export function possessive(name: string) {
  const n = name.trim();
  return n.endsWith('s') ? `${n}’` : `${n}’s`;
}
