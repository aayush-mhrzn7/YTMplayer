# Lyriq website

Landing page for the Lyriq extension, with an interactive "Test it out" demo. Built with SvelteKit and bun, uses Instrument Sans, and is prerendered as one static page.

```bash
bun install
bun run dev      # http://localhost:5173
bun run build    # static output in build/
bun run preview
```

- `src/routes/+page.svelte`: the landing page sections
- `src/lib/demo/`: simulated player state and the sample tracks (original placeholder songs/lyrics)
- `src/lib/components/LyriqWidget.svelte` / `LyriqPopup.svelte`: ports of the extension's overlay and toolbar popup
- `src/lib/components/MusicPlayer.svelte`: the sample YouTube Music style player
