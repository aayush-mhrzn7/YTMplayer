import type { LyricsState, NowPlaying, Prefs } from "../types";
import { DEFAULT_PREFS, EMPTY_LYRICS } from "../types";

const cover = document.getElementById("cover") as HTMLImageElement;
const title = document.getElementById("title") as HTMLElement;
const artist = document.getElementById("artist") as HTMLElement;
const status = document.getElementById("status") as HTMLElement;
const enabled = document.getElementById("enabled") as HTMLInputElement;
const transportEnabled = document.getElementById(
  "transportEnabled",
) as HTMLInputElement;

function statusText(np: NowPlaying | null, lyrics: LyricsState): string {
  if (!np?.title) return "No track";
  if (lyrics.status === "loading") return "Loading lyrics…";
  if (lyrics.status === "not_found") return "Lyrics not found";
  if (lyrics.status === "instrumental") return "Instrumental";
  if (np.playing) return "Playing";
  return "Paused";
}

function readPrefs(data: Record<string, unknown>): Prefs {
  return {
    enabled: Boolean(data.enabled ?? DEFAULT_PREFS.enabled),
    widgetClosed: Boolean(data.widgetClosed ?? DEFAULT_PREFS.widgetClosed),
    widgetMinimized: Boolean(
      data.widgetMinimized ?? DEFAULT_PREFS.widgetMinimized,
    ),
    minimizePinned: Boolean(
      data.minimizePinned ?? DEFAULT_PREFS.minimizePinned,
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

async function render(): Promise<void> {
  const data = await chrome.storage.local.get({
    ...DEFAULT_PREFS,
    nowPlaying: null,
    lyrics: EMPTY_LYRICS,
  });

  const prefs = readPrefs(data);
  const np = (data.nowPlaying as NowPlaying | null) ?? null;
  const lyrics = (data.lyrics as LyricsState | undefined) ?? EMPTY_LYRICS;

  enabled.checked = prefs.enabled;
  transportEnabled.checked = prefs.transportEnabled;

  if (np?.title) {
    title.textContent = np.title;
    artist.textContent = np.artist || "Unknown artist";
    if (np.albumArtUrl) {
      cover.src = np.albumArtUrl;
      cover.classList.remove("empty");
    } else {
      cover.removeAttribute("src");
      cover.classList.add("empty");
    }
  } else {
    title.textContent = "No track";
    artist.textContent = "Play something on YouTube Music";
    cover.removeAttribute("src");
    cover.classList.add("empty");
  }

  status.textContent = statusText(np, lyrics);
}

enabled.addEventListener("change", () => {
  if (enabled.checked) {
    void chrome.storage.local.set({
      enabled: true,
      widgetClosed: false,
      widgetMinimized: false,
      minimizePinned: false,
    });
  } else {
    void chrome.storage.local.set({ enabled: false });
  }
});

transportEnabled.addEventListener("change", () => {
  void chrome.storage.local.set({
    transportEnabled: transportEnabled.checked,
  });
});

chrome.storage.onChanged.addListener((changes, area) => {
  if (area === "local") void render();
});

void render();
