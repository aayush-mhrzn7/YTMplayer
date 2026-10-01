<script lang="ts">
	import type { DemoPlayer } from '$lib/demo/player.svelte';
	import { formatTime } from '$lib/demo/tracks';
	import Cover from './Cover.svelte';
	import Books from 'phosphor-svelte/lib/Books';
	import Compass from 'phosphor-svelte/lib/Compass';
	import House from 'phosphor-svelte/lib/House';
	import Pause from 'phosphor-svelte/lib/Pause';
	import Play from 'phosphor-svelte/lib/Play';
	import Repeat from 'phosphor-svelte/lib/Repeat';
	import RepeatOnce from 'phosphor-svelte/lib/RepeatOnce';
	import Shuffle from 'phosphor-svelte/lib/Shuffle';
	import SkipBack from 'phosphor-svelte/lib/SkipBack';
	import SkipForward from 'phosphor-svelte/lib/SkipForward';

	let { player }: { player: DemoPlayer } = $props();

	const pct = $derived((player.time / player.track.duration) * 100);

	function seekFromBar(e: MouseEvent) {
		const bar = e.currentTarget as HTMLElement;
		const r = bar.getBoundingClientRect();
		player.seek(((e.clientX - r.left) / r.width) * player.track.duration);
	}

	function seekKey(e: KeyboardEvent) {
		if (e.key === 'ArrowRight') player.seekBy(5);
		else if (e.key === 'ArrowLeft') player.seekBy(-5);
	}
</script>

