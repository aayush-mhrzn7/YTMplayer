<script lang="ts">
	import type { DemoPlayer } from '$lib/demo/player.svelte';
	import { formatTime } from '$lib/demo/tracks';
	import Cover from './Cover.svelte';
	import Minus from 'phosphor-svelte/lib/Minus';
	import Pause from 'phosphor-svelte/lib/Pause';
	import Play from 'phosphor-svelte/lib/Play';
	import Plus from 'phosphor-svelte/lib/Plus';
	import Repeat from 'phosphor-svelte/lib/Repeat';
	import RepeatOnce from 'phosphor-svelte/lib/RepeatOnce';
	import Shuffle from 'phosphor-svelte/lib/Shuffle';
	import SkipBack from 'phosphor-svelte/lib/SkipBack';
	import SkipForward from 'phosphor-svelte/lib/SkipForward';
	import X from 'phosphor-svelte/lib/X';

	let {
		player,
		variant = 'demo'
	}: {
		player: DemoPlayer;
		/** `demo` floats inside the fake browser and can be dragged; `hero` is a static showcase */
		variant?: 'demo' | 'hero';
	} = $props();

	const DRAG_THRESHOLD_PX = 5;

	/** Apple's rubber-band curve: the further past the edge, the less the panel follows */
	function rubberband(overshoot: number, dimension: number, constant = 0.55): number {
		return (overshoot * dimension * constant) / (dimension + constant * Math.abs(overshoot));
	}

	// Overshoot past the viewport edge while dragging; eases back to 0 on release
	let stretch = $state({ x: 0, y: 0 });
	let dragging = $state(false);

	let panel: HTMLDivElement | undefined = $state();
	let scrub = $state<number | null>(null);

	let shown = $state({ prev: '', active: '', next: '' });
	let swapping = $state(false);
	let lastIdx = -2;

	const visible = $derived(variant === 'hero' || player.enabled);
	const track = $derived(player.track);
	const duration = $derived(track.duration);
	const current = $derived(scrub ?? Math.min(player.time, duration));
	const seekPct = $derived(duration > 0 ? (current / duration) * 100 : 0);

	// Same three-line swap as the extension: fade out, replace text, fade in
	$effect(() => {
		const idx = player.activeIndex;
		const lines = track.lines;
		const target =
			idx < 0
				? { prev: '', active: '', next: lines[0]?.text ?? '' }
				: {
						prev: lines[idx - 1]?.text ?? '',
						active: lines[idx]?.text ?? '',
						next: lines[idx + 1]?.text ?? ''
					};
		const animate = lastIdx >= 0 && idx === lastIdx + 1;
		lastIdx = idx;
		if (!animate) {
			shown = target;
			swapping = false;
			return;
		}
		swapping = true;
		const t = setTimeout(() => {
			shown = target;
			swapping = false;
		}, 90);
		return () => clearTimeout(t);
	});

	let drag: {
		id: number;
		x: number;
		y: number;
		left: number;
		bottom: number;
		moved: boolean;
	} | null = null;

	function onPointerDown(e: PointerEvent) {
		const target = e.target as HTMLElement;
		if (target.closest('.btn') || target.closest('.art-btn') || !panel) return;
		const parent = panel.offsetParent as HTMLElement | null;
		if (variant === 'demo' && parent) {
			const r = panel.getBoundingClientRect();
			const pr = parent.getBoundingClientRect();
			drag = {
				id: e.pointerId,
				x: e.clientX,
				y: e.clientY,
				left: r.left - pr.left,
				bottom: pr.bottom - r.bottom,
				moved: false
			};
		} else {
			drag = { id: e.pointerId, x: e.clientX, y: e.clientY, left: 0, bottom: 0, moved: false };
		}
		(e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
	}

	function onPointerMove(e: PointerEvent) {
		if (!drag || e.pointerId !== drag.id || !panel || variant !== 'demo') return;
		const dx = e.clientX - drag.x;
		const dy = e.clientY - drag.y;
		if (!drag.moved && dx * dx + dy * dy < DRAG_THRESHOLD_PX ** 2) return;
		drag.moved = true;
		dragging = true;
		const parent = panel.offsetParent as HTMLElement;
		const maxLeft = parent.clientWidth - panel.offsetWidth - 8;
		const maxBottom = parent.clientHeight - panel.offsetHeight - 8;
		const rawLeft = drag.left + dx;
		// Dragging down (dy > 0) decreases bottom inset
		const rawBottom = drag.bottom - dy;
		const left = Math.min(Math.max(8, rawLeft), maxLeft);
		const bottom = Math.min(Math.max(8, rawBottom), maxBottom);
		player.pos = { left: Math.round(left), bottom: Math.round(bottom) };
		stretch = {
			x: rubberband(rawLeft - left, parent.clientWidth),
			y: rubberband(rawBottom - bottom, parent.clientHeight)
		};
	}

	function onPointerUp(e: PointerEvent) {
		if (!drag || e.pointerId !== drag.id) return;
		const wasClick = !drag.moved;
		drag = null;
		dragging = false;
		stretch = { x: 0, y: 0 };
		// Tap header while minimized → expand
		if (wasClick && player.minimized) {
			player.minimized = false;
			player.minimizePinned = false;
		}
	}

	const repeatLabel = $derived(
		player.repeat === 'ALL' ? 'Repeat all' : player.repeat === 'ONE' ? 'Repeat one' : 'Repeat off'
	);
</script>

{#if visible}
	<div
		bind:this={panel}
		class="panel {variant}"
		class:minimized={player.minimized}
		class:dragging
		style:--accent-rgb={track.accentRgb}
		style:left={variant === 'demo' && player.pos ? `${player.pos.left}px` : null}
		style:bottom={variant === 'demo' && player.pos ? `${player.pos.bottom}px` : null}
		style:right={variant === 'demo' && player.pos ? 'auto' : null}
		style:transform={stretch.x || stretch.y ? `translate(${stretch.x}px, ${-stretch.y}px)` : null}
	>
		<!-- svelte-ignore a11y_no_static_element_interactions -->
		<div
			class="header"
			class:draggable={variant === 'demo'}
			onpointerdown={onPointerDown}
			onpointermove={onPointerMove}
			onpointerup={onPointerUp}
			onpointercancel={onPointerUp}
		>
			{#if variant === 'demo'}
				<button
					class="art-btn"
					type="button"
					title="Open YouTube Music tab"
					aria-label="Open YouTube Music tab"
					onclick={() => (player.tab = 'ytm')}
				>
					<Cover {track} size="40px" />
				</button>
			{:else}
				<Cover {track} size="40px" />
			{/if}
			<div class="meta">
				<div class="title">{track.title}</div>
				<div class="artist">{track.artist}</div>
			</div>
			<div class="actions">
				<button
					class="btn minimize"
					type="button"
					title={player.minimized ? 'Maximize' : 'Minimize'}
					aria-label={player.minimized ? 'Maximize' : 'Minimize'}
					onclick={() => player.toggleMinimize()}
					>{#if player.minimized}<Plus size={16} weight="bold" />{:else}<Minus size={16} weight="bold" />{/if}</button
				>
				{#if variant === 'demo'}
					<button
						class="btn close"
						type="button"
						title="Close"
						aria-label="Close"
						onclick={() => player.close()}><X size={16} weight="bold" /></button
					>
				{/if}
			</div>
		</div>

		<div class="panel-body" aria-hidden={player.minimized}>
			<div class="panel-body-inner">
				<div class="lyrics" aria-live="polite">
					{#if player.lyricsStatus === 'loading'}
						<div class="status">Loading lyrics…</div>
					{:else if player.lyricsStatus === 'instrumental'}
						<div class="status">Instrumental</div>
					{:else}
						<div class="lyrics-view">
							<div class="line prev" class:empty={!shown.prev} class:swap={swapping}>
								{shown.prev}
							</div>
							<div class="line active" class:empty={!shown.active} class:swap={swapping}>
								{shown.active}
							</div>
							<div class="line next" class:empty={!shown.next} class:swap={swapping}>
								{shown.next}
							</div>
						</div>
					{/if}
				</div>

				{#if player.transportEnabled}
					<div class="transport">
						<div class="seek-row">
							<span class="time">{formatTime(current)}</span>
							<input
								class="seek"
								type="range"
								min="0"
								max={duration}
								step="0.1"
								value={current}
								style:--seek-pct="{seekPct}%"
								aria-label="Seek"
								oninput={(e) => (scrub = Number(e.currentTarget.value))}
								onchange={(e) => {
									player.seek(Number(e.currentTarget.value));
									scrub = null;
								}}
							/>
							<span class="time duration">{formatTime(duration)}</span>
						</div>
						<div class="transport-controls">
							<button
								class="btn transport-btn shuffle"
								class:active={player.shuffle}
								type="button"
								title={player.shuffle ? 'Shuffle on' : 'Shuffle off'}
								aria-label={player.shuffle ? 'Shuffle on' : 'Shuffle off'}
								aria-pressed={player.shuffle}
								onclick={() => player.toggleShuffle()}><Shuffle size={18} weight="bold" /></button
							>
							<button
								class="btn transport-btn"
								type="button"
								title="Previous"
								aria-label="Previous"
								onclick={() => player.previous()}><SkipBack size={18} weight="fill" /></button
							>
							<button
								class="btn transport-btn seek-step"
								type="button"
								title="Back 5 seconds"
								aria-label="Back 5 seconds"
								onclick={() => player.seekBy(-5)}>−5</button
							>
							<button
								class="btn transport-btn play-toggle"
								type="button"
								title={player.playing ? 'Pause' : 'Play'}
								aria-label={player.playing ? 'Pause' : 'Play'}
								onclick={() => player.toggle()}
								>{#if player.playing}<Pause size={20} weight="fill" />{:else}<Play size={20} weight="fill" />{/if}</button
							>
							<button
								class="btn transport-btn seek-step"
								type="button"
								title="Forward 5 seconds"
								aria-label="Forward 5 seconds"
								onclick={() => player.seekBy(5)}>+5</button
							>
							<button
								class="btn transport-btn"
								type="button"
								title="Next"
								aria-label="Next"
								onclick={() => player.next()}><SkipForward size={18} weight="fill" /></button
							>
							<button
								class="btn transport-btn repeat"
								class:active={player.repeat !== 'NONE'}
								class:repeat-one={player.repeat === 'ONE'}
								type="button"
								title={repeatLabel}
								aria-label={repeatLabel}
								onclick={() => player.cycleRepeat()}
								>{#if player.repeat === 'ONE'}<RepeatOnce size={18} weight="bold" />{:else}<Repeat size={18} weight="bold" />{/if}</button
							>
						</div>
					</div>
				{/if}
			</div>
		</div>
	</div>
{/if}

<style>
	/* Ported from extension/src/content/overlay.css */
	.panel {
		--accent-rgb: 18, 18, 22;
		width: min(320px, calc(100% - 16px));
		display: flex;
		flex-direction: column;
		background:
			linear-gradient(
				155deg,
				rgba(var(--accent-rgb), 0.52) 0%,
				rgba(var(--accent-rgb), 0.28) 48%,
				rgba(12, 12, 16, 0.55) 100%
			),
			rgba(16, 16, 20, 0.55);
		backdrop-filter: blur(20px) saturate(1.45);
		-webkit-backdrop-filter: blur(20px) saturate(1.45);
		color: #f2f2f4;
		border: 1px solid rgba(255, 255, 255, 0.1);
		border-radius: 14px;
		box-shadow:
			0 12px 40px rgba(0, 0, 0, 0.45),
			inset 0 1px 0 rgba(255, 255, 255, 0.08);
		overflow: hidden;
		user-select: none;
		-webkit-user-select: none;
		text-align: left;
	}

	.panel.demo {
		position: absolute;
		z-index: 20;
		right: 16px;
		bottom: 16px;
		/* Settles back from a rubber-band stretch, critically damped (no bounce) */
		transition: transform 400ms var(--ease-out);
	}

	/* 1:1 with the pointer while held */
	.panel.dragging {
		transition: none;
	}

	.panel.hero {
		position: relative;
		width: min(340px, 100%);
	}

	.header {
		display: flex;
		align-items: center;
		gap: 10px;
		padding: 10px 10px 8px 12px;
		border-bottom: 1px solid rgba(255, 255, 255, 0.06);
		transition:
			border-color 0.28s ease,
			padding 0.28s ease;
		touch-action: none;
	}

	.header.draggable {
		cursor: grab;
	}

	.header.draggable:active {
		cursor: grabbing;
	}

	.panel.minimized .header {
		border-bottom-color: transparent;
		padding-bottom: 10px;
	}

	.art-btn {
		appearance: none;
		border: none;
		padding: 0;
		margin: 0;
		background: transparent;
		cursor: pointer;
		border-radius: 8px;
		flex-shrink: 0;
		line-height: 0;
	}

	.art-btn:hover {
		opacity: 0.9;
	}

	.art-btn:focus-visible {
		outline: 2px solid rgba(255, 255, 255, 0.55);
		outline-offset: 2px;
	}

	.meta {
		flex: 1;
		min-width: 0;
	}

	.title {
		font-size: 13px;
		font-weight: 500;
		white-space: nowrap;
		overflow: hidden;
		text-overflow: ellipsis;
	}

	.artist {
		font-size: 11px;
		color: rgba(242, 242, 244, 0.65);
		white-space: nowrap;
		overflow: hidden;
		text-overflow: ellipsis;
		margin-top: 2px;
	}

	.actions {
		display: flex;
		gap: 2px;
		flex-shrink: 0;
	}

	.panel-body {
		display: grid;
		grid-template-rows: 1fr;
		opacity: 1;
		transition:
			grid-template-rows 0.34s var(--ease-drawer),
			opacity 0.24s ease;
	}

	.panel.minimized .panel-body {
		grid-template-rows: 0fr;
		opacity: 0;
		pointer-events: none;
	}

	.panel-body-inner {
		overflow: hidden;
		min-height: 0;
	}

	.lyrics {
		position: relative;
		padding: 14px 18px 18px;
		min-height: 118px;
	}

	.lyrics-view {
		display: flex;
		flex-direction: column;
		justify-content: center;
		gap: 8px;
		min-height: 96px;
	}

	.line {
		font-size: 14px;
		line-height: 1.35;
		text-align: center;
		color: rgba(242, 242, 244, 0.4);
		min-height: 1.35em;
		transition:
			opacity 0.18s ease,
			color 0.18s ease,
			transform 0.18s ease,
			font-size 0.18s ease;
		opacity: 1;
		transform: translateY(0);
	}

	.line.empty {
		opacity: 0;
	}

	.line.prev,
	.line.next {
		font-size: 13px;
		font-weight: 500;
		color: rgba(242, 242, 244, 0.42);
	}

	.line.active {
		font-size: 16px;
		font-weight: 600;
		color: #fff;
	}

	.line.swap {
		opacity: 0;
		transform: translateY(4px);
	}

	.status {
		display: grid;
		place-items: center;
		min-height: 96px;
		color: rgba(242, 242, 244, 0.55);
		font-size: 13px;
		text-align: center;
		padding: 0 12px;
	}

	.transport {
		display: flex;
		flex-direction: column;
		gap: 6px;
		padding: 8px 12px 10px;
		border-top: 1px solid rgba(255, 255, 255, 0.06);
	}

	.seek-row {
		display: flex;
		align-items: center;
		gap: 8px;
	}

	.time {
		font-size: 11px;
		font-variant-numeric: tabular-nums;
		color: rgba(242, 242, 244, 0.55);
		min-width: 2.4em;
		flex-shrink: 0;
	}

	.time.duration {
		text-align: right;
	}

	.seek {
		--seek-pct: 0%;
		flex: 1;
		min-width: 0;
		height: 18px;
		margin: 0;
		appearance: none;
		background: transparent;
		cursor: pointer;
	}

	.seek::-webkit-slider-runnable-track {
		height: 4px;
		border-radius: 999px;
		background: linear-gradient(
			to right,
			rgba(255, 255, 255, 0.85) 0%,
			rgba(255, 255, 255, 0.85) var(--seek-pct),
			rgba(255, 255, 255, 0.18) var(--seek-pct),
			rgba(255, 255, 255, 0.18) 100%
		);
	}

	.seek::-webkit-slider-thumb {
		appearance: none;
		width: 12px;
		height: 12px;
		margin-top: -4px;
		border-radius: 50%;
		background: #fff;
		box-shadow: 0 1px 4px rgba(0, 0, 0, 0.35);
		border: none;
	}

	.seek::-moz-range-track {
		height: 4px;
		border-radius: 999px;
		background: rgba(255, 255, 255, 0.18);
	}

	.seek::-moz-range-progress {
		height: 4px;
		border-radius: 999px;
		background: rgba(255, 255, 255, 0.85);
	}

	.seek::-moz-range-thumb {
		width: 12px;
		height: 12px;
		border-radius: 50%;
		background: #fff;
		border: none;
	}

	.transport-controls {
		display: flex;
		align-items: center;
		justify-content: center;
		gap: 4px;
	}

	.btn {
		appearance: none;
		border: none;
		background: transparent;
		color: rgba(242, 242, 244, 0.7);
		width: 28px;
		height: 28px;
		border-radius: 8px;
		cursor: pointer;
		font: inherit;
		font-size: 14px;
		line-height: 1;
		display: grid;
		place-items: center;
		padding: 0;
	}

	.btn:hover {
		background: rgba(255, 255, 255, 0.08);
		color: #fff;
	}

	.btn:focus-visible {
		outline: 2px solid rgba(255, 255, 255, 0.7);
		outline-offset: 1px;
	}

	.btn.minimize {
		font-size: 16px;
		font-weight: 500;
	}

	.transport-btn {
		width: 36px;
		height: 36px;
		font-size: 16px;
		color: rgba(242, 242, 244, 0.9);
	}

	.transport-btn.seek-step {
		width: 34px;
		font-size: 12px;
		font-weight: 500;
		font-variant-numeric: tabular-nums;
		letter-spacing: -0.02em;
		color: rgba(242, 242, 244, 0.75);
	}

	.transport-btn.shuffle,
	.transport-btn.repeat {
		width: 32px;
		font-size: 15px;
		color: rgba(242, 242, 244, 0.55);
	}

	.transport-btn.shuffle.active,
	.transport-btn.repeat.active {
		color: #fff;
		background: rgba(255, 255, 255, 0.12);
	}

	.transport-btn.repeat.repeat-one {
		font-size: 14px;
		font-weight: 500;
	}

	.transport-btn.play-toggle {
		width: 44px;
		height: 44px;
		font-size: 18px;
		background: rgba(255, 255, 255, 0.08);
	}

	.transport-btn.play-toggle:hover {
		background: rgba(255, 255, 255, 0.14);
	}

	/* Solid fill when the viewer asks for less transparency */
	@media (prefers-reduced-transparency: reduce) {
		.panel {
			backdrop-filter: none;
			-webkit-backdrop-filter: none;
			background: linear-gradient(155deg, rgb(var(--accent-rgb)) 0%, #141418 100%);
		}
	}

	@media (max-width: 380px) {
		.transport-controls {
			gap: 0;
		}
		.transport-btn {
			width: 32px;
		}
		.transport-btn.play-toggle {
			width: 40px;
			height: 40px;
		}
	}
</style>
