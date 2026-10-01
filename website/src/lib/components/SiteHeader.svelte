<script lang="ts">
	import GithubLogo from 'phosphor-svelte/lib/GithubLogo';
	import ThemeToggle from './ThemeToggle.svelte';
	import { REPO } from '$lib/site';

	// Header hides while scrolling down, and comes back on scroll up or once scrolling stops.
	// Small movements and the bounce past the top/bottom on phones are ignored, so it doesn't flicker.
	const HIDE_AFTER = 24;
	const SHOW_AFTER = 8;
	let navHidden = $state(false);
	let lastY = 0;
	let travel = 0;
	let ticking = false;
	let settleTimer: ReturnType<typeof setTimeout> | undefined;

	function settle() {
		clearTimeout(settleTimer);
		travel = 0;
		navHidden = false;
	}

	function onScroll() {
		if (ticking) return;
		ticking = true;
		requestAnimationFrame(() => {
			ticking = false;
			const max = document.documentElement.scrollHeight - window.innerHeight;
			// Clamp out iOS rubber-band overscroll, which reports y < 0 or y > max
			const y = Math.min(Math.max(window.scrollY, 0), max);
			const delta = y - lastY;
			lastY = y;
			if (delta === 0) return;

			if (y < 80) {
				settle();
				return;
			}
			// Count travel in one direction; a change of direction starts the count again
			travel = Math.sign(delta) === Math.sign(travel) ? travel + delta : delta;
			if (travel > HIDE_AFTER) navHidden = true;
			else if (travel < -SHOW_AFTER) navHidden = false;

			// Fallback for browsers without the scrollend event
			if (!('onscrollend' in window)) {
				clearTimeout(settleTimer);
				settleTimer = setTimeout(settle, 250);
			}
		});
	}

	$effect(() => () => clearTimeout(settleTimer));
</script>

<svelte:window onscroll={onScroll} onscrollend={settle} />

<header class="nav" class:hidden={navHidden}>
	<div class="wrap nav-inner">
		<a href="/" class="logo" aria-label="Lyriq home">
			<img src="/icons/lyriq-logo.webp" alt="Lyriq" width="112" height="28" />
		</a>
		<nav aria-label="Primary">
			<a href="/#how">How it works</a>
			<a href="/#demo">Test it out</a>
			<a href="/#privacy">Privacy</a>
			<a href="/#install">Install</a>
			<a href="/#faq">Questions</a>
		</nav>
		<div class="nav-actions">
			<ThemeToggle />
			<a class="btn btn-strong small press" href={REPO} target="_blank" rel="noreferrer">
				<GithubLogo size={18} weight="fill" />
				GitHub
			</a>
		</div>
	</div>
</header>

<style>
	/* Nav */
	.nav {
		position: sticky;
		top: 0;
		z-index: 50;
		background: var(--material);
		backdrop-filter: blur(20px) saturate(180%);
		-webkit-backdrop-filter: blur(20px) saturate(180%);
		box-shadow: 0 1px 0 var(--line);
		transition:
			transform 250ms var(--ease-out),
			opacity 200ms var(--ease-out);
		will-change: transform;
	}

	/* Leaves upward and comes back down the same way */
	.nav.hidden:not(:focus-within) {
		transform: translateY(-100%);
	}

	@media (prefers-reduced-motion: reduce) {
		.nav.hidden:not(:focus-within) {
			transform: none;
			opacity: 0;
		}
	}

	@media (prefers-reduced-transparency: reduce) {
		.nav {
			background: var(--bg);
			backdrop-filter: none;
			-webkit-backdrop-filter: none;
		}
	}

	.nav-inner {
		display: flex;
		align-items: center;
		gap: 24px;
		height: 64px;
	}

	.logo img {
		display: block;
		width: auto;
		filter: var(--logo-filter);
	}

	.logo img {
		height: 26px;
	}

	.nav nav {
		display: flex;
		gap: 28px;
		margin-left: auto;
		font-size: 15px;
		font-weight: 500;
	}

	.nav nav a {
		text-decoration: none;
		color: var(--text-2);
	}

	.nav nav a:hover {
		color: var(--text);
	}

	.nav-actions {
		display: flex;
		align-items: center;
		gap: 10px;
	}

	@media (max-width: 640px) {
		.nav nav {
			display: none;
		}
		.nav-actions {
			margin-left: auto;
		}
	}
</style>
