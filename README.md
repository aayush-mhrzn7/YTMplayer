# YTMplayer

Chrome extension (Manifest V3) that shows synced lyrics in a floating widget on any tab while [YouTube Music](https://music.youtube.com) is playing. Lyrics are fetched from [lrclib.net](https://lrclib.net).

## Features

- Synced lyrics overlay on all tabs
- Three-line view (previous / current / next)
- Draggable widget; position syncs across tabs
- Optional playback controls (previous, play/pause, next) — off by default
- Toolbar popup: enable overlay, show widget, toggle controls

## Requirements

- Node.js 18+
- Google Chrome (or Chromium)

## Setup

```bash
npm install
npm run build
```

Load in Chrome:

1. Open `chrome://extensions`
2. Turn on **Developer mode**
3. **Load unpacked** → choose the `dist/` folder

## Development

```bash
npm run watch
```

Rebuilds on file changes. Reload the extension on `chrome://extensions` after each build.

## Usage

1. Play a track on YouTube Music (keep that tab open).
2. Open any other site — the widget appears when a track is active.
3. Use the extension popup to enable the overlay, show the widget, or turn on playback controls.

## Project layout

- `src/` — TypeScript source (background, content scripts, popup)
- `dist/` — build output (load this in Chrome)
- `scripts/build.mjs` — esbuild pipeline

## License

Private / personal use unless you add a license file.