<!-- A sample music player standing in for the YouTube Music tab -->
<div class="ytm">
	<aside class="nav" aria-label="Sample player navigation">
		<div class="brand">
			<span class="dot" aria-hidden="true"></span>
			<span>Music</span>
		</div>
		<a class="nav-item current" href="#demo" aria-current="page" onclick={(e) => e.preventDefault()}>
			<House size={18} weight="fill" />
			Home
		</a>
		<a class="nav-item" href="#demo" onclick={(e) => e.preventDefault()}>
			<Compass size={18} />
			Explore
		</a>
		<a class="nav-item" href="#demo" onclick={(e) => e.preventDefault()}>
			<Books size={18} />
			Library
		</a>
	</aside>

	<section class="main">
		<div class="now">
			<Cover track={player.track} radius="12px" class="big-cover" />
			<div class="now-meta">
				<p class="eyebrow">Now playing</p>
				<h3>{player.track.title}</h3>
				<p class="by">{player.track.artist} · {player.track.album}</p>
			</div>
		</div>

		<div class="queue">
			<h4>Up next</h4>
			<ol>
				{#each player.tracks as t, i (t.id)}
					<li>
						<button class="row" class:current={i === player.index} onclick={() => player.select(i)}>
							<Cover track={t} size="36px" radius="4px" />
							<span class="row-meta">
								<span class="row-title">{t.title}</span>
								<span class="row-artist">{t.artist}</span>
							</span>
							<span class="row-time">
								{#if i === player.index && player.playing}
									<span class="eq" aria-label="Playing"><i></i><i></i><i></i></span>
								{:else}
									{formatTime(t.duration)}
								{/if}
							</span>
						</button>
					</li>
				{/each}
			</ol>
		</div>
	</section>

	<footer class="bar">
		<div
			class="progress"
			role="slider"
			tabindex="0"
			aria-label="Song progress"
			aria-valuemin={0}
			aria-valuemax={Math.round(player.track.duration)}
			aria-valuenow={Math.round(player.time)}
			aria-valuetext={formatTime(player.time)}
			onclick={seekFromBar}
			onkeydown={seekKey}
		>
			<div class="fill" style:width="{pct}%"></div>
		</div>
		<div class="bar-inner">
			<div class="controls">
				<button class="ic" aria-label="Previous" onclick={() => player.previous()}>
					<SkipBack size={22} weight="fill" />
				</button>
				<button class="ic play" aria-label={player.playing ? 'Pause' : 'Play'} onclick={() => player.toggle()}>
					{#if player.playing}
						<Pause size={28} weight="fill" />
					{:else}
						<Play size={28} weight="fill" />
					{/if}
				</button>
				<button class="ic" aria-label="Next" onclick={() => player.next()}>
					<SkipForward size={22} weight="fill" />
				</button>
				<span class="clock">{formatTime(player.time)} / {formatTime(player.track.duration)}</span>
			</div>
			<div class="mini">
				<Cover track={player.track} size="34px" radius="4px" />
				<span class="mini-meta">
					<span class="row-title">{player.track.title}</span>
					<span class="row-artist">{player.track.artist}</span>
				</span>
			</div>
			<div class="modes">
				<button
					class="ic small"
					class:on={player.repeat !== 'NONE'}
					aria-label="Repeat: {player.repeat.toLowerCase()}"
					onclick={() => player.cycleRepeat()}
				>
					{#if player.repeat === 'ONE'}<RepeatOnce size={20} />{:else}<Repeat size={20} />{/if}
				</button>
				<button
					class="ic small"
					class:on={player.shuffle}
					aria-label="Shuffle"
					aria-pressed={player.shuffle}
					onclick={() => player.toggleShuffle()}
				>
					<Shuffle size={20} />
				</button>
			</div>
		</div>
	</footer>
</div>

<style>
	.ytm {
		position: absolute;
		inset: 0;
		display: grid;
		grid-template-columns: 168px 1fr;
		grid-template-rows: 1fr auto;
		background: #030303;
		color: #fff;
		text-align: left;
	}

	.nav {
		grid-row: 1;
		padding: 16px 10px;
		display: flex;
		flex-direction: column;
		gap: 2px;
		border-right: 1px solid rgba(255, 255, 255, 0.08);
	}

	.brand {
		display: flex;
		align-items: center;
		gap: 8px;
		font-weight: 500;
		font-size: 17px;
		letter-spacing: -0.02em;
		padding: 0 10px 16px;
	}

	.dot {
		width: 22px;
		height: 22px;
		border-radius: 50%;
		background: radial-gradient(circle at center, #fff 0 22%, #f03 23% 100%);
	}

	.nav-item {
		display: flex;
		align-items: center;
		gap: 12px;
		padding: 9px 10px;
		border-radius: 8px;
		color: rgba(255, 255, 255, 0.75);
		font-size: 13px;
		text-decoration: none;
	}

	.nav-item.current {
		background: rgba(255, 255, 255, 0.1);
		color: #fff;
	}

	.main {
		min-height: 0;
		overflow: auto;
		padding: 24px 28px 24px;
		display: grid;
		grid-template-columns: minmax(0, 1fr) minmax(220px, 300px);
		gap: 28px;
		align-items: start;
	}

	.now {
		display: flex;
		flex-direction: column;
		gap: 16px;
		max-width: 340px;
	}

	.now :global(.big-cover) {
		width: 100% !important;
		height: auto !important;
		aspect-ratio: 1;
		box-shadow: 0 20px 50px rgba(0, 0, 0, 0.6);
	}

	.eyebrow {
		margin: 0;
		font-size: 13px;
		color: rgba(255, 255, 255, 0.5);
	}

	h3 {
		margin: 4px 0 2px;
		font-size: 22px;
		letter-spacing: -0.02em;
		line-height: 1.15;
	}

	.by {
		margin: 0;
		font-size: 13px;
		color: rgba(255, 255, 255, 0.6);
	}

	.queue h4 {
		margin: 0 0 8px;
		font-size: 15px;
		font-weight: 500;
		color: rgba(255, 255, 255, 0.85);
		padding-bottom: 10px;
		border-bottom: 1px solid rgba(255, 255, 255, 0.1);
	}

	ol {
		list-style: none;
		margin: 0;
		padding: 0;
	}

	.row {
		all: unset;
		box-sizing: border-box;
		width: 100%;
		display: flex;
		align-items: center;
		gap: 12px;
		padding: 7px 8px;
		border-radius: 6px;
		cursor: pointer;
	}

	.row:hover,
	.row:focus-visible {
		background: rgba(255, 255, 255, 0.08);
	}

	.row.current {
		background: rgba(255, 255, 255, 0.12);
	}

	.row-meta,
	.mini-meta {
		flex: 1;
		min-width: 0;
		display: flex;
		flex-direction: column;
	}

	.row-title {
		font-size: 13px;
		font-weight: 500;
		white-space: nowrap;
		overflow: hidden;
		text-overflow: ellipsis;
	}

	.row-artist {
		font-size: 12px;
		color: rgba(255, 255, 255, 0.55);
		white-space: nowrap;
		overflow: hidden;
		text-overflow: ellipsis;
	}

	.row-time {
		font-size: 12px;
		color: rgba(255, 255, 255, 0.55);
		font-variant-numeric: tabular-nums;
	}

	.eq {
		display: inline-flex;
		gap: 2px;
		align-items: flex-end;
		height: 12px;
	}

	.eq i {
		width: 3px;
		background: #fff;
		animation: eq 0.9s ease-in-out infinite;
	}

	.eq i:nth-child(2) {
		animation-delay: -0.3s;
	}
	.eq i:nth-child(3) {
		animation-delay: -0.6s;
	}

	@keyframes eq {
		0%,
		100% {
			height: 3px;
		}
		50% {
			height: 12px;
		}
	}

	.bar {
		grid-column: 1 / -1;
		background: #212121;
	}

	.progress {
		height: 4px;
		background: rgba(255, 255, 255, 0.15);
		cursor: pointer;
		position: relative;
	}

	.progress:hover {
		height: 6px;
		margin-top: -2px;
	}

	.fill {
		height: 100%;
		background: #f03;
	}

	.bar-inner {
		display: grid;
		grid-template-columns: 1fr auto 1fr;
		align-items: center;
		gap: 16px;
		padding: 8px 16px;
		height: 60px;
	}

	.controls {
		display: flex;
		align-items: center;
		gap: 4px;
	}

	.clock {
		font-size: 12px;
		color: rgba(255, 255, 255, 0.6);
		margin-left: 8px;
		font-variant-numeric: tabular-nums;
		white-space: nowrap;
	}

	.mini {
		display: flex;
		align-items: center;
		gap: 10px;
		min-width: 0;
		max-width: 260px;
	}

	.modes {
		justify-self: end;
		display: flex;
		gap: 4px;
	}

	.ic {
		all: unset;
		width: 36px;
		height: 36px;
		display: grid;
		place-items: center;
		border-radius: 50%;
		cursor: pointer;
		color: #fff;
	}

	.ic:hover,
	.ic:focus-visible {
		background: rgba(255, 255, 255, 0.1);
	}

	.ic.small {
		color: rgba(255, 255, 255, 0.5);
	}

	.ic.small.on {
		color: #fff;
	}

	@container viewport (max-width: 760px) {
		.ytm {
			grid-template-columns: 1fr;
		}
		.nav {
			display: none;
		}
		.main {
			grid-template-columns: 1fr;
			padding: 18px;
			gap: 18px;
		}
		.now {
			flex-direction: row;
			align-items: center;
			max-width: none;
		}
		.now :global(.big-cover) {
			width: 96px !important;
		}
		.queue {
			display: none;
		}
		.bar-inner {
			grid-template-columns: auto 1fr auto;
			gap: 8px;
			padding: 8px 10px;
		}
		.clock {
			display: none;
		}
	}

	@container viewport (max-width: 460px) {
		.mini {
			display: none;
		}
		.bar-inner {
			grid-template-columns: 1fr auto;
		}
	}
</style>
