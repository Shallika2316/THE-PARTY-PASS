import type { Track } from './types';

/*
 * Music source: Apple's public iTunes Search API (no key required).
 * It returns licensed 30-second previews plus a link to the full song on Apple Music,
 * which we always show as attribution.
 */

interface ItunesResult {
  trackId: number;
  trackName: string;
  artistName: string;
  collectionName?: string;
  artworkUrl100?: string;
  previewUrl?: string;
  trackTimeMillis?: number;
  trackViewUrl?: string;
}

function storefront() {
  const region = (navigator.language.split('-')[1] || '').toLowerCase();
  return /^[a-z]{2}$/.test(region) ? region : 'us';
}

export async function searchSongs(term: string, signal?: AbortSignal): Promise<Track[]> {
  const params = new URLSearchParams({ term, media: 'music', entity: 'song', limit: '12', country: storefront() });
  const res = await fetch(`https://itunes.apple.com/search?${params}`, { signal });
  if (!res.ok) throw new Error(`Search failed (${res.status})`);
  const data: { results: ItunesResult[] } = await res.json();
  return data.results
    .filter((r) => r.previewUrl)
    .map((r) => ({
      provider: 'apple',
      id: String(r.trackId),
      title: r.trackName,
      artist: r.artistName,
      album: r.collectionName,
      artwork: r.artworkUrl100?.replace('100x100bb', '300x300bb'),
      previewUrl: r.previewUrl,
      durationMs: r.trackTimeMillis,
      externalUrl: r.trackViewUrl,
      clipStart: 0,
    }));
}

export const SUGGESTED_SEARCHES = ['Dancing Queen', 'September', 'Levitating', 'Badtameez Dil', 'Golden Hour'];
