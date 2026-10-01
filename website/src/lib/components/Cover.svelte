<script lang="ts">
	import type { Track } from '$lib/demo/tracks';

	let {
		track,
		size = '100%',
		radius = '8px',
		class: className = ''
	}: { track: Track; size?: string; radius?: string; class?: string } = $props();
</script>

<div
	class="cover {className}"
	role="img"
	aria-label="{track.album} cover art"
	style:width={size}
	style:height={size}
	style:border-radius={radius}
	style:--from={track.art.from}
	style:--to={track.art.to}
>
	<span class="glyph" aria-hidden="true">{track.art.glyph}</span>
</div>

<style>
	.cover {
		position: relative;
		flex-shrink: 0;
		overflow: hidden;
		container-type: inline-size;
		background:
			radial-gradient(120% 90% at 20% 15%, color-mix(in srgb, var(--from) 90%, white) 0%, transparent 55%),
			radial-gradient(90% 90% at 85% 90%, var(--from) 0%, transparent 60%),
			linear-gradient(150deg, var(--from), var(--to) 75%);
	}

	.cover::after {
		content: '';
		position: absolute;
		inset: 0;
		background: repeating-linear-gradient(
			115deg,
			rgba(255, 255, 255, 0.06) 0 2px,
			transparent 2px 9px
		);
		mix-blend-mode: overlay;
	}

	.glyph {
		position: absolute;
		inset: 0;
		display: grid;
		place-items: center;
		font-size: 46cqi;
		line-height: 1;
		color: rgba(255, 255, 255, 0.82);
		text-shadow: 0 2px 18px rgba(0, 0, 0, 0.25);
	}
</style>
