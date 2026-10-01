import { sampleAccentRgb } from "./lib/album-color";
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
    accentRgb:
      current?.trackKey === key && current.albumArtUrl === msg.albumArtUrl
        ? current.accentRgb
        : null,
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

  void refreshAccent(next);
}

async function refreshAccent(np: NowPlaying): Promise<void> {
  if (!np.albumArtUrl) return;
  if (np.accentRgb) return;
  const rgb = await sampleAccentRgb(np.albumArtUrl);
  const latest = cachedNow ?? (await getNowPlaying());
  if (!latest || latest.trackKey !== np.trackKey) return;
  if (latest.albumArtUrl !== np.albumArtUrl) return;
  if (latest.accentRgb === rgb) return;
  const updated: NowPlaying = { ...latest, accentRgb: rgb };
  await persistNowPlaying(updated, true);
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

/** Runs in the YTM page MAIN world so playerApi_ works in background tabs. */
function ytmTransportInPage(
  action: TransportAction,
  time?: number | null,
): boolean {
  type PlayerApi = {
    nextVideo?: () => void;
    previousVideo?: () => void;
    playVideo?: () => void;
    pauseVideo?: () => void;
    getPlayerState?: () => number;
    seekTo?: (seconds: number, allowSeekAhead?: boolean) => void;
  };

  const clickInBar = (selectors: string[]): boolean => {
    const bar =
      document.querySelector("ytmusic-player-bar") ??
      document.querySelector("ytmusic-player-bar.ytmusic-app");
    const roots: ParentNode[] = bar ? [bar, document] : [document];
    for (const root of roots) {
      for (const sel of selectors) {
        const el = root.querySelector<HTMLElement>(sel);
        if (!el) continue;
        el.click();
        return true;
      }
    }
    return false;
  };

  const getApi = (): PlayerApi | null => {
    const bar = document.querySelector(
      "ytmusic-player-bar",
    ) as (HTMLElement & { playerApi_?: PlayerApi }) | null;
    if (bar?.playerApi_) return bar.playerApi_;

    const player = document.querySelector(
      "ytmusic-player",
    ) as (HTMLElement & { playerApi_?: PlayerApi; player_?: PlayerApi }) | null;
    if (player?.playerApi_) return player.playerApi_;
    if (player?.player_) return player.player_;
    return null;
  };

  const video =
    document.querySelector<HTMLVideoElement>("ytmusic-player video") ??
    document.querySelector<HTMLVideoElement>("#song-video video") ??
    document.querySelector<HTMLVideoElement>("video");

  const api = getApi();

  if (action === "seek") {
    if (time == null || !Number.isFinite(time)) return false;
    const target = Math.max(0, time);
    if (video) {
      const max =
        video.duration && Number.isFinite(video.duration)
          ? video.duration
          : target;
      video.currentTime = Math.min(target, max);
      return true;
    }
    if (typeof api?.seekTo === "function") {
      api.seekTo(target, true);
      return true;
    }
    return false;
  }

  if (action === "toggle") {
    // HTMLMediaElement works while the tab is in the background
    if (video) {
      if (video.paused || video.ended) {
        void video.play().catch(() => {
          if (typeof api?.playVideo === "function") api.playVideo();
          else {
            clickInBar([
              "#play-pause-button",
              ".play-pause-button",
              "ytmusic-play-button-renderer#play-pause-button",
              '[aria-label="Play"]',
              '[title="Play"]',
            ]);
          }
        });
      } else {
        video.pause();
      }
      return true;
    }
    if (typeof api?.getPlayerState === "function") {
      const state = api.getPlayerState();
      if (state === 1 && typeof api.pauseVideo === "function") {
        api.pauseVideo();
        return true;
      }
      if (typeof api.playVideo === "function") {
        api.playVideo();
        return true;
      }
    }
    return clickInBar([
      "#play-pause-button",
      ".play-pause-button",
      "ytmusic-play-button-renderer#play-pause-button",
      '[aria-label="Play"]',
      '[aria-label="Pause"]',
      '[title="Play"]',
      '[title="Pause"]',
    ]);
  }

  if (action === "previous") {
    if (typeof api?.previousVideo === "function") {
      api.previousVideo();
      return true;
    }
    return clickInBar([
      ".previous-button",
      "#previous-button",
      "tp-yt-paper-icon-button.previous-button",
      '[aria-label="Previous"]',
      '[title="Previous"]',
    ]);
  }

  if (typeof api?.nextVideo === "function") {
    api.nextVideo();
    return true;
  }
  return clickInBar([
    ".next-button",
    "#next-button",
    "tp-yt-paper-icon-button.next-button",
    '[aria-label="Next"]',
    '[title="Next"]',
  ]);
}

async function onTransport(
  action: TransportAction,
  time?: number,
): Promise<{ ok: boolean }> {
  const tabIds = await findYtmTabIds();

  for (const tabId of tabIds) {
    try {
      const tab = await chrome.tabs.get(tabId);
      if (tab.discarded) {
        await chrome.tabs.update(tabId, { autoDiscardable: false });
      }

      // MAIN world can reach YTM's playerApi_ (isolated world cannot)
      const results = await chrome.scripting.executeScript({
        target: { tabId },
        world: "MAIN",
        func: ytmTransportInPage,
        args: [action, time ?? null],
      });

      if (results[0]?.result) {
        return { ok: true };
      }
    } catch {
      // try next tab
    }

    // Fallback: content-script click path
    try {
      const res = (await chrome.tabs.sendMessage(tabId, {
        type: "TRANSPORT_CMD",
        action,
        time,
      })) as { ok?: boolean } | undefined;
      if (res?.ok) return { ok: true };
    } catch {
      // try next tab
    }
  }
  return { ok: false };
}

function isYtmUrl(url: string | undefined): boolean {
  if (!url) return false;
  try {
    const parsed = new URL(url);
    return parsed.hostname === "music.youtube.com";
  } catch {
    return false;
  }
}

async function clearPlayback(): Promise<void> {
  fetchToken += 1;
  await persistNowPlaying(null, true);
  await setLyrics(EMPTY_LYRICS);
  void broadcastState(true);
}

/** Hide overlays when the YTM source tab is gone or no longer on music.youtube.com. */
async function clearIfSourceGone(removedTabId?: number): Promise<void> {
  const current = cachedNow ?? (await getNowPlaying());
  if (!current) return;

  if (removedTabId != null && removedTabId === current.sourceTabId) {
    await clearPlayback();
    return;
  }

  try {
    const tab = await chrome.tabs.get(current.sourceTabId);
    if (!isYtmUrl(tab.url)) {
      await clearPlayback();
    }
  } catch {
    // Tab no longer exists
    await clearPlayback();
  }
}

chrome.tabs.onRemoved.addListener((tabId) => {
  void clearIfSourceGone(tabId);
});

chrome.tabs.onUpdated.addListener((tabId, changeInfo) => {
  if (changeInfo.url == null) return;
  void (async () => {
    const current = cachedNow ?? (await getNowPlaying());
    if (!current || current.sourceTabId !== tabId) return;
    if (!isYtmUrl(changeInfo.url)) {
      await clearPlayback();
    }
  })();
});

/** Inject content scripts into tabs already open before install/update. */
async function injectIntoExistingTabs(): Promise<void> {
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
        await chrome.scripting.executeScript({
          target: { tabId: tab.id },
          files: ["content/overlay.js"],
        });
        if (isYtmUrl(tab.url)) {
          await chrome.scripting.executeScript({
            target: { tabId: tab.id },
            files: ["content/ytm.js"],
          });
        }
      } catch {
        // Restricted pages, discarded tabs, no host access, etc.
      }
    }),
  );
}

chrome.runtime.onInstalled.addListener((details) => {
  void (async () => {
    await seedDefaults();
    if (details.reason === "install" || details.reason === "update") {
      await injectIntoExistingTabs();
    }
  })();
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
        return onTransport(message.action, message.time);
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
  await clearIfSourceGone();
})();
