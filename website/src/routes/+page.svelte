<script lang="ts">
	import { onMount } from 'svelte';
	import GithubLogo from 'phosphor-svelte/lib/GithubLogo';
	import Globe from 'phosphor-svelte/lib/Globe';
	import Heart from 'phosphor-svelte/lib/Heart';
	import LinkedinLogo from 'phosphor-svelte/lib/LinkedinLogo';
	import BrowserDemo from '$lib/components/BrowserDemo.svelte';
	import LyriqWidget from '$lib/components/LyriqWidget.svelte';
	import SampleSite from '$lib/components/SampleSite.svelte';
	import ThemeToggle from '$lib/components/ThemeToggle.svelte';
	import Faq from '$lib/components/sections/Faq.svelte';
	import HowSyncWorks from '$lib/components/sections/HowSyncWorks.svelte';
	import Privacy from '$lib/components/sections/Privacy.svelte';
	import { DemoPlayer } from '$lib/demo/player.svelte';

	const REPO = 'https://github.com/aayush-mhrzn7/YTMplayer';
	const PORTFOLIO = 'https://aayush-maharjan.vercel.app';
	const LINKEDIN = 'https://www.linkedin.com/in/aayush-maharjan-47a017316/';

	const player = new DemoPlayer();
	let browserEl: HTMLDivElement | undefined = $state();

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

	onMount(() => {
		const stop = player.start();
		player.select(0, true);
		return () => {
			stop();
			clearTimeout(settleTimer);
		};
	});

	function reveal() {
		// The feature list sits below the browser; bring the demo back into view if it's off screen
		if (!browserEl) return;
		const r = browserEl.getBoundingClientRect();
		if (r.top < 0 || r.bottom > window.innerHeight) {
			browserEl.scrollIntoView({ behavior: 'smooth', block: 'center' });
		}
	}

	type Feature = {
		title: string;
		body: string;
		action: () => string;
		run: () => void;
	};

	const onThePage: Feature[] = [
		{
			title: 'Synced lyrics',
			body: 'The previous, current and next line, in time with the song.',
			action: () => 'Jump to the chorus',
			run: () => {
				if (!player.track.lines.length) player.select(0);
				player.setEnabled(true);
				player.minimized = false;
				player.minimizePinned = false;
				setTimeout(
					() => {
						player.seek(player.chorusTime() - 0.4);
						player.playing = true;
					},
					player.lyricsStatus === 'loading' ? 700 : 0
				);
			}
		},
		{
			title: 'Playback controls',
			body: 'Seek, skip, shuffle and repeat. Hide them if you only want lyrics.',
			action: () => (player.transportEnabled ? 'Hide controls' : 'Show controls'),
			run: () => {
				player.setEnabled(true);
				player.transportEnabled = !player.transportEnabled;
			}
		},
		{
			title: 'Minimize and drag',
			body: 'Shrink it to the title bar, or drag it out of the way.',
			action: () => (player.minimized ? 'Expand' : 'Minimize'),
			run: () => {
				player.setEnabled(true);
				player.toggleMinimize();
			}
		},
		{
			title: 'Instrumentals',
			body: 'When a song has no lyrics, the widget shrinks until the next one does.',
			action: () => 'Play an instrumental',
			run: () => {
				player.setEnabled(true);
				player.minimizePinned = false;
				player.select(2);
			}
		}
	];

	const inTheBrowser: Feature[] = [
		{
			title: 'Every tab',
			body: 'Music stays in one tab. The widget shows up on all the others.',
			action: () => 'Next tab',
			run: () => {
				const order = ['ytm', 'site', 'docs', 'mail'] as const;
				player.tab = order[(order.indexOf(player.tab) + 1) % order.length];
			}
		},
		{
			title: 'Toolbar popup',
			body: 'Album art, playback status, and switches for the overlay and controls.',
			action: () => (player.popupOpen ? 'Close the popup' : 'Open the popup'),
			run: () => {
				player.popupOpen = !player.popupOpen;
			}
		}
	];
</script>

<svelte:head>
	<title>Lyriq: synced lyrics on every tab</title>
	<meta
		name="description"
		content="Lyriq is a Chrome extension that shows synced YouTube Music lyrics in a floating widget on every tab, with optional playback controls."
	/>
