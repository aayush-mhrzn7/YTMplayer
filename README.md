# YTM Lyrics Overlay

Chrome MV3 extension that shows synced lyrics in a floating widget on any tab while YouTube Music is playing. Lyrics come from [lrclib.net](https://lrclib.net).

## Setup

```bash
npm install
npm run build
```

Then in Chrome:

1. Open `chrome://extensions`
2. Enable **Developer mode**
3. **Load unpacked** → select the `dist/` folder

## Develop

```bash
npm run watch
```

After a rebuild, click **Reload** on the extension card in `chrome://extensions`.

## Usage

1. Play a track on [music.youtube.com](https://music.youtube.com)
2. Open any other tab — the lyrics widget appears bottom-right
3. Minimize → edge peek; close (X) → reopen from the toolbar popup **Show widget**
4. Popup toggle **Enable overlay** turns the widget on/off everywhere
