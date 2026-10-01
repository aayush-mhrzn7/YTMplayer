import { fetchSyncedLyrics } from "./lib/lrclib";
import { trackKey } from "./lib/normalize";
import {
  getAppState,
  getLyrics,
  getNowPlaying,
  seedDefaults,
  setLyrics,
  setNowPlaying,
  setPrefs,
} from "./lib/state";
import type {
  ExtensionMessage,
  NowPlaying,
  PlaybackMessage,
  Prefs,
  StatePushMessage,
  TrackUpdateMessage,
  TransportAction,
} from "./types";
import { EMPTY_LYRICS } from "./types";

let fetchToken = 0;
let cachedNow: NowPlaying | null = null;
let lastPersistAt = 0;
let persistTimer: ReturnType<typeof setTimeout> | null = null;
let broadcastTimer: ReturnType<typeof setTimeout> | null = null;

function isAccepted(
  incoming: { sourceTabId: number; updatedAt: number },
  current: NowPlaying | null,
): boolean {
  if (!current) return true;
  if (incoming.sourceTabId === current.sourceTabId) return true;
  return incoming.updatedAt >= current.updatedAt;
}

async function broadcastState(force = false): Promise<void> {
  if (!force) {
    if (broadcastTimer != null) return;
    broadcastTimer = setTimeout(() => {
      broadcastTimer = null;
      void broadcastState(true);
    }, 100);
    return;
  }

  const state = await getAppState();
  if (cachedNow) state.nowPlaying = cachedNow;

  const message: StatePushMessage = {
    type: "STATE_PUSH",
    prefs: state.prefs,
    nowPlaying: state.nowPlaying,
    lyrics: state.lyrics,
  };

  let tabs: chrome.tabs.Tab[] = [];
  try {
    tabs = await chrome.tabs.query({ url: ["http://*/*", "https://*/*"] });
  } catch {
    return;
  }

  await Promise.all(
    tabs.map(async (tab) => {
      if (tab.id == null) return;
      try {
        await chrome.tabs.sendMessage(tab.id, message);
      } catch {
        // No overlay on this tab
      }
    }),
  );
}

async function persistNowPlaying(
  next: NowPlaying | null,
  force = false,
): Promise<void> {
  cachedNow = next;
  if (next == null) {
    if (persistTimer) {
      clearTimeout(persistTimer);
      persistTimer = null;
    }
    lastPersistAt = Date.now();
    await setNowPlaying(null);
    void broadcastState(true);
    return;
  }

  const now = Date.now();
  const due = force || now - lastPersistAt >= 400;
  if (!due) {
    if (persistTimer == null) {
      persistTimer = setTimeout(() => {
        persistTimer = null;
        if (cachedNow) {
          lastPersistAt = Date.now();
          void setNowPlaying(cachedNow).then(() => broadcastState(true));
        }
      }, 400);
    }
    return;
  }

  if (persistTimer) {
    clearTimeout(persistTimer);
    persistTimer = null;
  }
  lastPersistAt = now;
  await setNowPlaying(next);
  void broadcastState(force);
}

async function fetchForTrack(np: NowPlaying): Promise<void> {
  const token = ++fetchToken;
  await setLyrics({
    status: "loading",
    lines: [],
    fetchedFor: np.trackKey,
  });
  void broadcastState(true);

  const result = await fetchSyncedLyrics(np.title, np.artist, np.duration);
  if (token !== fetchToken) return;

  const latest = cachedNow ?? (await getNowPlaying());
  if (!latest || latest.trackKey !== np.trackKey) return;

  await setLyrics({
    status: result.status,
    lines: result.lines,
    fetchedFor: np.trackKey,
  });
  void broadcastState(true);
}

async function onTrackUpdate(
  msg: TrackUpdateMessage,
  sourceTabId: number,
): Promise<void> {
  const current = cachedNow ?? (await getNowPlaying());
  if (!isAccepted({ sourceTabId, updatedAt: msg.updatedAt }, current)) {
    return;
  }

  const key = trackKey(msg.title, msg.artist);
  if (!msg.title.trim()) {
    await persistNowPlaying(null, true);
    await setLyrics(EMPTY_LYRICS);
    void broadcastState(true);
    return;
  }

  const next: NowPlaying = {
    title: msg.title.trim(),
    artist: msg.artist.trim(),
    albumArtUrl: msg.albumArtUrl,
    duration: msg.duration,
    currentTime: msg.currentTime,
    recordedAt: msg.recordedAt,
    playing: msg.playing,
    trackKey: key,
    sourceTabId,
    updatedAt: msg.updatedAt,
  };

  const trackChanged = current?.trackKey !== key;
  await persistNowPlaying(next, true);

  if (trackChanged) {
    void fetchForTrack(next);
  } else {
    const lyrics = await getLyrics();
    if (lyrics.fetchedFor !== key) {
      void fetchForTrack(next);
    }
  }
}