</svelte:head>

<svelte:window onscroll={onScroll} onscrollend={settle} />

{#snippet featureRow(f: Feature)}
	<li class="feature">
		<div>
			<h4>{f.title}</h4>
			<p>{f.body}</p>
		</div>
		<button
			class="chip press"
			onclick={() => {
				f.run();
				reveal();
			}}>{f.action()}</button
		>
	</li>
{/snippet}

<header class="nav" class:hidden={navHidden}>
	<div class="wrap nav-inner">
		<a href="#top" class="logo" aria-label="Lyriq home">
			<img src="/icons/lyriq-logo.png" alt="Lyriq" width="112" height="28" />
		</a>
		<nav aria-label="Primary">
			<a href="#how">How it works</a>
			<a href="#demo">Test it out</a>
			<a href="#privacy">Privacy</a>
			<a href="#install">Install</a>
			<a href="#faq">Questions</a>
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

<main id="top">
	<section class="hero wrap">
		<div class="hero-copy">
			<h1 class="display">Synced lyrics on every tab you open.</h1>
			<p class="hero-sub">A small glass widget that keeps time with YouTube Music, on any page you're reading.</p>
			<div class="cta">
				<a class="btn btn-accent press" href="#demo">Try the demo</a>
				<a class="btn btn-quiet press" href="#install">Install</a>
			</div>
		</div>

		<div class="hero-stage">
			<div class="stage-page" aria-hidden="true" inert>
				<SampleSite />
			</div>
			<div class="stage-widget">
				<LyriqWidget {player} variant="hero" />
			</div>
		</div>
	</section>

	<section id="how" class="how wrap">
		<div class="how-head">
			<h2 class="display">How it works</h2>
			<p class="sung how-lede">Start a song, then leave the tab alone.</p>
		</div>
		<ol class="how-steps">
			<li>
				<span class="step-num" aria-hidden="true">1</span>
				<div>
					<h3>Play a song on YouTube Music</h3>
					<p>Keep that tab open. Lyriq reads the track and how far into it you are.</p>
				</div>
			</li>
			<li>
				<span class="step-num" aria-hidden="true">2</span>
				<div>
					<h3>Open any other site</h3>
					<p>The widget appears in the corner with the lyrics for that moment.</p>
				</div>
			</li>
			<li>
				<span class="step-num" aria-hidden="true">3</span>
				<div>
					<h3>Control it from the widget</h3>
					<p>Pause, skip or seek without switching tabs. Turn it off from the toolbar.</p>
				</div>
			</li>
		</ol>
	</section>

	<section id="demo" class="demo">
		<div class="wrap">
			<div class="demo-head">
				<h2 class="display">Test it out</h2>
				<p>
					Drag the widget, switch tabs, or open the Lyriq popup from the toolbar. The songs are made up and
					there's no sound.
				</p>
			</div>

			<div class="demo-browser" bind:this={browserEl}>
				<BrowserDemo {player} />
				{#if !player.enabled}
					<p class="closed-hint" role="status">
						The overlay is off. Open the Lyriq popup and tick <strong>Overlay</strong> to bring it back.
					</p>
				{/if}
			</div>

			<div class="features">
				<div>
					<h3 class="group-title">On the page</h3>
					<ul>
						{#each onThePage as f (f.title)}
							{@render featureRow(f)}
						{/each}
					</ul>
				</div>
				<div>
					<h3 class="group-title">In the browser</h3>
					<ul>
						{#each inTheBrowser as f (f.title)}
							{@render featureRow(f)}
						{/each}
					</ul>
				</div>
			</div>
		</div>
	</section>

	<HowSyncWorks />

	<Privacy repo={REPO} />

	<section id="install" class="install wrap">
		<h2 class="display">Install</h2>
		<p class="install-lede">
			Lyriq isn't on the Chrome Web Store yet, so you build it and load it yourself. It's free for
			personal use and needs Node.js 18 or newer.
		</p>

		<div class="install-body">
			<ol class="install-steps">
				<li>
					<span class="step-num" aria-hidden="true">1</span>
					<div>
						<h3>Build the extension</h3>
						<p>Run the two commands in the <code>extension</code> folder.</p>
					</div>
				</li>
				<li>
					<span class="step-num" aria-hidden="true">2</span>
					<div>
						<h3>Load it in Chrome</h3>
						<p>
							Open <code>chrome://extensions</code>, turn on Developer mode, click Load unpacked and pick
							the <code>dist</code> folder.
						</p>
					</div>
				</li>
				<li>
					<span class="step-num" aria-hidden="true">3</span>
					<div>
						<h3>Press play</h3>
						<p>Start a song on YouTube Music, then open any other tab.</p>
					</div>
				</li>
			</ol>

			<div class="install-code">
				<pre><code>npm install
npm run build</code></pre>
				<a class="btn btn-strong press" href={REPO} target="_blank" rel="noreferrer">
					<GithubLogo size={18} weight="fill" />
					GitHub
				</a>
			</div>
		</div>
	</section>

	<Faq />
</main>

<footer class="footer">
	<div class="wrap">
		<div class="footer-top">
			<div class="footer-brand">
				<img class="footer-logo" src="/icons/lyriq-logo.png" alt="Lyriq" width="128" height="32" />
				<p class="footer-about">
					Synced lyrics for YouTube Music, on top of whatever you're reading. Built for Chrome and
					Chromium.
				</p>
				<p class="footer-info">
					Lyrics provided by <a href="https://lrclib.net" target="_blank" rel="noreferrer">lrclib.net</a>
				</p>
				<h3 class="footer-head">Links</h3>
				<div class="socials">
					<a href={REPO} target="_blank" rel="noreferrer" aria-label="Lyriq on GitHub" title="GitHub">
						<GithubLogo size={20} weight="fill" />
					</a>
					<a href={LINKEDIN} target="_blank" rel="noreferrer" aria-label="Aayush Maharjan on LinkedIn" title="LinkedIn">
						<LinkedinLogo size={20} weight="fill" />
					</a>
					<a href={PORTFOLIO} target="_blank" rel="noreferrer" aria-label="Aayush Maharjan's portfolio" title="Portfolio">
						<Globe size={20} weight="bold" />
					</a>
				</div>
			</div>

			<nav class="footer-cols" aria-label="Footer">
				<div>
					<h3 class="footer-head">Product</h3>
					<ul>
						<li><a href="#how">How it works</a></li>
						<li><a href="#demo">Test it out</a></li>
						<li><a href="#privacy">Privacy</a></li>
						<li><a href="#install">Install</a></li>
						<li><a href="#faq">Questions</a></li>
					</ul>
				</div>
				<div>
					<h3 class="footer-head">Resources</h3>
					<ul>
						<li><a href={REPO} target="_blank" rel="noreferrer">GitHub</a></li>
						<li><a href="{REPO}/issues" target="_blank" rel="noreferrer">Report a problem</a></li>
					</ul>
				</div>
			</nav>
		</div>

		<div class="footer-bottom">
			<p class="credit">
				<span
					>Made with <Heart size={14} weight="fill" class="heart" aria-label="love" /> by
					<a class="credit-link" href={PORTFOLIO} target="_blank" rel="noreferrer">Aayush Maharjan</a></span
				>
				<span>Copyright ©{new Date().getFullYear()} Lyriq. All rights reserved.</span>
			</p>
			<p class="footer-legal">
				<span>Personal use licence</span>
			</p>
		</div>
	</div>
	<div class="footer-mark" aria-hidden="true">LYRIQ</div>
</footer>

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

	.logo img,
	.footer-logo {
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

	/* Buttons: always pills */
	.btn {
		display: inline-flex;
		align-items: center;
		gap: 8px;
		height: 48px;
		padding: 0 24px;
		border-radius: 999px;
		font-weight: 500;
		font-size: 15px;
		text-decoration: none;
		white-space: nowrap;
		transition:
			transform 160ms var(--ease-out),
			background-color 150ms ease,
			box-shadow 150ms ease;
	}

	.btn.small {
		height: 38px;
		padding: 0 16px;
		font-size: 14px;
	}

	.btn-accent {
		background: var(--accent);
		color: #fff;
	}

	@media (hover: hover) and (pointer: fine) {
		.btn-accent:hover {
			background: var(--accent-hover);
		}
		.btn-strong:hover {
			background: color-mix(in srgb, var(--strong-bg) 86%, var(--accent));
		}
		.btn-quiet:hover {
			box-shadow: inset 0 0 0 1.5px color-mix(in srgb, var(--text) 35%, transparent);
		}
		.chip:hover {
			background: var(--chip-hover);
			box-shadow: inset 0 0 0 1.5px var(--chip-line-hover);
		}
	}

	.btn-strong {
		background: var(--strong-bg);
		color: var(--strong-text);
	}

	.btn-quiet {
		color: var(--text);
		box-shadow: inset 0 0 0 1.5px var(--line);
	}


	/* Hero */
	.hero {
		display: grid;
		grid-template-columns: minmax(0, 1fr) minmax(0, 1fr);
		gap: 64px;
		align-items: center;
		padding: 72px 0 112px;
	}

	h1 {
		margin: 0;
		font-size: clamp(42px, 5vw, 64px);
		font-weight: 500;
		letter-spacing: -0.025em;
		line-height: 1.05;
		text-wrap: balance;
	}

	.hero-sub {
		margin: 20px 0 0;
		max-width: 34ch;
		font-size: 19px;
		line-height: 1.5;
		color: var(--text-2);
		text-wrap: pretty;
	}

	.cta {
		display: flex;
		flex-wrap: wrap;
		gap: 12px;
		margin-top: 36px;
	}

	.hero-stage {
		position: relative;
		height: 520px;
	}

	.stage-page {
		position: absolute;
		inset: 0;
		border-radius: var(--radius);
		overflow: hidden;
		container: viewport / inline-size;
		box-shadow:
			var(--shadow),
			0 0 0 1px var(--line);
		pointer-events: none;
	}

	/* The widget sits over the page and slightly past its edge, like it does in a real tab */
	.stage-widget {
		position: absolute;
		right: 28px;
		bottom: -36px;
		width: min(340px, calc(100% - 32px));
	}

	/* One load moment: the three lines arrive in order, the way the widget swaps lines */
	@media (prefers-reduced-motion: no-preference) {
		.hero-copy > *,
		.hero-stage {
			animation: line-in 600ms var(--ease-out) both;
		}
		.hero-copy > :nth-child(2) {
			animation-delay: 60ms;
		}
		.hero-copy > :nth-child(3) {
			animation-delay: 120ms;
		}
		.hero-copy > :nth-child(4) {
			animation-delay: 180ms;
		}
		.hero-stage {
			animation-delay: 120ms;
		}
	}

	@keyframes line-in {
		from {
			opacity: 0;
			transform: translateY(8px);
		}
	}

	/* How it works: heading holds still while the steps scroll past */
	.how {
		display: grid;
		grid-template-columns: minmax(0, 5fr) minmax(0, 6fr);
		gap: 64px;
		padding: 64px 0 128px;
		align-items: start;
	}

	.how-head {
		position: sticky;
		top: 96px;
	}

	.how-lede {
		margin: 14px 0 0;
		font-size: clamp(21px, 2vw, 25px);
		line-height: 1.35;
		color: var(--muted);
	}

	.how-steps,
	.install-steps {
		list-style: none;
		margin: 0;
		padding: 0;
	}

	.how-steps li,
	.install-steps li {
		display: grid;
		grid-template-columns: 30px 1fr;
		gap: 18px;
	}

	.how-steps li {
		padding: 28px 0;
		border-top: 1px solid var(--line);
	}

	.how-steps li:first-child {
		padding-top: 0;
		border-top: none;
	}

	/* A real sequence, so it's numbered: a small ring level with the title */
	.step-num {
		display: grid;
		place-items: center;
		width: 30px;
		height: 30px;
		margin-top: 1px;
		border-radius: 999px;
		box-shadow: inset 0 0 0 1.5px var(--line);
		font-size: 14px;
		font-weight: 500;
		font-variant-numeric: tabular-nums;
		color: var(--text-2);
	}

	.how-steps h3,
	.install-steps h3 {
		margin: 3px 0 6px;
		font-size: 19px;
		font-weight: 500;
		line-height: 1.3;
		letter-spacing: -0.015em;
	}

	.how-steps p,
	.install-steps p {
		margin: 0;
		color: var(--text-2);
		max-width: 46ch;
	}

	/* Demo: the one dark stage on the page */
	.demo {
		background: var(--band);
		color: var(--text);
		padding: 112px 0 120px;
	}

	.demo-head {
		max-width: 60ch;
		margin-bottom: 48px;
	}

	.demo-head p {
		margin: 14px 0 0;
		font-size: 18px;
		color: var(--text-2);
	}

	.demo-browser {
		position: relative;
		scroll-margin-top: 24px;
	}

	.closed-hint {
		margin: 14px 0 0;
		padding: 12px 16px;
		border-radius: var(--radius-inner);
		background: var(--accent-soft);
		box-shadow: inset 0 0 0 1px var(--line);
		font-size: 14px;
	}

	.features {
		display: grid;
		grid-template-columns: minmax(0, 7fr) minmax(0, 5fr);
		gap: 64px;
		margin-top: 72px;
	}

	.features ul {
		list-style: none;
		margin: 0;
		padding: 0;
		display: grid;
		gap: 28px;
	}

	.group-title {
		margin: 0 0 24px;
		padding-bottom: 14px;
		border-bottom: 1px solid var(--line);
		font-size: 15px;
		font-weight: 500;
		color: var(--muted);
	}

	.feature {
		display: flex;
		align-items: center;
		justify-content: space-between;
		gap: 20px;
	}

	.feature h4 {
		margin: 0;
		font-size: 17px;
		font-weight: 500;
		letter-spacing: -0.01em;
	}

	.feature p {
		margin: 4px 0 0;
		font-size: 15px;
		line-height: 1.5;
		color: var(--text-2);
		max-width: 42ch;
	}

	.chip {
		all: unset;
		flex-shrink: 0;
		padding: 9px 16px;
		border-radius: 999px;
		font-size: 14px;
		font-weight: 500;
		color: var(--text);
		box-shadow: inset 0 0 0 1.5px var(--chip-line);
		cursor: pointer;
		white-space: nowrap;
		transition:
			transform 160ms var(--ease-out),
			background-color 150ms ease,
			box-shadow 150ms ease;
	}

	/* .chip resets with all: unset, so it restates the press itself */
	.chip:active {
		transform: scale(0.97);
	}

	.chip:focus-visible {
		outline: 2px solid var(--accent);
		outline-offset: 2px;
	}

	/* Install */
	.install {
		padding: 120px 0;
	}

	.install-lede {
		margin: 14px 0 0;
		font-size: 18px;
		color: var(--text-2);
		max-width: 56ch;
	}

	.install-body {
		display: grid;
		grid-template-columns: minmax(0, 6fr) minmax(0, 5fr);
		gap: 64px;
		margin-top: 56px;
		align-items: start;
	}

	.install-steps {
		display: grid;
		gap: 32px;
	}

	.install-code {
		display: grid;
		gap: 20px;
		justify-items: start;
		padding: 28px;
		border-radius: var(--radius);
		background: var(--surface);
		box-shadow: 0 0 0 1px var(--line);
	}

	pre {
		margin: 0;
		width: 100%;
		padding: 18px 20px;
		background: #111113;
		color: #e6e4f5;
		border-radius: var(--radius-inner);
		overflow-x: auto;
		font-size: 15px;
		line-height: 1.7;
	}

	code {
		font-family: var(--font-mono);
		font-size: 0.9em;
	}

	p code {
		background: var(--accent-soft);
		color: var(--accent-text);
		padding: 1px 6px;
		border-radius: 6px;
	}

	/* Footer */
	.footer {
		background: var(--band);
		color: var(--text-2);
		box-shadow: 0 -1px 0 var(--line);
		padding-top: 96px;
		overflow: hidden;
	}

	.footer-top {
		display: flex;
		justify-content: space-between;
		gap: 56px;
		flex-wrap: wrap;
	}

	.footer-brand {
		max-width: 440px;
	}

	.footer-logo {
		height: 32px;
		filter: var(--logo-filter);
	}

	.footer-about {
		margin: 20px 0 0;
		font-size: 16px;
		line-height: 1.6;
	}

	.footer-info {
		margin: 20px 0 0;
		font-size: 15px;
	}

	.footer a {
		color: var(--text-2);
		text-decoration: none;
		transition: color 0.15s ease;
	}

	.footer a:hover {
		color: var(--text);
	}

	.footer-info a {
		text-decoration: underline;
		text-underline-offset: 3px;
		text-decoration-color: var(--line);
	}

	.footer-head {
		margin: 0;
		font-size: 16px;
		font-weight: 500;
		color: var(--text);
	}

	.footer-brand .footer-head {
		margin-top: 32px;
	}

	.socials {
		display: flex;
		gap: 14px;
		margin-top: 16px;
	}

	.footer .socials a {
		display: grid;
		place-items: center;
		width: 38px;
		height: 38px;
		border-radius: 50%;
		background: var(--social-bg);
		color: var(--social-fg);
	}

	.footer .socials a:hover {
		background: var(--text);
		color: var(--bg);
	}

	.footer-cols {
		display: flex;
		gap: 88px;
	}

	.footer-cols ul {
		list-style: none;
		margin: 22px 0 0;
		padding: 0;
		display: grid;
		gap: 16px;
		font-size: 16px;
	}

	.footer-bottom {
		display: flex;
		justify-content: space-between;
		align-items: center;
		gap: 12px 24px;
		flex-wrap: wrap;
		margin-top: 88px;
		font-size: 14px;
		color: var(--muted);
	}

	.footer-bottom p {
		margin: 0;
	}

	.credit {
		display: flex;
		flex-wrap: wrap;
		gap: 4px 20px;
	}

	.credit > span:first-child {
		color: var(--text-2);
	}

	.credit :global(.heart) {
		vertical-align: -2px;
		color: #e5484d;
	}

	.footer .credit-link {
		color: var(--text);
		font-weight: 500;
		text-decoration: underline;
		text-decoration-color: var(--line);
		text-underline-offset: 3px;
	}

	.footer-legal {
		display: flex;
		align-items: center;
		flex-wrap: wrap;
	}


	/* Big outlined wordmark, cropped by the bottom edge */
	.footer-mark {
		width: min(1200px, 100% - 32px);
		margin: 64px auto 0;
		font-size: clamp(100px, 27.5vw, 370px);
		font-weight: 500;
		line-height: 0.78;
		letter-spacing: 0.02em;
		text-align: center;
		color: transparent;
		-webkit-text-stroke: 1.5px var(--mark-stroke);
		user-select: none;
		height: 0.62em;
		overflow: hidden;
	}

	/* Responsive */
	@media (max-width: 1000px) {
		.features {
			grid-template-columns: 1fr;
			gap: 48px;
		}
	}

	@media (max-width: 900px) {
		.hero,
		.how,
		.install-body {
			grid-template-columns: 1fr;
			gap: 40px;
		}
		.hero {
			padding: 48px 0 96px;
		}
		.how-head {
			position: static;
		}
		.how {
			padding: 32px 0 96px;
		}
	}

	@media (max-width: 640px) {
		.nav nav {
			display: none;
		}
		.nav-actions {
			margin-left: auto;
		}
		.hero-stage {
			height: 400px;
		}
		.stage-widget {
			right: 12px;
			left: 12px;
			width: auto;
			bottom: -28px;
		}
		.demo {
			padding: 80px 0 88px;
		}
		.demo-head {
			margin-bottom: 32px;
		}
		.features {
			margin-top: 56px;
		}
		.feature {
			flex-direction: column;
			align-items: flex-start;
			gap: 12px;
		}
		.install {
			padding: 88px 0;
		}
		.install-code {
			padding: 20px;
		}
		.footer {
			padding-top: 64px;
		}
		.footer-cols {
			gap: 56px;
		}
		.footer-bottom {
			margin-top: 56px;
			flex-direction: column;
			align-items: flex-start;
		}
		.footer-legal {
			flex-direction: column;
			align-items: flex-start;
			gap: 6px;
		}
	}
</style>
