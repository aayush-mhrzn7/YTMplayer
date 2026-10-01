import { parseLrc } from "./lrc-parse";
import {
  buildQueryArtist,
  normalizeTitle,
  versionTokens,
} from "./normalize";
import type { LyricLine, LyricsStatus } from "../types";

const CLIENT = "ytm-lyrics-overlay/1.0";
/** Prefer search hits within this many seconds of the playing track. */
const DURATION_TOLERANCE_SEC = 15;

export interface LrclibResult {
  status: Extract<LyricsStatus, "ready" | "not_found" | "instrumental">;
  lines: LyricLine[];
}

interface LrclibTrack {
  id?: number;
  trackName?: string;
  artistName?: string;
  albumName?: string;
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

function hasSynced(track: LrclibTrack): boolean {
  return Boolean(track.syncedLyrics?.trim()) && !track.instrumental;
}

function durationDelta(track: LrclibTrack, duration: number): number {
  if (track.duration == null || !Number.isFinite(track.duration)) {
    return Number.POSITIVE_INFINITY;
  }
  return Math.abs(track.duration - duration);
}

function trackHaystack(track: LrclibTrack): string {
  return `${track.trackName ?? ""} ${track.albumName ?? ""}`.toLowerCase();
}

/** True when recording-type tags on the query agree with the candidate. */
function versionCompatible(queryTitle: string, track: LrclibTrack): boolean {
  const q = versionTokens(queryTitle);
  const hay = trackHaystack(track);
  const t = versionTokens(hay);

  if (q.size) {
    for (const token of q) {
      if (!hay.includes(token)) return false;
    }
    return true;
  }

  // Studio query: reject clear live/remix/acoustic variants.
  for (const token of ["live", "acoustic", "remix", "karaoke", "instrumental"] as const) {
    if (t.has(token)) return false;
  }
  return true;
}

function versionScore(queryTitle: string, track: LrclibTrack): number {
  const q = versionTokens(queryTitle);
  const hay = trackHaystack(track);
  if (!q.size) {
    const t = versionTokens(hay);
    return ["live", "acoustic", "remix", "karaoke", "instrumental"].some((x) =>
      t.has(x),
    )
      ? -5
      : 0;
  }
  let score = 0;
  for (const token of q) {
    if (hay.includes(token)) score += 2;
    else score -= 5;
  }
  return score;
}

function pickBest(
  results: LrclibTrack[],
  duration: number,
  queryTitle: string,
): LrclibTrack | null {
  const synced = results.filter(hasSynced);
  if (synced.length) {
    const compatible = synced.filter((r) => versionCompatible(queryTitle, r));
    let pool = compatible.length ? compatible : synced;

    const hasDuration = Number.isFinite(duration) && duration > 0;
    if (hasDuration) {
      const within = pool.filter(
        (r) => durationDelta(r, duration) <= DURATION_TOLERANCE_SEC,
      );
      if (within.length) pool = within;
    }

    return pool.reduce((a, b) => {
      const sa = versionScore(queryTitle, a);
      const sb = versionScore(queryTitle, b);
      if (sb !== sa) return sb > sa ? b : a;
      if (!hasDuration) return a;
      return durationDelta(b, duration) < durationDelta(a, duration) ? b : a;
    });
  }

  const instrumental = results.find((r) => r.instrumental);
  return instrumental ?? results[0] ?? null;
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
  const artist_name = buildQueryArtist(artist, title);
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
      // Trust get only for synced lyrics that match live/remix/etc. tags.
      if (result.status === "ready" && versionCompatible(title, track)) {
        return result;
      }
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

    return fromTrack(pickBest(results, duration, title));
  } catch {
    return { status: "not_found", lines: [] };
  }
}
