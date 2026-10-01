<script lang="ts">
	import { onMount } from 'svelte';
	import { page } from '$app/state';

	const notFound = $derived(page.status === 404);

	// A short song about a missing page, shown the way the Lyriq widget shows lyrics
	const lines = [
		'We searched in every verse and every chorus,',
		'but this page never made it on the album.',
		'Maybe it was a B-side that got cut,',
		'or a link that hit the wrong note.',
		'Either way, the beat goes on,',
		"so let's get you back home."
	];

	let idx = $state(1);
	let swapping = $state(false);

	onMount(() => {
		if (!notFound || matchMedia('(prefers-reduced-motion: reduce)').matches) return;
		let t: ReturnType<typeof setTimeout>;
		const timer = setInterval(() => {
			swapping = true;
			t = setTimeout(() => {
				idx = (idx + 1) % lines.length;
				swapping = false;
			}, 140);
		}, 2600);
		return () => {
			clearInterval(timer);
			clearTimeout(t);
		};
	});

	const prev = $derived(lines[(idx - 1 + lines.length) % lines.length]);
	const active = $derived(lines[idx]);
	const next = $derived(lines[(idx + 1) % lines.length]);
</script>

<svelte:head>
	<title>{notFound ? 'Page not found' : 'Something went wrong'} | Lyriq</title>
	<meta name="robots" content="noindex" />
</svelte:head>

<main class="err wrap">
	{#if notFound}
		<div class="copy">
			<p class="code">404</p>
			<h1 class="display">This page is instrumental.</h1>
			<p class="sub">
				No lyrics, no content, just a long and slightly awkward silence. The page you're looking for
				doesn't exist, or it moved without telling anyone.
			</p>
			<div class="cta">
				<a class="btn btn-accent press" href="/">Back to the home page</a>
				<a class="btn btn-quiet press" href="/#demo">Play the demo instead</a>
			</div>
		</div>

		<!-- A Lyriq widget playing the 404 track, stuck at 4:04 -->
		<div class="stage" aria-hidden="true">
			<div class="glow"></div>
			<div class="widget">
				<div class="w-head">
					<div class="cover"><span>404</span></div>
					<div class="meta">
						<div class="title">404 (Instrumental)</div>
						<div class="artist">The Missing Pages</div>
					</div>
				</div>
				<div class="w-lyrics">
					<div class="line prev" class:swap={swapping}>{prev}</div>
					<div class="line active" class:swap={swapping}>{active}</div>
					<div class="line next" class:swap={swapping}>{next}</div>
				</div>
				<div class="w-seek">
					<span>4:04</span>
					<div class="bar"><i></i></div>
					<span>4:04</span>
				</div>
			</div>
		</div>
	{:else}
		<div class="copy">
			<p class="code">{page.status}</p>
			<h1 class="display">Something skipped a beat.</h1>
			<p class="sub">
				{page.error?.message ?? 'An unexpected error happened.'} Try reloading the page, or head back home.
			</p>
			<div class="cta">
				<a class="btn btn-accent press" href="/">Back to the home page</a>
			</div>
		</div>
	{/if}
</main>

<style>
	.err {
		display: grid;
		grid-template-columns: minmax(0, 1fr) minmax(0, 1fr);
		gap: 64px;
		align-items: center;
		min-height: calc(100dvh - 64px);
		padding: 64px 0 96px;
	}

	.code {
		margin: 0 0 12px;
		font-family: var(--font-mono);
		font-size: 15px;
		color: var(--accent-text);
	}

	h1 {
		margin: 0;
		font-size: clamp(40px, 5vw, 60px);
		text-wrap: balance;
	}

	.sub {
		margin: 20px 0 0;
		max-width: 40ch;
		font-size: 18px;
		line-height: 1.55;
		color: var(--text-2);
	}

	.cta {
		display: flex;
		flex-wrap: wrap;
		gap: 12px;
		margin-top: 32px;
	}

	/* The widget, built to look like the real one */
	.stage {
		position: relative;
		display: grid;
		place-items: center;
		min-height: 360px;
	}

	.glow {
		position: absolute;
		width: 300px;
		height: 300px;
		border-radius: 50%;
		background: radial-gradient(circle, rgba(59, 89, 255, 0.55), transparent 70%);
		filter: blur(20px);
	}

	.widget {
		position: relative;
		width: min(340px, 100%);
		border-radius: 14px;
		color: #f2f2f4;
		background:
			linear-gradient(155deg, rgba(44, 58, 150, 0.6), rgba(12, 12, 16, 0.6)),
			rgba(16, 16, 20, 0.55);
		backdrop-filter: blur(20px) saturate(1.45);
		-webkit-backdrop-filter: blur(20px) saturate(1.45);
		border: 1px solid rgba(255, 255, 255, 0.1);
		box-shadow:
			0 12px 40px rgba(0, 0, 0, 0.45),
			inset 0 1px 0 rgba(255, 255, 255, 0.08);
		overflow: hidden;
	}

	.w-head {
		display: flex;
		align-items: center;
		gap: 10px;
		padding: 10px 12px 8px;
		border-bottom: 1px solid rgba(255, 255, 255, 0.06);
	}

	.cover {
		display: grid;
		place-items: center;
		width: 40px;
		height: 40px;
		border-radius: 8px;
		background: linear-gradient(150deg, #3b59ff, #120a3a 75%);
		font-family: var(--font-mono);
		font-size: 11px;
		color: rgba(255, 255, 255, 0.85);
	}

	.title {
		font-size: 13px;
		font-weight: 500;
	}

	.artist {
		margin-top: 2px;
		font-size: 11px;
		color: rgba(242, 242, 244, 0.65);
	}

	.w-lyrics {
		display: flex;
		flex-direction: column;
		gap: 8px;
		padding: 16px 18px 18px;
		min-height: 128px;
		justify-content: center;
		text-align: center;
	}

	.line {
		font-size: 13px;
		line-height: 1.35;
		color: rgba(242, 242, 244, 0.42);
		transition:
			opacity 0.18s ease,
			transform 0.18s ease;
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

	.w-seek {
		display: flex;
		align-items: center;
		gap: 8px;
		padding: 8px 12px 12px;
		border-top: 1px solid rgba(255, 255, 255, 0.06);
		font-size: 11px;
		font-variant-numeric: tabular-nums;
		color: rgba(242, 242, 244, 0.55);
	}

	.bar {
		flex: 1;
		height: 4px;
		border-radius: 999px;
		background: rgba(255, 255, 255, 0.85);
		position: relative;
	}

	/* Thumb parked at the very end: the song is over, and so is this page */
	.bar i {
		position: absolute;
		right: -6px;
		top: -4px;
		width: 12px;
		height: 12px;
		border-radius: 50%;
		background: #fff;
	}

	@media (prefers-reduced-transparency: reduce) {
		.widget {
			backdrop-filter: none;
			-webkit-backdrop-filter: none;
			background: linear-gradient(155deg, #2c3a96, #141418);
		}
	}

	@media (max-width: 900px) {
		.err {
			grid-template-columns: 1fr;
			gap: 40px;
			min-height: auto;
			padding: 48px 0 88px;
		}
		.stage {
			min-height: 300px;
		}
	}
</style>
