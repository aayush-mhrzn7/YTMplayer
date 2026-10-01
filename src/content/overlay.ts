import overlayCss from "./overlay.css";
import { activeLineIndex } from "../lib/lrc-parse";
import type {
  AppState,
  LyricsState,
  NowPlaying,
  Prefs,
  StatePushMessage,
} from "../types";
import { DEFAULT_PREFS, EMPTY_LYRICS } from "../types";

const INJECT_FLAG = "__ytmLyricsOverlayInjected";
const HOST_ID = "ytm-lyrics-overlay-host";

type InjectHandle = { alive: () => boolean };

function claimInjection(): boolean {
  const w = window as unknown as Record<string, InjectHandle | undefined>;
  const prev = w[INJECT_FLAG];
  if (prev) {
    try {
      if (prev.alive()) return false;
    } catch {
      // Prior inject died (extension reloaded)
    }
  }
  w[INJECT_FLAG] = {
    alive: () => {
      try {
        return Boolean(chrome.runtime?.id);
      } catch {
        return false;
      }
    },
  };
  return true;
}

interface DragState {
  pointerId: number;
  startX: number;
  startY: number;
  origLeft: number;
  origTop: number;
}

let host: HTMLElement | null = null;
let panel: HTMLElement | null = null;
let peek: HTMLButtonElement | null = null;
let artEl: HTMLImageElement | null = null;
let titleEl: HTMLElement | null = null;
let artistEl: HTMLElement | null = null;
let playToggleEl: HTMLButtonElement | null = null;
let transportEl: HTMLElement | null = null;
let lyricsEl: HTMLElement | null = null;
let prevEl: HTMLElement | null = null;
let activeEl: HTMLElement | null = null;
let nextEl: HTMLElement | null = null;

let prefs: Prefs = { ...DEFAULT_PREFS };
let nowPlaying: NowPlaying | null = null;
let lyrics: LyricsState = EMPTY_LYRICS;
let lastActive = -1;
let lastTrackKey = "";
let lastLyricsToken = "";
let raf = 0;
let drag: DragState | null = null;
let swapTimer: number | null = null;
let lastPosKey = "";

function ensureHost(): void {
  if (host && document.documentElement.contains(host)) return;

  document.getElementById(HOST_ID)?.remove();

  host = document.createElement("div");
  host.id = HOST_ID;
  host.style.cssText =
    "all:initial;position:fixed;inset:0;width:0;height:0;overflow:visible;pointer-events:none;z-index:2147483646;";
  const shadow = host.attachShadow({ mode: "open" });

  const style = document.createElement("style");
  style.textContent = overlayCss as string;
  shadow.appendChild(style);

  panel = document.createElement("div");
  panel.className = "panel";
  panel.innerHTML = `
    <div class="header">
      <img class="art" alt="" width="40" height="40" />
      <div class="meta">
        <div class="title"></div>
        <div class="artist"></div>
      </div>
      <div class="actions">
        <button class="btn minimize" type="button" title="Minimize" aria-label="Minimize">–</button>
        <button class="btn close" type="button" title="Close" aria-label="Close">×</button>
      </div>
    </div>
    <div class="lyrics">
      <div class="lyrics-view">
        <div class="line prev empty"></div>
        <div class="line active empty"></div>
        <div class="line next empty"></div>
      </div>
    </div>
    <div class="transport" hidden>
      <button class="btn transport-btn prev-track" type="button" title="Previous" aria-label="Previous">⏮</button>
      <button class="btn transport-btn play-toggle" type="button" title="Play/Pause" aria-label="Play/Pause">▶</button>
      <button class="btn transport-btn next-track" type="button" title="Next" aria-label="Next">⏭</button>
    </div>
  `;

  peek = document.createElement("button");
  peek.className = "peek";
  peek.type = "button";
  peek.textContent = "lyrics";
  peek.setAttribute("title", "Show lyrics");

  shadow.appendChild(panel);
  shadow.appendChild(peek);
  document.documentElement.appendChild(host);

  artEl = panel.querySelector(".art");
  titleEl = panel.querySelector(".title");
  artistEl = panel.querySelector(".artist");
  playToggleEl = panel.querySelector(".play-toggle");
  transportEl = panel.querySelector(".transport");
  lyricsEl = panel.querySelector(".lyrics");
  prevEl = panel.querySelector(".line.prev");
  activeEl = panel.querySelector(".line.active");
  nextEl = panel.querySelector(".line.next");

  const header = panel.querySelector(".header") as HTMLElement;
  header.addEventListener("pointerdown", onDragStart);
  panel.querySelector(".minimize")?.addEventListener("click", () => {
    void setPrefs({ widgetMinimized: true });
  });
  panel.querySelector(".close")?.addEventListener("click", () => {
    void setPrefs({ widgetClosed: true });
  });
  panel.querySelector(".prev-track")?.addEventListener("click", (e) => {
    e.stopPropagation();
    sendTransport("previous");
  });
  panel.querySelector(".next-track")?.addEventListener("click", (e) => {
    e.stopPropagation();
    sendTransport("next");
  });
  playToggleEl?.addEventListener("click", (e) => {
    e.stopPropagation();
    if (nowPlaying) {
      nowPlaying = { ...nowPlaying, playing: !nowPlaying.playing };
      renderTransport();
    }
    sendTransport("toggle");
  });
  peek.addEventListener("click", () => {
    void setPrefs({ widgetMinimized: false });
  });
}

