<script lang="ts">
	import type { DemoPlayer } from '$lib/demo/player.svelte';
	import Cover from './Cover.svelte';

	let { player }: { player: DemoPlayer } = $props();

	const status = $derived.by(() => {
		if (player.lyricsStatus === 'loading') return 'Loading lyrics…';
		if (player.lyricsStatus === 'instrumental') return 'Instrumental';
		return player.playing ? 'Playing' : 'Paused';
	});
</script>

<!-- Ported from extension/popup.html + popup.css -->
<div class="popup" role="dialog" aria-label="Lyriq extension popup">
	<div class="art">
		<Cover track={player.track} radius="0" />
		<div class="shade">
			<div class="title">{player.track.title}</div>
			<div class="artist">{player.track.artist}</div>
			<div class="status">{status}</div>
		</div>
	</div>
	<div class="footer">
		<label class="toggle">
			<input
				type="checkbox"
				checked={player.enabled}
				onchange={(e) => player.setEnabled(e.currentTarget.checked)}
			/>
			<span>Overlay</span>
		</label>
		<label class="toggle">
			<input type="checkbox" bind:checked={player.transportEnabled} />
			<span>Controls</span>
		</label>
	</div>
</div>

<style>
	.popup {
		width: 220px;
		height: 220px;
		display: grid;
		grid-template-rows: 1fr auto;
		overflow: hidden;
		background: #121216;
		color: #f2f2f4;
		border-radius: 10px;
		box-shadow:
			0 18px 50px rgba(0, 0, 0, 0.5),
			0 0 0 1px rgba(255, 255, 255, 0.08);
		text-align: left;
	}

	.art {
		position: relative;
		min-height: 0;
		overflow: hidden;
		background: #2a2a30;
	}

	.shade {
		position: absolute;
		left: 0;
		right: 0;
		bottom: 0;
		padding: 28px 10px 8px;
		background: linear-gradient(
			to top,
			rgba(10, 10, 14, 0.92) 0%,
			rgba(10, 10, 14, 0.55) 55%,
			transparent 100%
		);
	}

	.title {
		font-size: 12px;
		font-weight: 500;
		line-height: 1.2;
		white-space: nowrap;
		overflow: hidden;
		text-overflow: ellipsis;
	}

	.artist {
		font-size: 10px;
		color: rgba(242, 242, 244, 0.7);
		white-space: nowrap;
		overflow: hidden;
		text-overflow: ellipsis;
		margin-top: 2px;
	}

	.status {
		font-size: 9px;
		color: rgba(242, 242, 244, 0.45);
		margin-top: 2px;
	}

	.footer {
		display: flex;
		align-items: center;
		gap: 10px;
		padding: 8px 10px;
		background: #121216;
		border-top: 1px solid rgba(255, 255, 255, 0.06);
	}

	.toggle {
		display: flex;
		align-items: center;
		gap: 4px;
		font-size: 10px;
		cursor: pointer;
		user-select: none;
		color: rgba(242, 242, 244, 0.75);
	}

	.toggle input {
		accent-color: #3b59ff;
		width: 12px;
		height: 12px;
		margin: 0;
	}
</style>
