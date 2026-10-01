<script lang="ts">
	import Broadcast from 'phosphor-svelte/lib/Broadcast';
	import MagnifyingGlass from 'phosphor-svelte/lib/MagnifyingGlass';
	import MusicNotes from 'phosphor-svelte/lib/MusicNotes';
	import Timer from 'phosphor-svelte/lib/Timer';

	// Matches extension/src: content/ytm.ts, lib/lrclib.ts, background.ts, content/overlay.ts
	const stages = [
		{
			icon: MusicNotes,
			title: 'Read the player',
			body: 'In the YouTube Music tab, Lyriq reads the song, artist and how far in you are.',
			detail: 'every 250 ms, plus on play, pause and seek'
		},
		{
			icon: MagnifyingGlass,
			title: 'Find the lyrics',
			body: 'The title, artist and length go to lrclib.net, which sends back lyrics with a timestamp on every line.',
			detail: 'lrclib.net/api/get'
		},
		{
			icon: Broadcast,
			title: 'Share it with your tabs',
			body: "The extension's background passes the current song and position to every open tab.",
			detail: 'chrome.tabs.sendMessage'
		},
		{
			icon: Timer,
			title: 'Keep time in each tab',
			body: 'Between updates, each widget counts forward from the last position it heard and picks the line.',
			detail: 'binary search over line times'
		}
	];
</script>

<section id="under-the-hood" class="sync wrap" aria-labelledby="sync-title">
	<div class="head">
		<h2 id="sync-title" class="display">How the syncing works</h2>
		<p>Four small steps pass the song's position around. There's no Lyriq server in the middle.</p>
	</div>

	<ol class="flow">
		{#each stages as s, i (s.title)}
			<li style:--i={i}>
				<span class="icon" aria-hidden="true"><s.icon size={22} weight="duotone" /></span>
				<h3>{s.title}</h3>
				<p>{s.body}</p>
				<code>{s.detail}</code>
			</li>
		{/each}
	</ol>
</section>

<style>
	.sync {
		padding: 120px 0;
	}

	.head {
		max-width: 60ch;
		margin-bottom: 56px;
	}

	.head p {
		margin: 14px 0 0;
		font-size: 18px;
		color: var(--text-2);
	}

	.flow {
		list-style: none;
		margin: 0;
		padding: 0;
		display: grid;
		grid-template-columns: repeat(4, minmax(0, 1fr));
		gap: 32px;
	}

	li {
		position: relative;
		display: flex;
		flex-direction: column;
		/* Lets the travelling dot measure this column's width (cqw) */
		container-type: inline-size;
	}

	/* Connector from this step's icon to the next one */
	li:not(:last-child)::before {
		content: '';
		position: absolute;
		top: 22px;
		left: 56px;
		right: -24px;
		height: 1px;
		background: var(--line);
	}

	/* A dot travels along each connector in turn, showing which way the data goes */
	li:not(:last-child)::after {
		content: '';
		position: absolute;
		top: 20px;
		left: 56px;
		width: 5px;
		height: 5px;
		border-radius: 999px;
		background: var(--accent);
		opacity: 0;
		/* Connector length: column width - 56px start + 24px overhang - dot width */
		--hop: calc(100cqw - 37px);
	}

	@media (prefers-reduced-motion: no-preference) {
		li:not(:last-child)::after {
			animation: travel 3.6s linear infinite;
			animation-delay: calc(var(--i) * 1.2s);
		}
	}

	@keyframes travel {
		0% {
			opacity: 0;
			transform: translateX(0);
		}
		5% {
			opacity: 1;
		}
		28% {
			opacity: 1;
			transform: translateX(var(--hop));
		}
		33%,
		100% {
			opacity: 0;
			transform: translateX(var(--hop));
		}
	}

	.icon {
		display: grid;
		place-items: center;
		width: 44px;
		height: 44px;
		border-radius: var(--radius-inner);
		background: var(--accent-soft);
		color: var(--accent-text);
	}

	h3 {
		margin: 22px 0 6px;
		font-size: 19px;
		font-weight: 500;
		letter-spacing: -0.015em;
	}

	p {
		margin: 0;
		color: var(--text-2);
		line-height: 1.55;
	}

	code {
		margin-top: 16px;
		align-self: flex-start;
		padding: 4px 9px;
		border-radius: 6px;
		background: var(--surface);
		box-shadow: inset 0 0 0 1px var(--line);
		font-family: var(--font-mono);
		font-size: 12.5px;
		color: var(--muted);
	}

	@media (max-width: 1000px) {
		.flow {
			grid-template-columns: repeat(2, minmax(0, 1fr));
			gap: 48px 32px;
		}
		/* In two columns the connectors would point at nothing, so drop them */
		li::before,
		li::after {
			display: none;
		}
	}

	@media (max-width: 640px) {
		.sync {
			padding: 88px 0;
		}
		.head {
			margin-bottom: 40px;
		}
		.flow {
			grid-template-columns: 1fr;
			gap: 36px;
		}
	}
</style>
