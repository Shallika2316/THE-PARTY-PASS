export type PartyType = 'birthday' | 'house-party' | 'dinner' | 'costume-night' | 'other';
export type Vibe = 'chaotic-fun' | 'cozy' | 'dress-to-impress';
export type GameType = 'crack-the-code' | 'find-the-vibe' | 'piece-together';
export type PuzzleArt = 'poster' | 'disco' | 'photo';
export type WordTheme = 'party' | 'birthday' | 'disco' | 'dinner' | 'custom';

export interface Track {
  provider: 'apple' | 'spotify';
  /** Licensed 30-second preview from Apple Music. */
  previewUrl?: string;
  id: string;
  title: string;
  artist: string;
  album?: string;
  artwork?: string;
  durationMs?: number;
  externalUrl?: string;
  /** Where the 15-second moment starts, in seconds into the preview. */
  clipStart?: number;
}

export interface CodeConfig {
  clue: string;
  /** Host-only. Never included in the guest payload. */
  answer: string;
  hint: string;
}

export interface WordsConfig {
  theme: WordTheme;
  customWords: string;
  seed: number;
}

export interface PuzzleConfig {
  art: PuzzleArt;
  difficulty: 'easy' | 'standard';
  seed: number;
}

export interface Invitation {
  id: string;
  partyType: PartyType | '';
  partyTypeOther: string;
  guestName: string;
  hostName: string;
  vibe: Vibe | '';
  surprised: boolean;
  date: string; // yyyy-mm-dd
  startTime: string; // HH:mm
  endTime: string;
  venue: string;
  address: string;
  privateLocation: boolean;
  dressCode: string;
  message: string;
  game: GameType | '';
  code: CodeConfig;
  words: WordsConfig;
  puzzle: PuzzleConfig;
  soundtrack: 'track' | 'none' | '';
  track: Track | null;
  status: 'draft' | 'published';
  publishedAt?: string;
}

/** What a guest's link carries. Secret answers are replaced by a verifier + sealed data. */
export interface GuestGame {
  type: GameType;
  clue?: string;
  hint?: string;
  verify?: string;
  words?: string[];
  seed?: number;
  art?: PuzzleArt;
  difficulty?: 'easy' | 'standard';
}

export interface GuestInvite {
  v: 1;
  id: string;
  guestName: string;
  hostName: string;
  partyLabel: string;
  vibe: Vibe;
  date: string;
  startTime: string;
  endTime: string;
  /** Present only when the location is not private, or after unsealing. */
  venue?: string;
  address?: string;
  privateLocation: boolean;
  /** Private location encrypted with a key derived from the secret answer (Crack the Code). */
  sealed?: string;
  /** Private location for games without a secret answer (prototype limitation, see README). */
  hidden?: string;
  dressCode: string;
  message: string;
  game: GuestGame;
  track: Track | null;
}

export type RsvpResponse = 'yes' | 'no';
