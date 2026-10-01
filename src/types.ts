export type LyricsStatus =
  | "idle"
  | "loading"
  | "ready"
  | "not_found"
  | "instrumental";

export interface LyricLine {
  time: number;
  text: string;
}

export interface Prefs {
  enabled: boolean;
  widgetClosed: boolean;
  widgetMinimized: boolean;
  transportEnabled: boolean;
  /** Distance from viewport left to panel left; null = default */
  widgetLeft: number | null;
  /** Distance from viewport bottom to panel bottom; null = default */
  widgetBottom: number | null;
}

export interface NowPlaying {
  title: string;
  artist: string;
  albumArtUrl: string;
  /** CSS `r, g, b` from album art for glass tint; null if unknown */
  accentRgb: string | null;
  duration: number;
  currentTime: number;
  recordedAt: number;
  playing: boolean;
  trackKey: string;
  sourceTabId: number;
  updatedAt: number;
}

export interface LyricsState {
  status: LyricsStatus;
  lines: LyricLine[];
  fetchedFor: string | null;
}

export type TrackUpdateMessage = {
  type: "TRACK_UPDATE";
  title: string;
  artist: string;
  albumArtUrl: string;
  duration: number;
  currentTime: number;
  playing: boolean;
  recordedAt: number;
  updatedAt: number;
};

export type PlaybackMessage = {
  type: "PLAYBACK";
  currentTime: number;
  duration: number;
  playing: boolean;
  recordedAt: number;
  updatedAt: number;
};

export type TransportAction = "toggle" | "next" | "previous";

export type TransportMessage = {
  type: "TRANSPORT";
  action: TransportAction;
};

export type TransportCommandMessage = {
  type: "TRANSPORT_CMD";
  action: TransportAction;
};

export type GetStateMessage = {
  type: "GET_STATE";
};

export type SetPrefsMessage = {
  type: "SET_PREFS";
  prefs: Partial<Prefs>;
};

export type StatePushMessage = {
  type: "STATE_PUSH";
  prefs: Prefs;
  nowPlaying: NowPlaying | null;
  lyrics: LyricsState;
};

export type ExtensionMessage =
  | TrackUpdateMessage
  | PlaybackMessage
  | TransportMessage
  | TransportCommandMessage
  | GetStateMessage
  | SetPrefsMessage
  | StatePushMessage;

export interface AppState {
  prefs: Prefs;
  nowPlaying: NowPlaying | null;
  lyrics: LyricsState;
}

export const DEFAULT_PREFS: Prefs = {
  enabled: true,
  widgetClosed: false,
  widgetMinimized: false,
  transportEnabled: false,
  widgetLeft: null,
  widgetBottom: null,
};

export const EMPTY_LYRICS: LyricsState = {
  status: "idle",
  lines: [],
  fetchedFor: null,
};
