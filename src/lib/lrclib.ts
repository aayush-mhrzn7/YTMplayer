import { parseLrc } from "./lrc-parse";
import { normalizeArtist, normalizeTitle } from "./normalize";
import type { LyricLine, LyricsStatus } from "../types";

const CLIENT = "ytm-lyrics-overlay/1.0";

export interface LrclibResult {
  status: Extract<LyricsStatus, "ready" | "not_found" | "instrumental">;
  lines: LyricLine[];
}

interface LrclibTrack {
  id?: number;
  trackName?: string;
  artistName?: string;
  duration?: number | null;
  instrumental?: boolean;
  syncedLyrics?: string | null;
  plainLyrics?: string | null;
}

async function lrclibFetch(url: string): Promise<Response> {
  return fetch(url, {
    headers: {
      "Lrclib-Client": CLIENT,
    },
  });
}

function fromTrack(track: LrclibTrack | null): LrclibResult {
  if (!track) return { status: "not_found", lines: [] };
  if (track.instrumental) return { status: "instrumental", lines: [] };
  const synced = track.syncedLyrics?.trim();
  if (synced) {
    const lines = parseLrc(synced);
    if (lines.length) return { status: "ready", lines };
  }
  return { status: "not_found", lines: [] };
}

export async function fetchSyncedLyrics(
  title: string,
  artist: string,
  duration: number,
): Promise<LrclibResult> {
  const track_name = normalizeTitle(title);
  const artist_name = normalizeArtist(artist);
  if (!track_name || !artist_name) {
    return { status: "not_found", lines: [] };
  }

  const params = new URLSearchParams({ track_name, artist_name });
  if (Number.isFinite(duration) && duration > 0) {
    params.set("duration", String(Math.round(duration)));
  }

  try {
    const getRes = await lrclibFetch(
      `https://lrclib.net/api/get?${params.toString()}`,
    );
    if (getRes.ok) {
      const track = (await getRes.json()) as LrclibTrack;
      const result = fromTrack(track);
      if (result.status !== "not_found") return result;
    } else if (getRes.status !== 404) {
      // Unexpected error — still try search
    }

    const searchParams = new URLSearchParams({ track_name, artist_name });
    const searchRes = await lrclibFetch(
      `https://lrclib.net/api/search?${searchParams.toString()}`,
    );
    if (!searchRes.ok) return { status: "not_found", lines: [] };

    const results = (await searchRes.json()) as LrclibTrack[];
    if (!Array.isArray(results) || !results.length) {
      return { status: "not_found", lines: [] };
    }

    const withSynced = results.filter((r) => r.syncedLyrics?.trim());
    const pool = withSynced.length ? withSynced : results;

    let best = pool[0];
    if (Number.isFinite(duration) && duration > 0) {
      best = pool.reduce((a, b) => {
        const da = Math.abs((a.duration ?? 0) - duration);
        const db = Math.abs((b.duration ?? 0) - duration);
        return db < da ? b : a;
      });
    }

    return fromTrack(best);
  } catch {
    return { status: "not_found", lines: [] };
  }
}
