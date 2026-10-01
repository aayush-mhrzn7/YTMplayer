<script lang="ts">
	import { onMount } from 'svelte';
	import Moon from 'phosphor-svelte/lib/Moon';
	import Sun from 'phosphor-svelte/lib/Sun';

	const KEY = 'lyriq-theme';
	let dark = $state(false);

	function systemDark() {
		return matchMedia('(prefers-color-scheme: dark)').matches;
	}

	function savedChoice() {
		try {
			return localStorage.getItem(KEY);
		} catch {
			return null;
		}
	}

	onMount(() => {
		const root = document.documentElement;
		dark = root.dataset.theme ? root.dataset.theme === 'dark' : systemDark();

		// Follow the system while the viewer hasn't picked a theme
		const mq = matchMedia('(prefers-color-scheme: dark)');
		const onChange = () => {
			if (savedChoice()) return;
			dark = mq.matches;
			root.dataset.theme = dark ? 'dark' : 'light';
		};
		mq.addEventListener('change', onChange);
		return () => mq.removeEventListener('change', onChange);
	});

	function toggle() {
		const root = document.documentElement;
		dark = !dark;
		root.classList.add('theme-changing');
		root.dataset.theme = dark ? 'dark' : 'light';
		document
			.querySelector('meta[name="theme-color"]')
			?.setAttribute('content', dark ? '#000000' : '#ffffff');
		try {
			localStorage.setItem(KEY, root.dataset.theme);
		} catch {
			// Private mode or storage blocked: the choice lasts for this visit
		}
		setTimeout(() => root.classList.remove('theme-changing'), 320);
	}
</script>

<button
	class="toggle press"
	type="button"
	aria-label={dark ? 'Switch to light mode' : 'Switch to dark mode'}
	title={dark ? 'Light mode' : 'Dark mode'}
	onclick={toggle}
>
	<span class="icon" class:shown={!dark}><Moon size={18} weight="bold" /></span>
	<span class="icon" class:shown={dark}><Sun size={18} weight="bold" /></span>
</button>

<style>
	.toggle {
		all: unset;
		position: relative;
		display: grid;
		place-items: center;
		width: 38px;
		height: 38px;
		border-radius: 999px;
		color: var(--text);
		box-shadow: inset 0 0 0 1.5px var(--line);
		cursor: pointer;
		transition:
			transform 160ms var(--ease-out),
			box-shadow 150ms ease;
	}

	.toggle:active {
		transform: scale(0.94);
	}

	.toggle:focus-visible {
		outline: 2px solid var(--accent);
		outline-offset: 2px;
	}

	@media (hover: hover) and (pointer: fine) {
		.toggle:hover {
			box-shadow: inset 0 0 0 1.5px color-mix(in srgb, var(--text) 35%, transparent);
		}
	}

	/* The icons swap with a short turn and fade, so the change reads as one control flipping */
	.icon {
		grid-area: 1 / 1;
		display: grid;
		opacity: 0;
		transform: rotate(-60deg) scale(0.9);
		transition:
			opacity 200ms var(--ease-out),
			transform 200ms var(--ease-out);
	}

	.icon.shown {
		opacity: 1;
		transform: none;
	}

	@media (prefers-reduced-motion: reduce) {
		.icon {
			transform: none;
		}
	}
</style>