async function onPlayback(
  msg: PlaybackMessage,
  sourceTabId: number,
): Promise<void> {
  const current = cachedNow ?? (await getNowPlaying());
  if (!current) return;
  if (!isAccepted({ sourceTabId, updatedAt: msg.updatedAt }, current)) {
    return;
  }

  const playingChanged = current.playing !== msg.playing;
  const seeked = Math.abs(msg.currentTime - current.currentTime) > 1.25;
  const next: NowPlaying = {
    ...current,
    currentTime: msg.currentTime,
    duration: msg.duration > 0 ? msg.duration : current.duration,
    playing: msg.playing,
    recordedAt: msg.recordedAt,
    sourceTabId,
    updatedAt: msg.updatedAt,
  };

  await persistNowPlaying(next, playingChanged || seeked);
}

async function findYtmTabIds(): Promise<number[]> {
  const ids: number[] = [];
  const current = cachedNow ?? (await getNowPlaying());
  if (current?.sourceTabId != null) ids.push(current.sourceTabId);

  try {
    const tabs = await chrome.tabs.query({ url: "https://music.youtube.com/*" });
    for (const tab of tabs) {
      if (tab.id != null && !ids.includes(tab.id)) ids.push(tab.id);
    }
  } catch {
    // ignore
  }
  return ids;
}

/** Runs in the YTM page — works even when that tab is in the background. */
function ytmTransportInPage(action: TransportAction): boolean {
  const click = (selectors: string[]): boolean => {
    for (const sel of selectors) {
      const el = document.querySelector<HTMLElement>(sel);
      if (!el) continue;
      el.click();
      return true;
    }
    return false;
  };

  const video =
    document.querySelector<HTMLVideoElement>("ytmusic-player video") ??
    document.querySelector<HTMLVideoElement>("#song-video video") ??
    document.querySelector<HTMLVideoElement>("video");

  if (action === "toggle") {
    // Prefer the media element — custom buttons often ignore clicks in background tabs
    if (video) {
      if (video.paused || video.ended) {
        void video.play().catch(() => {
          click([
            "#play-pause-button",
            "ytmusic-play-button-renderer#play-pause-button",
            '[aria-label="Play"]',
            '[title="Play"]',
          ]);
        });
      } else {
        video.pause();
      }
      return true;
    }
    return click([
      "#play-pause-button",
      "ytmusic-play-button-renderer#play-pause-button",
      '[aria-label="Play"]',
      '[aria-label="Pause"]',
      '[title="Play"]',
      '[title="Pause"]',
    ]);
  }

  if (action === "previous") {
    return click([
      "#previous-button",
      "tp-yt-paper-icon-button#previous-button",
      "ytmusic-player-bar #previous-button",
      '[aria-label="Previous"]',
      '[title="Previous"]',
    ]);
  }

  return click([
    "#next-button",
    "tp-yt-paper-icon-button#next-button",
    "ytmusic-player-bar #next-button",
    '[aria-label="Next"]',
    '[title="Next"]',
  ]);
}

async function onTransport(action: TransportAction): Promise<{ ok: boolean }> {
  const tabIds = await findYtmTabIds();

  for (const tabId of tabIds) {
    try {
      const tab = await chrome.tabs.get(tabId);
      if (tab.discarded) {
        // Revive without necessarily stealing focus first
        await chrome.tabs.update(tabId, { autoDiscardable: false });
      }

      const results = await chrome.scripting.executeScript({
        target: { tabId },
        func: ytmTransportInPage,
        args: [action],
      });

      if (results[0]?.result) {
        return { ok: true };
      }
    } catch {
      // try next tab
    }
  }
  return { ok: false };
}

chrome.runtime.onInstalled.addListener(() => {
  void seedDefaults();
});

chrome.runtime.onStartup.addListener(() => {
  void seedDefaults();
});

chrome.runtime.onMessage.addListener(
  (message: ExtensionMessage, sender, sendResponse) => {
    const run = async () => {
      if (message.type === "GET_STATE") {
        const state = await getAppState();
        if (cachedNow) state.nowPlaying = cachedNow;
        return state;
      }

      if (message.type === "SET_PREFS") {
        await setPrefs(message.prefs as Partial<Prefs>);
        void broadcastState(true);
        return { ok: true };
      }

      if (message.type === "TRANSPORT") {
        return onTransport(message.action);
      }

      const tabId = sender.tab?.id;
      if (tabId == null) return { ok: false };

      if (message.type === "TRACK_UPDATE") {
        await onTrackUpdate(message, tabId);
      } else if (message.type === "PLAYBACK") {
        await onPlayback(message, tabId);
      }
      return { ok: true };
    };

    void run().then(sendResponse).catch(() => sendResponse({ ok: false }));
    return true;
  },
);

chrome.storage.onChanged.addListener((_changes, area) => {
  if (area === "local") void broadcastState(false);
});

void (async () => {
  await seedDefaults();
  cachedNow = await getNowPlaying();
})();
