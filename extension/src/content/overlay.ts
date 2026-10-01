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
  origBottom: number;
  moved: boolean;
}

let host: HTMLElement | null = null;
let panel: HTMLElement | null = null;
let artEl: HTMLImageElement | null = null;
let titleEl: HTMLElement | null = null;
let artistEl: HTMLElement | null = null;
let playToggleEl: HTMLButtonElement | null = null;
let minimizeEl: HTMLButtonElement | null = null;
let shuffleEl: HTMLButtonElement | null = null;
let repeatEl: HTMLButtonElement | null = null;
let transportEl: HTMLElement | null = null;
let seekEl: HTMLInputElement | null = null;
let timeCurrentEl: HTMLElement | null = null;
let timeDurationEl: HTMLElement | null = null;
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
let scrubbing = false;

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
      <img class="art" alt="" width="40" height="40" title="Open YouTube Music tab" aria-label="Open YouTube Music tab" role="button" tabindex="0" />
      <div class="meta">
        <div class="title"></div>
        <div class="artist"></div>
      </div>
      <div class="actions">
        <button class="btn minimize" type="button" title="Minimize" aria-label="Minimize">–</button>
        <button class="btn close" type="button" title="Close" aria-label="Close">×</button>
      </div>
    </div>
    <div class="panel-body">
      <div class="panel-body-inner">
        <div class="lyrics">
          <div class="lyrics-view">
            <div class="line prev empty"></div>
            <div class="line active empty"></div>
            <div class="line next empty"></div>
          </div>
        </div>
        <div class="transport" hidden>
          <div class="seek-row">
            <span class="time current">0:00</span>
            <input
              class="seek"
              type="range"
              min="0"
              max="0"
              value="0"
              step="0.1"
              aria-label="Seek"
            />
            <span class="time duration">0:00</span>
          </div>
          <div class="transport-controls">
            <button class="btn transport-btn shuffle" type="button" title="Shuffle" aria-label="Shuffle">⇄</button>
            <button class="btn transport-btn prev-track" type="button" title="Previous" aria-label="Previous">⏮</button>
            <button class="btn transport-btn seek-back" type="button" title="Back 5 seconds" aria-label="Back 5 seconds">−5</button>
            <button class="btn transport-btn play-toggle" type="button" title="Play/Pause" aria-label="Play/Pause">▶</button>
            <button class="btn transport-btn seek-fwd" type="button" title="Forward 5 seconds" aria-label="Forward 5 seconds">+5</button>
            <button class="btn transport-btn next-track" type="button" title="Next" aria-label="Next">⏭</button>
            <button class="btn transport-btn repeat" type="button" title="Repeat" aria-label="Repeat">⟳</button>
          </div>
        </div>
      </div>
    </div>
  `;

  shadow.appendChild(panel);
  document.documentElement.appendChild(host);

  artEl = panel.querySelector(".art");
  titleEl = panel.querySelector(".title");
  artistEl = panel.querySelector(".artist");
  playToggleEl = panel.querySelector(".play-toggle");
  minimizeEl = panel.querySelector(".minimize");
  shuffleEl = panel.querySelector(".shuffle");
  repeatEl = panel.querySelector(".repeat");
  transportEl = panel.querySelector(".transport");
  seekEl = panel.querySelector(".seek");
  timeCurrentEl = panel.querySelector(".time.current");
  timeDurationEl = panel.querySelector(".time.duration");
  lyricsEl = panel.querySelector(".lyrics");
  prevEl = panel.querySelector(".line.prev");
  activeEl = panel.querySelector(".line.active");
  nextEl = panel.querySelector(".line.next");

  const header = panel.querySelector(".header") as HTMLElement;
  header.addEventListener("pointerdown", onDragStart);
  artEl?.addEventListener("click", (e) => {
    e.stopPropagation();
    void chrome.runtime.sendMessage({ type: "FOCUS_SOURCE_TAB" });
  });
  artEl?.addEventListener("keydown", (e) => {
    if (e.key !== "Enter" && e.key !== " ") return;
    e.preventDefault();
    e.stopPropagation();
    void chrome.runtime.sendMessage({ type: "FOCUS_SOURCE_TAB" });
  });
  minimizeEl?.addEventListener("click", (e) => {
    e.stopPropagation();
    const nextMinimized = !prefs.widgetMinimized;
    // Manual minimize pins; maximize clears the pin so auto can work again
    void setPrefs({
      widgetMinimized: nextMinimized,
      minimizePinned: nextMinimized,
    });
  });
  panel.querySelector(".close")?.addEventListener("click", () => {
    // Close = turn overlay off (popup checkbox unchecks via storage)
    void setPrefs({
      enabled: false,
      widgetClosed: false,
      widgetMinimized: false,
      minimizePinned: false,
    });
  });
  panel.querySelector(".prev-track")?.addEventListener("click", (e) => {
    e.stopPropagation();
    sendTransport("previous");
  });
  panel.querySelector(".next-track")?.addEventListener("click", (e) => {
    e.stopPropagation();
    sendTransport("next");
  });
  panel.querySelector(".seek-back")?.addEventListener("click", (e) => {
    e.stopPropagation();
    seekBy(-5);
  });
  panel.querySelector(".seek-fwd")?.addEventListener("click", (e) => {
    e.stopPropagation();
    seekBy(5);
  });
  shuffleEl?.addEventListener("click", (e) => {
    e.stopPropagation();
    sendTransport("shuffle");
  });
  repeatEl?.addEventListener("click", (e) => {
    e.stopPropagation();
    sendTransport("repeat");
  });
  playToggleEl?.addEventListener("click", (e) => {
    e.stopPropagation();
    if (nowPlaying) {
      nowPlaying = { ...nowPlaying, playing: !nowPlaying.playing };
      renderTransport();
    }
    sendTransport("toggle");
  });
  bindSeek();
}

function setPrefs(partial: Partial<Prefs>): void {
  try {
    void chrome.runtime.sendMessage({ type: "SET_PREFS", prefs: partial });
  } catch {
    // Extension context invalidated
  }
}

function sendTransport(
  action: "toggle" | "next" | "previous" | "seek" | "shuffle" | "repeat",
  time?: number,
): void {
  try {
    void chrome.runtime.sendMessage({ type: "TRANSPORT", action, time });
  } catch {
    // Extension context invalidated
  }
}

function formatTime(seconds: number): string {
  if (!Number.isFinite(seconds) || seconds < 0) return "0:00";
  const total = Math.floor(seconds);
  const m = Math.floor(total / 60);
  const s = total % 60;
  return `${m}:${s.toString().padStart(2, "0")}`;
}

function applyLocalSeek(t: number): void {
  if (!Number.isFinite(t)) return;
  const duration = nowPlaying?.duration ?? 0;
  const clamped =
    duration > 0 ? Math.max(0, Math.min(t, duration)) : Math.max(0, t);

  if (nowPlaying) {
    nowPlaying = {
      ...nowPlaying,
      currentTime: clamped,
      recordedAt: Date.now(),
    };
    if (
      lyrics.status === "ready" &&
      lyrics.lines.length &&
      prevEl &&
      activeEl &&
      nextEl
    ) {
      const idx = activeLineIndex(lyrics.lines, clamped);
      lastActive = idx;
      paintLines(idx, false);
    }
  }
  renderProgress();
  sendTransport("seek", clamped);
}

function seekBy(delta: number): void {
  if (scrubbing) return;
  applyLocalSeek(estimatedTime() + delta);
}

function bindSeek(): void {
  if (!seekEl) return;

  const onScrubStart = () => {
    scrubbing = true;
  };
  const onScrubMove = () => {
    if (!scrubbing || !seekEl) return;
    const t = Number(seekEl.value);
    if (timeCurrentEl) timeCurrentEl.textContent = formatTime(t);
    paintSeekFill(t, Number(seekEl.max) || 0);
  };
  const onScrubEnd = () => {
    if (!seekEl) return;
    const t = Number(seekEl.value);
    scrubbing = false;
    applyLocalSeek(t);
  };

  seekEl.addEventListener("pointerdown", onScrubStart);
  seekEl.addEventListener("input", onScrubMove);
  seekEl.addEventListener("change", onScrubEnd);
  seekEl.addEventListener("pointercancel", () => {
    scrubbing = false;
    renderProgress();
  });
}

function paintSeekFill(current: number, duration: number): void {
  if (!seekEl) return;
  const pct =
    duration > 0 ? Math.min(100, Math.max(0, (current / duration) * 100)) : 0;
  seekEl.style.setProperty("--seek-pct", `${pct}%`);
}

function renderProgress(): void {
  if (!seekEl || !timeCurrentEl || !timeDurationEl) return;
  if (scrubbing) return;

  const duration = nowPlaying?.duration ?? 0;
  const current = duration > 0 ? Math.min(estimatedTime(), duration) : 0;

  seekEl.max = String(duration > 0 ? duration : 0);
  seekEl.value = String(current);
  seekEl.disabled = !(duration > 0);
  timeCurrentEl.textContent = formatTime(current);
  timeDurationEl.textContent = formatTime(duration);
  paintSeekFill(current, duration);
}

function onDragStart(e: PointerEvent): void {
  if (!panel) return;
  const target = e.target as HTMLElement;
  if (
    target.closest(".btn") ||
    target.closest(".transport") ||
    target.closest(".art")
  ) {
    return;
  }

  const rect = panel.getBoundingClientRect();
  const bottom = window.innerHeight - rect.bottom;
  panel.style.left = `${rect.left}px`;
  panel.style.bottom = `${bottom}px`;
  panel.style.right = "auto";
  panel.style.top = "auto";

  drag = {
    pointerId: e.pointerId,
    startX: e.clientX,
    startY: e.clientY,
    origLeft: rect.left,
    origBottom: bottom,
    moved: false,
  };
  (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
  window.addEventListener("pointermove", onDragMove);
  window.addEventListener("pointerup", onDragEnd);
  window.addEventListener("pointercancel", onDragEnd);
}

const DRAG_THRESHOLD_PX = 5;

function onDragMove(e: PointerEvent): void {
  if (!drag || !panel || e.pointerId !== drag.pointerId) return;
  const dx = e.clientX - drag.startX;
  const dy = e.clientY - drag.startY;
  if (!drag.moved && dx * dx + dy * dy < DRAG_THRESHOLD_PX * DRAG_THRESHOLD_PX) {
    return;
  }
  drag.moved = true;
  const w = panel.offsetWidth;
  const h = panel.offsetHeight;
  const left = Math.min(
    Math.max(8, drag.origLeft + dx),
    window.innerWidth - w - 8,
  );
  // Dragging down (dy > 0) decreases bottom inset
  const bottom = Math.min(
    Math.max(8, drag.origBottom - dy),
    window.innerHeight - h - 8,
  );
  panel.style.left = `${left}px`;
  panel.style.bottom = `${bottom}px`;
  panel.style.top = "auto";
  panel.style.right = "auto";
}

function positionKey(left: number | null, bottom: number | null): string {
  return `${left ?? "d"}|${bottom ?? "d"}`;
}

function clampPanelPosition(
  left: number,
  bottom: number,
): { left: number; bottom: number } {
  if (!panel) return { left, bottom };
  const w = panel.offsetWidth || 320;
  const h = panel.offsetHeight || 200;
  return {
    left: Math.min(Math.max(8, left), window.innerWidth - w - 8),
    bottom: Math.min(Math.max(8, bottom), window.innerHeight - h - 8),
  };
}

function applyPanelPosition(): void {
  if (!panel || drag) return;

  const key = positionKey(prefs.widgetLeft, prefs.widgetBottom);
  if (key === lastPosKey) return;
  lastPosKey = key;

  if (prefs.widgetLeft != null && prefs.widgetBottom != null) {
    const { left, bottom } = clampPanelPosition(
      prefs.widgetLeft,
      prefs.widgetBottom,
    );
    panel.style.left = `${left}px`;
    panel.style.bottom = `${bottom}px`;
    panel.style.right = "auto";
    panel.style.top = "auto";
  } else {
    panel.style.left = "";
    panel.style.top = "";
    panel.style.right = "";
    panel.style.bottom = "";
  }
}

function onDragEnd(e: PointerEvent): void {
  if (!drag || e.pointerId !== drag.pointerId) return;
  const wasClick = !drag.moved;
  drag = null;
  window.removeEventListener("pointermove", onDragMove);
  window.removeEventListener("pointerup", onDragEnd);
  window.removeEventListener("pointercancel", onDragEnd);

  if (!panel) return;

  // Tap header while minimized → expand (same as maximize)
  if (wasClick && prefs.widgetMinimized) {
    prefs = { ...prefs, widgetMinimized: false, minimizePinned: false };
    void setPrefs({ widgetMinimized: false, minimizePinned: false });
    applyVisibility();
    return;
  }

  const rect = panel.getBoundingClientRect();
  const left = Math.round(rect.left);
  const bottom = Math.round(window.innerHeight - rect.bottom);
  prefs = { ...prefs, widgetLeft: left, widgetBottom: bottom };
  lastPosKey = positionKey(left, bottom);
  setPrefs({ widgetLeft: left, widgetBottom: bottom });
}

function visible(): boolean {
  return prefs.enabled && !prefs.widgetClosed && Boolean(nowPlaying?.title);
}

function applyVisibility(): void {
  ensureHost();
  if (!host || !panel) return;

  if (!visible()) {
    host.style.pointerEvents = "none";
    panel.style.display = "none";
    return;
  }

  host.style.pointerEvents = "none";
  panel.style.display = "flex";
  panel.style.pointerEvents = "auto";
  panel.classList.toggle("minimized", prefs.widgetMinimized);
  renderMinimizeButton();
  renderTransportVisibility();
  applyPanelPosition();
}

function renderMinimizeButton(): void {
  if (!minimizeEl) return;
  const minimized = prefs.widgetMinimized;
  minimizeEl.textContent = minimized ? "+" : "–";
  minimizeEl.title = minimized ? "Maximize" : "Minimize";
  minimizeEl.setAttribute(
    "aria-label",
    minimized ? "Maximize" : "Minimize",
  );
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
  applyAccent(nowPlaying.accentRgb);
  renderTransport();
  renderMinimizeButton();
}

function applyAccent(rgb: string | null | undefined): void {
  const value = rgb?.trim() || "18, 18, 22";
  panel?.style.setProperty("--accent-rgb", value);
}

function renderTransport(): void {
  if (!playToggleEl) return;
  const playing = Boolean(nowPlaying?.playing);
  playToggleEl.textContent = playing ? "⏸" : "▶";
  playToggleEl.title = playing ? "Pause" : "Play";
  playToggleEl.setAttribute("aria-label", playing ? "Pause" : "Play");

  const shuffleOn = Boolean(nowPlaying?.shuffle);
  if (shuffleEl) {
    shuffleEl.classList.toggle("active", shuffleOn);
    shuffleEl.title = shuffleOn ? "Shuffle on" : "Shuffle off";
    shuffleEl.setAttribute(
      "aria-label",
      shuffleOn ? "Shuffle on" : "Shuffle off",
    );
  }

  const mode = nowPlaying?.repeatMode ?? "NONE";
  if (repeatEl) {
    repeatEl.classList.toggle("active", mode !== "NONE");
    repeatEl.classList.toggle("repeat-one", mode === "ONE");
    repeatEl.textContent = mode === "ONE" ? "➀" : "⟳";
    const label =
      mode === "ALL"
        ? "Repeat all"
        : mode === "ONE"
          ? "Repeat one"
          : "Repeat off";
    repeatEl.title = label;
    repeatEl.setAttribute("aria-label", label);
  }

  renderProgress();
}

function lyricsToken(state: LyricsState): string {
  return `${state.status}|${state.fetchedFor}|${state.lines.length}`;
}

function hasUsableLyrics(state: LyricsState): boolean {
  return state.status === "ready" && state.lines.length > 0;
}

function hasNoLyrics(state: LyricsState): boolean {
  return (
    state.status === "not_found" ||
    state.status === "instrumental" ||
    (state.status === "ready" && state.lines.length === 0)
  );
}

/**
 * Collapse only when lyrics are definitively unavailable.
 * Stay put while loading so track switches don't flicker open/closed.
 * Expand when lyrics arrive, unless the user pinned minimize.
 */
function syncMinimizeToLyrics(): void {
  if (lyrics.status === "loading" || lyrics.status === "idle") {
    return;
  }

  if (hasNoLyrics(lyrics)) {
    if (!prefs.widgetMinimized) {
      prefs = { ...prefs, widgetMinimized: true };
      void setPrefs({ widgetMinimized: true });
      applyVisibility();
    }
    return;
  }

  if (!hasUsableLyrics(lyrics)) return;
  if (prefs.minimizePinned) return;
  if (prefs.widgetMinimized) {
    prefs = { ...prefs, widgetMinimized: false };
    void setPrefs({ widgetMinimized: false });
    applyVisibility();
  }
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

  if (prefs.transportEnabled) renderProgress();

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
  if (nowPlaying) renderHeader();
  else applyAccent(null);
}

function applyState(state: AppState): void {
  const prevKey = nowPlaying?.trackKey ?? "";
  const wasPlaying = nowPlaying?.playing;
  const prevLyricsToken = lastLyricsToken;
  const prevPosKey = positionKey(prefs.widgetLeft, prefs.widgetBottom);

  prefs = state.prefs;
  nowPlaying = state.nowPlaying;
  lyrics = state.lyrics;
  const posChanged =
    positionKey(prefs.widgetLeft, prefs.widgetBottom) !== prevPosKey;

  const nextKey = nowPlaying?.trackKey ?? "";
  const trackChanged = nextKey !== prevKey || nextKey !== lastTrackKey;
  lastTrackKey = nextKey;
  if (trackChanged) scrubbing = false;

  onTrackOrVisibility();
  if (posChanged) applyPanelPosition();

  const token = lyricsToken(lyrics);
  if (trackChanged || token !== prevLyricsToken) {
    if (visible()) renderLyricsShell();
    else lastLyricsToken = token;
    syncMinimizeToLyrics();
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
