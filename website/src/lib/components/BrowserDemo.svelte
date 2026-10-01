<script lang="ts">
	import type { DemoPlayer } from '$lib/demo/player.svelte';
	import LyriqPopup from './LyriqPopup.svelte';
	import LyriqWidget from './LyriqWidget.svelte';
	import MusicPlayer from './MusicPlayer.svelte';
	import SampleSite from './SampleSite.svelte';
	import CaretLeft from 'phosphor-svelte/lib/CaretLeft';
	import CaretRight from 'phosphor-svelte/lib/CaretRight';
	import Lock from 'phosphor-svelte/lib/Lock';
	import { quintOut } from 'svelte/easing';
	import type { TransitionConfig } from 'svelte/transition';

	let { player }: { player: DemoPlayer } = $props();

	let popupWrap: HTMLDivElement | undefined = $state();

	const tabs = [
		{ id: 'ytm', label: 'YouTube Music', url: 'music.youtube.com/watch' },
		{ id: 'site', label: 'Brew Guide: making coffee by hand', url: 'brewguide.example/pour-over' }
	] as const;

	/**
	 * The popup grows out of the toolbar button and shrinks back into it.
	 * Reduced motion keeps the fade and drops the scale.
	 */
	function popIn(_node: Element, { duration }: { duration: number }): TransitionConfig {
		const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
		return {
			duration,
			easing: quintOut,
			css: (t) => (reduce ? `opacity: ${t}` : `opacity: ${t}; transform: scale(${0.95 + 0.05 * t})`)
		};
	}

	const url = $derived(tabs.find((t) => t.id === player.tab)?.url ?? '');

	function onWindowPointerDown(e: PointerEvent) {
		if (player.popupOpen && popupWrap && !popupWrap.contains(e.target as Node)) {
			player.popupOpen = false;
		}
	}
</script>

<svelte:window
	onpointerdown={onWindowPointerDown}
	onkeydown={(e) => e.key === 'Escape' && (player.popupOpen = false)}
	onresize={() => (player.pos = null)}
/>

