import {
  DEFAULT_PREFS,
  EMPTY_LYRICS,
  type LyricsState,
  type NowPlaying,
  type Prefs,
} from "../types";

const PLAYBACK_KEYS = ["nowPlaying", "lyrics"] as const;

export async function getPrefs(): Promise<Prefs> {
  const data = await chrome.storage.local.get(DEFAULT_PREFS);
  return {
    enabled: Boolean(data.enabled ?? DEFAULT_PREFS.enabled),
    widgetClosed: Boolean(data.widgetClosed ?? DEFAULT_PREFS.widgetClosed),
    widgetMinimized: Boolean(
      data.widgetMinimized ?? DEFAULT_PREFS.widgetMinimized,
    ),
    transportEnabled: Boolean(
      data.transportEnabled ?? DEFAULT_PREFS.transportEnabled,
    ),
    widgetLeft:
      typeof data.widgetLeft === "number" ? data.widgetLeft : null,
    widgetBottom:
      typeof data.widgetBottom === "number" ? data.widgetBottom : null,
  };
}

export async function setPrefs(partial: Partial<Prefs>): Promise<void> {
  await chrome.storage.local.set(partial);
}

export async function getNowPlaying(): Promise<NowPlaying | null> {
  const { nowPlaying } = await chrome.storage.local.get("nowPlaying");
  return (nowPlaying as NowPlaying | undefined) ?? null;
}

export async function setNowPlaying(nowPlaying: NowPlaying | null): Promise<void> {
  if (nowPlaying) {
    await chrome.storage.local.set({ nowPlaying });
  } else {
    await chrome.storage.local.remove("nowPlaying");
  }
}

export async function getLyrics(): Promise<LyricsState> {
  const { lyrics } = await chrome.storage.local.get("lyrics");
  return (lyrics as LyricsState | undefined) ?? EMPTY_LYRICS;
}

export async function setLyrics(lyrics: LyricsState): Promise<void> {
  await chrome.storage.local.set({ lyrics });
}

export async function getAppState(): Promise<{
  prefs: Prefs;
  nowPlaying: NowPlaying | null;
  lyrics: LyricsState;
}> {
  const data = await chrome.storage.local.get({
    ...DEFAULT_PREFS,
    nowPlaying: null,
    lyrics: EMPTY_LYRICS,
  });
  return {
    prefs: {
      enabled: Boolean(data.enabled ?? DEFAULT_PREFS.enabled),
      widgetClosed: Boolean(data.widgetClosed ?? DEFAULT_PREFS.widgetClosed),
      widgetMinimized: Boolean(
        data.widgetMinimized ?? DEFAULT_PREFS.widgetMinimized,
      ),
      transportEnabled: Boolean(
        data.transportEnabled ?? DEFAULT_PREFS.transportEnabled,
      ),
      widgetLeft:
        typeof data.widgetLeft === "number" ? data.widgetLeft : null,
      widgetBottom:
        typeof data.widgetBottom === "number" ? data.widgetBottom : null,
    },
    nowPlaying: (data.nowPlaying as NowPlaying | null) ?? null,
    lyrics: (data.lyrics as LyricsState | undefined) ?? EMPTY_LYRICS,
  };
}

export async function seedDefaults(): Promise<void> {
  const existing = await chrome.storage.local.get(Object.keys(DEFAULT_PREFS));
  const patch: Record<string, Prefs[keyof Prefs]> = {};
  for (const key of Object.keys(DEFAULT_PREFS) as (keyof Prefs)[]) {
    if (existing[key] === undefined) {
      patch[key] = DEFAULT_PREFS[key];
    }
  }
  if (Object.keys(patch).length) {
    await chrome.storage.local.set(patch);
  }
  // Drop legacy session copies if present (best-effort).
  try {
    await chrome.storage.session.remove([...PLAYBACK_KEYS]);
  } catch {
    // ignore
  }
}
