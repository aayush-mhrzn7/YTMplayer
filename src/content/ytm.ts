import type {
  ExtensionMessage,
  TransportAction,
  TransportCommandMessage,
} from "../types";

interface TrackSnapshot {
  title: string;
  artist: string;
  albumArtUrl: string;
  duration: number;
  currentTime: number;
  playing: boolean;
}

function qs<T extends Element>(root: ParentNode, selectors: string[]): T | null {
  for (const sel of selectors) {
    const el = root.querySelector<T>(sel);
    if (el) return el;
  }
  return null;
}

function textOf(el: Element | null): string {
  return el?.textContent?.replace(/\s+/g, " ").trim() ?? "";
}

function findVideo(): HTMLVideoElement | null {
  return (
    document.querySelector<HTMLVideoElement>("ytmusic-player video") ??
    document.querySelector<HTMLVideoElement>("#song-video video") ??
    document.querySelector<HTMLVideoElement>("video")
  );
}

function findPlayerBar(): Element | null {
  return (
    document.querySelector("ytmusic-player-bar") ??
    document.querySelector("ytmusic-player-bar.ytmusic-app")
  );
}

function clickControl(selectors: string[]): boolean {
  const bar = findPlayerBar() ?? document;
  for (const sel of selectors) {
    const el = bar.querySelector<HTMLElement>(sel);
    if (el) {
      el.click();
      return true;
    }
  }
  for (const sel of selectors) {
    const el = document.querySelector<HTMLElement>(sel);
    if (el) {
      el.click();
      return true;
    }
  }
  return false;
}

function applyTransport(action: TransportAction): boolean {
  const video = findVideo();

  if (action === "previous") {
    return clickControl([
      "#previous-button",
      "tp-yt-paper-icon-button#previous-button",
      "ytmusic-player-bar #previous-button",
      '[aria-label="Previous"]',
      '[title="Previous"]',
    ]);
  }

  if (action === "next") {
    return clickControl([
      "#next-button",
      "tp-yt-paper-icon-button#next-button",
      "ytmusic-player-bar #next-button",
      '[aria-label="Next"]',
      '[title="Next"]',
    ]);
  }

  // toggle — prefer <video> so it works while the tab is in the background
  if (video) {
    if (video.paused || video.ended) {
      void video.play().catch(() => undefined);
    } else {
      video.pause();
    }
    return true;
  }

  return clickControl([
    "#play-pause-button",
    "ytmusic-play-button-renderer#play-pause-button",
    "ytmusic-player-bar #play-pause-button",
    '[aria-label="Play"]',
    '[aria-label="Pause"]',
    '[title="Play"]',
    '[title="Pause"]',
  ]);
}

function readTrack(): TrackSnapshot | null {
  const bar = findPlayerBar();
  const root: ParentNode = bar ?? document;

  const titleEl = qs(root, [
    ".title.ytmusic-player-bar",
    "yt-formatted-string.title",
    ".content-info-wrapper .title",
  ]);
  const bylineEl = qs(root, [
    ".byline.ytmusic-player-bar",
    "yt-formatted-string.byline",
    ".content-info-wrapper .subtitle",
    ".byline a",
  ]);
  const imgEl = qs<HTMLImageElement>(root, [
    ".image.ytmusic-player-bar",
    "img.ytmusic-player-bar",
    ".thumbnail img",
    "img#img",
  ]);

  const title = textOf(titleEl);
  if (!title) return null;

  let artist = textOf(bylineEl);
  if (artist.includes("•")) {
    artist = artist.split("•")[0].trim();
  }

  const video = findVideo();
  const duration =
    video?.duration && Number.isFinite(video.duration) ? video.duration : 0;
  const currentTime =
    video?.currentTime && Number.isFinite(video.currentTime)
      ? video.currentTime
      : 0;
  const playing = Boolean(video && !video.paused && !video.ended);

  return {
    title,
    artist,
    albumArtUrl: imgEl?.src ?? "",
    duration,
    currentTime,
    playing,
  };
}

function send(message: ExtensionMessage): void {
  try {
    void chrome.runtime.sendMessage(message);
  } catch {
    // Extension context invalidated on reload
  }
}

let lastKey = "";
let lastPlaying: boolean | null = null;
let tickTimer: number | null = null;
let mutateTimer: number | null = null;

function emitTrackIfChanged(snap: TrackSnapshot): void {
  const key = `${snap.title}|${snap.artist}|${snap.albumArtUrl}`;
  if (key === lastKey) return;
  lastKey = key;
  const now = Date.now();
  send({
    type: "TRACK_UPDATE",
    title: snap.title,
    artist: snap.artist,
    albumArtUrl: snap.albumArtUrl,
    duration: snap.duration,
    currentTime: snap.currentTime,
    playing: snap.playing,
    recordedAt: now,
    updatedAt: now,
  });
}

function emitPlayback(snap: TrackSnapshot, force = false): void {
  if (!force && !snap.playing && lastPlaying === false) return;
  lastPlaying = snap.playing;
  const now = Date.now();
  send({
    type: "PLAYBACK",
    currentTime: snap.currentTime,
    duration: snap.duration,
    playing: snap.playing,
    recordedAt: now,
    updatedAt: now,
  });
}

function poll(forcePlayback = false): void {
  const snap = readTrack();
  if (!snap) return;
  emitTrackIfChanged(snap);
  if (forcePlayback || snap.playing) {
    emitPlayback(snap, forcePlayback);
  }
}

function bindVideo(): void {
  const video = findVideo();
  if (
    !video ||
    (video as HTMLVideoElement & { __ytmLyricsBound?: boolean }).__ytmLyricsBound
  ) {
    return;
  }
  (video as HTMLVideoElement & { __ytmLyricsBound?: boolean }).__ytmLyricsBound =
    true;

  const onTransport = () => poll(true);
  video.addEventListener("play", onTransport);
  video.addEventListener("pause", onTransport);
  video.addEventListener("seeked", onTransport);
  video.addEventListener("loadedmetadata", onTransport);
}

chrome.runtime.onMessage.addListener(
  (message: TransportCommandMessage, _sender, sendResponse) => {
    if (message?.type !== "TRANSPORT_CMD") return false;
    const ok = applyTransport(message.action);
    window.setTimeout(() => poll(true), 120);
    sendResponse({ ok });
    return false;
  },
);

function start(): void {
  poll(true);
  bindVideo();

  const observer = new MutationObserver(() => {
    if (mutateTimer != null) return;
    mutateTimer = window.setTimeout(() => {
      mutateTimer = null;
      bindVideo();
      poll(false);
    }, 300);
  });
  observer.observe(document.documentElement, {
    childList: true,
    subtree: true,
  });

  if (tickTimer != null) window.clearInterval(tickTimer);
  tickTimer = window.setInterval(() => {
    const snap = readTrack();
    if (!snap) return;
    emitTrackIfChanged(snap);
    if (snap.playing) emitPlayback(snap);
  }, 250);
}

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", start);
} else {
  start();
}