<div class="browser">
	<div class="tabstrip" role="tablist" aria-label="Demo browser tabs">
		<span class="lights" aria-hidden="true"><i></i><i></i><i></i></span>
		{#each tabs as t (t.id)}
			<button
				role="tab"
				class="tab"
				aria-selected={player.tab === t.id}
				aria-controls="demo-viewport"
				onclick={() => (player.tab = t.id)}
			>
				{#if t.id === 'ytm'}
					<span class="fav ytm" aria-hidden="true"></span>
				{:else}
					<span class="fav site" aria-hidden="true">B</span>
				{/if}
				<span class="tab-label">{t.label}</span>
			</button>
		{/each}
	</div>

	<div class="toolbar">
		<span class="navs" aria-hidden="true">
			<CaretLeft size={16} />
			<CaretRight size={16} />
		</span>
		<div class="omnibox">
			<Lock size={13} />
			<span>{url}</span>
		</div>
		<div class="ext" bind:this={popupWrap}>
			<button
				class="ext-btn"
				class:open={player.popupOpen}
				aria-label="Lyriq extension"
				aria-expanded={player.popupOpen}
				aria-haspopup="dialog"
				onclick={() => (player.popupOpen = !player.popupOpen)}
			>
				<img src="/icons/icon32.png" alt="" width="18" height="18" />
			</button>
			{#if player.popupOpen}
				<div class="popup-anchor" in:popIn={{ duration: 200 }} out:popIn={{ duration: 150 }}>
					<LyriqPopup {player} />
				</div>
			{/if}
		</div>
	</div>

	<div class="viewport" id="demo-viewport" role="tabpanel">
		{#if player.tab === 'ytm'}
			<MusicPlayer {player} />
		{:else}
			<SampleSite />
		{/if}
		<LyriqWidget {player} />
	</div>
</div>

<style>
	.browser {
		border-radius: 16px;
		overflow: hidden;
		background: #1d1d22;
		box-shadow:
			var(--shadow),
			0 0 0 1px var(--line);
		min-width: 0;
	}

	.tabstrip {
		display: flex;
		align-items: flex-end;
		gap: 2px;
		padding: 8px 10px 0;
		background: #2b2b31;
		min-width: 0;
	}

	.lights {
		display: flex;
		gap: 7px;
		padding: 0 10px 12px 4px;
		flex-shrink: 0;
	}

	.lights i {
		width: 11px;
		height: 11px;
		border-radius: 50%;
		background: #ff5f57;
	}
	.lights i:nth-child(2) {
		background: #febc2e;
	}
	.lights i:nth-child(3) {
		background: #28c840;
	}

	.tab {
		all: unset;
		box-sizing: border-box;
		display: flex;
		align-items: center;
		gap: 8px;
		min-width: 0;
		flex: 0 1 220px;
		padding: 8px 12px;
		border-radius: 9px 9px 0 0;
		font-size: 12px;
		color: rgba(255, 255, 255, 0.6);
		cursor: pointer;
	}

	.tab:hover {
		background: rgba(255, 255, 255, 0.05);
	}

	.tab:focus-visible {
		outline: 2px solid var(--brand);
		outline-offset: -2px;
	}

	.tab[aria-selected='true'] {
		background: #1d1d22;
		color: #fff;
	}

	.tab-label {
		white-space: nowrap;
		overflow: hidden;
		text-overflow: ellipsis;
	}

	.fav {
		width: 14px;
		height: 14px;
		border-radius: 50%;
		flex-shrink: 0;
	}

	.fav.ytm {
		background: radial-gradient(circle, #fff 0 24%, #f03 25% 100%);
	}

	.fav.site {
		border-radius: 3px;
		background: #24543f;
		color: #fff;
		font: 600 10px/14px var(--font-newsreader);
		text-align: center;
	}

	.toolbar {
		display: flex;
		align-items: center;
		gap: 10px;
		padding: 7px 10px;
		background: #1d1d22;
		border-bottom: 1px solid rgba(255, 255, 255, 0.06);
	}

	.navs {
		display: flex;
		gap: 4px;
	}

	.navs {
		color: rgba(255, 255, 255, 0.45);
	}

	.omnibox :global(svg) {
		flex-shrink: 0;
		color: rgba(255, 255, 255, 0.45);
	}

	.omnibox {
		flex: 1;
		min-width: 0;
		display: flex;
		align-items: center;
		gap: 8px;
		padding: 6px 12px;
		border-radius: 999px;
		background: #2b2b31;
		font-size: 12.5px;
		color: rgba(255, 255, 255, 0.75);
	}

	.omnibox span {
		white-space: nowrap;
		overflow: hidden;
		text-overflow: ellipsis;
	}

	.ext {
		position: relative;
	}

	.ext-btn {
		all: unset;
		position: relative;
		width: 32px;
		height: 32px;
		display: grid;
		place-items: center;
		border-radius: 8px;
		cursor: pointer;
		transition:
			transform 160ms var(--ease-out),
			background-color 150ms ease;
	}

	.ext-btn:active {
		transform: scale(0.94);
	}

	.ext-btn:hover,
	.ext-btn.open {
		background: rgba(255, 255, 255, 0.1);
	}

	.ext-btn:focus-visible {
		outline: 2px solid var(--brand);
	}

	.popup-anchor {
		position: absolute;
		top: calc(100% + 8px);
		right: 0;
		z-index: 40;
		transform-origin: top right;
	}

	.viewport {
		position: relative;
		height: clamp(480px, 62vh, 600px);
		overflow: hidden;
		container: viewport / inline-size;
	}

	@media (max-width: 640px) {
		.lights {
			display: none;
		}
		.navs {
			display: none;
		}
		.viewport {
			height: 520px;
		}
	}
</style>
