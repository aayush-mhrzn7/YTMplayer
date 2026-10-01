<script lang="ts">
	// Instrument Sans with its width axis (used to tighten display sizes)
	import '@fontsource-variable/instrument-sans/standard.css';
	// Newsreader with optical sizing, so it's drawn for the size it's set at
	import '@fontsource-variable/newsreader/opsz.css';
	import '@fontsource-variable/newsreader/opsz-italic.css';
	import '../app.css';

	let { children } = $props();
</script>

<svelte:head>
	<link rel="icon" type="image/png" href="/icons/icon32.png" />
</svelte:head>

{@render children()}