function setPrefs(partial: Partial<Prefs>): void {
  try {
    void chrome.runtime.sendMessage({ type: "SET_PREFS", prefs: partial });
  } catch {
    // Extension context invalidated
  }
}

function sendTransport(action: "toggle" | "next" | "previous"): void {
  try {
    void chrome.runtime.sendMessage({ type: "TRANSPORT", action });
  } catch {
    // Extension context invalidated
  }
}

function onDragStart(e: PointerEvent): void {
  if (!panel) return;
  const target = e.target as HTMLElement;
  if (target.closest(".btn") || target.closest(".transport")) return;

  const rect = panel.getBoundingClientRect();
  panel.style.left = `${rect.left}px`;
  panel.style.top = `${rect.top}px`;
  panel.style.right = "auto";
  panel.style.bottom = "auto";

  drag = {
    pointerId: e.pointerId,
    startX: e.clientX,
    startY: e.clientY,
    origLeft: rect.left,
    origTop: rect.top,
  };
  (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
  window.addEventListener("pointermove", onDragMove);
  window.addEventListener("pointerup", onDragEnd);
  window.addEventListener("pointercancel", onDragEnd);
}

function onDragMove(e: PointerEvent): void {
  if (!drag || !panel || e.pointerId !== drag.pointerId) return;
  const dx = e.clientX - drag.startX;
  const dy = e.clientY - drag.startY;
  const w = panel.offsetWidth;
  const h = panel.offsetHeight;
  const left = Math.min(
    Math.max(8, drag.origLeft + dx),
    window.innerWidth - w - 8,
  );
  const top = Math.min(
    Math.max(8, drag.origTop + dy),
    window.innerHeight - h - 8,
  );
  panel.style.left = `${left}px`;
  panel.style.top = `${top}px`;
}

function positionKey(left: number | null, top: number | null): string {
  return `${left ?? "d"}|${top ?? "d"}`;
}

function clampPanelPosition(left: number, top: number): { left: number; top: number } {
  if (!panel) return { left, top };
  const w = panel.offsetWidth || 320;
  const h = panel.offsetHeight || 200;
  return {
    left: Math.min(Math.max(8, left), window.innerWidth - w - 8),
    top: Math.min(Math.max(8, top), window.innerHeight - h - 8),
  };
}

function applyPanelPosition(): void {
  if (!panel || drag) return;

  const key = positionKey(prefs.widgetLeft, prefs.widgetTop);
  if (key === lastPosKey) return;
  lastPosKey = key;

  if (prefs.widgetLeft != null && prefs.widgetTop != null) {
    const { left, top } = clampPanelPosition(prefs.widgetLeft, prefs.widgetTop);
    panel.style.left = `${left}px`;
    panel.style.top = `${top}px`;
    panel.style.right = "auto";
    panel.style.bottom = "auto";
  } else {
    panel.style.left = "";
    panel.style.top = "";
    panel.style.right = "";
    panel.style.bottom = "";
  }
}

function onDragEnd(e: PointerEvent): void {
  if (!drag || e.pointerId !== drag.pointerId) return;
  drag = null;
  window.removeEventListener("pointermove", onDragMove);
  window.removeEventListener("pointerup", onDragEnd);
  window.removeEventListener("pointercancel", onDragEnd);

  if (!panel) return;
  const rect = panel.getBoundingClientRect();
  const left = Math.round(rect.left);
  const top = Math.round(rect.top);
  prefs = { ...prefs, widgetLeft: left, widgetTop: top };
  lastPosKey = positionKey(left, top);
  setPrefs({ widgetLeft: left, widgetTop: top });
}

function visible(): boolean {
  return prefs.enabled && !prefs.widgetClosed && Boolean(nowPlaying?.title);
}

function applyVisibility(): void {
  ensureHost();
  if (!host || !panel || !peek) return;

  if (!visible()) {
    host.style.pointerEvents = "none";
    panel.style.display = "none";
    peek.classList.remove("visible");
    return;
  }

  host.style.pointerEvents = "none";
  panel.style.display = "flex";

  if (prefs.widgetMinimized) {
    panel.classList.add("minimized");
    peek.classList.add("visible");
    peek.style.pointerEvents = "auto";
  } else {
    panel.classList.remove("minimized");
    peek.classList.remove("visible");
    panel.style.pointerEvents = "auto";
  }

  renderTransportVisibility();
  applyPanelPosition();
}

function renderTransportVisibility(): void {
  if (!transportEl) return;
  transportEl.hidden = !prefs.transportEnabled;
}

function renderHeader(): void {
  if (!nowPlaying || !artEl || !titleEl || !artistEl) return;
  titleEl.textContent = nowPlaying.title;
  artistEl.textContent = nowPlaying.artist || "Unknown artist";
  if (nowPlaying.albumArtUrl) {
    if (artEl.getAttribute("src") !== nowPlaying.albumArtUrl) {
      artEl.src = nowPlaying.albumArtUrl;
    }
    artEl.style.visibility = "visible";
  } else {
    artEl.removeAttribute("src");
    artEl.style.visibility = "hidden";
  }
  renderTransport();
}

function renderTransport(): void {
  if (!playToggleEl) return;
  const playing = Boolean(nowPlaying?.playing);
  playToggleEl.textContent = playing ? "⏸" : "▶";
  playToggleEl.title = playing ? "Pause" : "Play";
  playToggleEl.setAttribute("aria-label", playing ? "Pause" : "Play");
}

function lyricsToken(state: LyricsState): string {
  return `${state.status}|${state.fetchedFor}|${state.lines.length}`;
}

function showStatus(message: string): void {
  if (!lyricsEl) return;
  lyricsEl.innerHTML = `<div class="status">${message}</div>`;
  prevEl = activeEl = nextEl = null;
}

function ensureTriple(): void {
  if (!lyricsEl) return;
  if (prevEl && activeEl && nextEl && lyricsEl.contains(activeEl)) return;

  lyricsEl.innerHTML = `
    <div class="lyrics-view">
      <div class="line prev empty"></div>
      <div class="line active empty"></div>
      <div class="line next empty"></div>
    </div>
  `;
  prevEl = lyricsEl.querySelector(".line.prev");
  activeEl = lyricsEl.querySelector(".line.active");
  nextEl = lyricsEl.querySelector(".line.next");
  lastActive = -1;
}

function renderLyricsShell(): void {
  if (!lyricsEl) return;
  lastActive = -1;
  lastLyricsToken = lyricsToken(lyrics);

  if (lyrics.status === "loading") {
    showStatus("Loading lyrics…");
    return;
  }
  if (lyrics.status === "instrumental") {
    showStatus("Instrumental");
    return;
  }
  if (lyrics.status === "not_found" || !lyrics.lines.length) {
    showStatus("Lyrics not found");
    return;
  }

  ensureTriple();
  paintLines(activeLineIndex(lyrics.lines, estimatedTime()), false);
}

function setLine(el: HTMLElement | null, text: string | undefined): void {
  if (!el) return;
  const value = text?.trim() ? text : "";
  el.textContent = value;
  el.classList.toggle("empty", !value);
}

function paintLines(idx: number, animate: boolean): void {
  if (!prevEl || !activeEl || !nextEl) return;
  if (idx < 0) {
    setLine(prevEl, "");
    setLine(activeEl, "");
    setLine(nextEl, lyrics.lines[0]?.text);
    return;
  }

  const apply = () => {
    setLine(prevEl, lyrics.lines[idx - 1]?.text);
    setLine(activeEl, lyrics.lines[idx]?.text);
    setLine(nextEl, lyrics.lines[idx + 1]?.text);
  };

  if (!animate) {
    apply();
    return;
  }

  if (swapTimer != null) window.clearTimeout(swapTimer);
  for (const el of [prevEl, activeEl, nextEl]) {
    el.classList.add("swap");
  }
  swapTimer = window.setTimeout(() => {
    apply();
    for (const el of [prevEl, activeEl, nextEl]) {
      el?.classList.remove("swap");
    }
    swapTimer = null;
  }, 90);
}

function estimatedTime(): number {
  if (!nowPlaying) return 0;
  const base = nowPlaying.currentTime;
  if (!nowPlaying.playing) return base;
  return base + Math.max(0, (Date.now() - nowPlaying.recordedAt) / 1000);
}

function tick(): void {
  raf = requestAnimationFrame(tick);
  if (!visible() || prefs.widgetMinimized) return;
  if (lyrics.status !== "ready" || !lyrics.lines.length) return;
  if (!prevEl || !activeEl || !nextEl) return;

  const idx = activeLineIndex(lyrics.lines, estimatedTime());
  if (idx === lastActive) return;
  const shouldAnimate = lastActive >= 0;
  lastActive = idx;
  paintLines(idx, shouldAnimate);
}

function onTrackOrVisibility(): void {
  applyVisibility();
  if (!visible()) return;
  renderHeader();
}

function applyState(state: AppState): void {
  const prevKey = nowPlaying?.trackKey ?? "";
  const wasPlaying = nowPlaying?.playing;
  const prevLyricsToken = lastLyricsToken;
  const prevPosKey = positionKey(prefs.widgetLeft, prefs.widgetTop);

  prefs = state.prefs;
  nowPlaying = state.nowPlaying;
  lyrics = state.lyrics;
  const posChanged =
    positionKey(prefs.widgetLeft, prefs.widgetTop) !== prevPosKey;

  const nextKey = nowPlaying?.trackKey ?? "";
  const trackChanged = nextKey !== prevKey || nextKey !== lastTrackKey;
  lastTrackKey = nextKey;

  onTrackOrVisibility();
  if (posChanged) applyPanelPosition();

  const token = lyricsToken(lyrics);
  if (trackChanged || token !== prevLyricsToken) {
    if (visible()) renderLyricsShell();
    else lastLyricsToken = token;
  } else if (visible() && nowPlaying && nowPlaying.playing !== wasPlaying) {
    renderTransport();
  }
}

async function loadAll(): Promise<void> {
  try {
    const state = (await chrome.runtime.sendMessage({
      type: "GET_STATE",
    })) as AppState | undefined;
    if (!state) return;
    applyState({
      prefs: state.prefs ?? { ...DEFAULT_PREFS },
      nowPlaying: state.nowPlaying ?? null,
      lyrics: state.lyrics ?? EMPTY_LYRICS,
    });
  } catch {
    // Extension context invalidated / SW asleep
  }
}

if (claimInjection()) {
  chrome.runtime.onMessage.addListener((message: StatePushMessage) => {
    if (message?.type !== "STATE_PUSH") return;
    applyState({
      prefs: message.prefs,
      nowPlaying: message.nowPlaying,
      lyrics: message.lyrics,
    });
  });

  void loadAll();
  raf = requestAnimationFrame(tick);
}
