import type { GameType, PartyType, PuzzleArt, Vibe, WordTheme } from './types';

export const PARTY_TYPES: { value: PartyType; label: string; title: string }[] = [
  { value: 'birthday', label: 'Birthday', title: 'Birthday Party' },
  { value: 'house-party', label: 'House Party', title: 'House Party' },
  { value: 'dinner', label: 'Dinner', title: 'Dinner Party' },
  { value: 'costume-night', label: 'Costume Night', title: 'Costume Night' },
  { value: 'other', label: 'Other', title: 'Celebration' },
];

export const VIBES: { value: Vibe; label: string; blurb: string }[] = [
  { value: 'chaotic-fun', label: 'Chaotic Fun', blurb: 'Loud music, louder laughs.' },
  { value: 'cozy', label: 'Cozy', blurb: 'Warm lights, good food, close friends.' },
  { value: 'dress-to-impress', label: 'Dress to Impress', blurb: 'Bring your best look.' },
];

export const GAMES: { value: GameType; label: string; description: string; guestLine: string }[] = [
  {
    value: 'crack-the-code',
    label: 'Crack the Code',
    description: 'A secret answer stands between them and the party.',
    guestLine: 'Answer the clue to unlock your invite.',
  },
  {
    value: 'find-the-vibe',
    label: 'Find the Vibe',
    description: 'Find the hidden words to reveal the invite.',
    guestLine: 'Find every hidden word to unlock your invite.',
  },
  {
    value: 'piece-together',
    label: 'Piece Together the Party',
    description: 'Put the pieces together to discover the surprise.',
    guestLine: 'Rebuild the picture to unlock your invite.',
  },
];

export const WORD_THEMES: { value: WordTheme; label: string; words: string[] }[] = [
  { value: 'party', label: 'Party', words: ['DANCE', 'MUSIC', 'CAKE', 'FRIENDS', 'VIBES'] },
  { value: 'birthday', label: 'Birthday', words: ['CAKE', 'WISH', 'CANDLE', 'GIFTS', 'CHEERS'] },
  { value: 'disco', label: 'Disco', words: ['DISCO', 'GROOVE', 'GLITTER', 'FUNK', 'LIGHTS'] },
  { value: 'dinner', label: 'Dinner', words: ['FEAST', 'WINE', 'TOAST', 'DESSERT', 'TABLE'] },
];

export const PUZZLE_ARTS: { value: PuzzleArt; label: string }[] = [
  { value: 'poster', label: 'Party poster' },
  { value: 'disco', label: 'Disco night' },
  { value: 'photo', label: 'Party photo' },
];

export function partyTitle(type: PartyType | '', other: string) {
  if (type === 'other') return other.trim() || 'Celebration';
  return PARTY_TYPES.find((p) => p.value === type)?.title ?? 'Party';
}

export function vibeLabel(v: Vibe | '') {
  return VIBES.find((x) => x.value === v)?.label ?? '';
}

export function gameLabel(g: GameType | '') {
  return GAMES.find((x) => x.value === g)?.label ?? '';
}
