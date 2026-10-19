/** Spotify share links: parsed locally, title + artwork looked up from Spotify's public oEmbed endpoint. */

export function parseSpotifyLink(value: string): { id: string; url: string } | null {
  const m = value.trim().match(/(?:open\.spotify\.com\/(?:intl-[a-z-]+\/)?track\/|spotify:track:)([A-Za-z0-9]{22})/);
  return m ? { id: m[1], url: `https://open.spotify.com/track/${m[1]}` } : null;
}

export async function spotifyTrackInfo(trackUrl: string): Promise<{ title: string; artwork?: string }> {
  const res = await fetch(`https://open.spotify.com/oembed?url=${encodeURIComponent(trackUrl)}`);
  if (!res.ok) throw new Error('Spotify couldn’t find that song');
  const data: { title?: string; thumbnail_url?: string } = await res.json();
  return { title: data.title ?? '', artwork: data.thumbnail_url };
}
