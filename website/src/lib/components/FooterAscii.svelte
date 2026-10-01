<!--
	The footer wordmark as ASCII art. "LYRIQ" is drawn in Söhne on a hidden canvas, sampled into a
	character grid (denser characters where the letters are solid), and drawn on a visible canvas.
	Characters near the pointer are pushed away and scramble, then spring back. A click or tap sends
	a ripple out from that point. While idle, a slow wave drifts through the letters and the odd
	character flickers. The loop only runs while the footer is on screen.
	Reduced motion: the art is drawn once and stays still.
-->
<script lang="ts">
	import { onMount } from 'svelte';

	let { text = 'LYRIQ' }: { text?: string } = $props();

	let wrap: HTMLDivElement | undefined = $state();
	let canvas: HTMLCanvasElement | undefined = $state();

	// Light to dense; index chosen from how much of the letter covers each cell
	const RAMP = ' .,:;-=+*#%@';
	const SCRAMBLE = '@#%*+=-:;.01/\\<>[]{}?!';

	// Feel: a stiff, well-damped spring so characters snap home without wobbling
	const RADIUS = 150;
	const PUSH = 40;
	const STIFFNESS = 0.09;
	const DAMPING = 0.78;

	// Idle drift: a gentle wave (px) and a rare flicker, so it never looks frozen
	const WAVE_X = 1.8;
	const WAVE_Y = 1.4;
	const FLICKER = 0.0008;

	type Cell = {
		x: number;
		y: number;
		ch: string;
		glyph: string;
		dx: number;
		dy: number;
		vx: number;
		vy: number;
		scrambleUntil: number;
	};

	onMount(() => {
		if (!wrap || !canvas) return;
		const ctx = canvas.getContext('2d');
		if (!ctx) return;

		const reduce = matchMedia('(prefers-reduced-motion: reduce)');
		let cells: Cell[] = [];
		let cellW = 0;
		let cellH = 0;
		let fontPx = 12;
		let width = 0;
		let height = 0;
		let raf = 0;
		let pointer: { x: number; y: number } | null = null;
		let ripples: { x: number; y: number; t: number }[] = [];
		let colors = { base: '#000', hot: '#3b59ff', alpha: 0.4 };
		let onScreen = false;
		let clock = 0;

		function readColors() {
			const cs = getComputedStyle(canvas!);
			colors = {
				base: cs.color,
				hot: cs.getPropertyValue('--accent').trim() || '#3b59ff',
				// Resting opacity per theme (--ascii-alpha in app.css): stronger on light backgrounds
				alpha: parseFloat(cs.getPropertyValue('--ascii-alpha')) || 0.4
			};
		}

		function build() {
			width = wrap!.clientWidth;
			fontPx = width < 640 ? 8 : 11;
			const mono = `500 ${fontPx}px 'sohne mono', ui-monospace, Menlo, monospace`;
			ctx!.font = mono;
			cellW = ctx!.measureText('M').width;
			cellH = fontPx * 1.15;

			const cols = Math.max(20, Math.floor(width / cellW));

			// Draw the word on a small offscreen canvas: one pixel per character cell
			const off = document.createElement('canvas');
			const octx = off.getContext('2d', { willReadFrequently: true })!;
			// Cells are taller than wide, so squash vertically when sampling
			const aspect = cellW / cellH;
			let size = 100;
			octx.font = `700 ${size}px sohne, 'sohne Fallback', sans-serif`;
			const measured = octx.measureText(text).width;
			size = (size * cols * 0.98) / measured;
			const textH = size * 0.74;
			const rows = Math.ceil(textH * aspect) + 2;

			off.width = cols;
			off.height = rows;
			octx.fillStyle = '#000';
			octx.fillRect(0, 0, cols, rows);
			octx.save();
			octx.scale(1, aspect);
			octx.fillStyle = '#fff';
			octx.font = `700 ${size}px sohne, 'sohne Fallback', sans-serif`;
			octx.textBaseline = 'alphabetic';
			octx.textAlign = 'center';
			octx.fillText(text, cols / 2, (rows / aspect + textH) / 2);
			octx.restore();

			const data = octx.getImageData(0, 0, cols, rows).data;
			cells = [];
			for (let r = 0; r < rows; r++) {
				for (let c = 0; c < cols; c++) {
					// Fade the density from top to bottom so the full character range shows
					const v = (data[(r * cols + c) * 4] / 255) * (1 - 0.6 * (r / rows));
					if (v < 0.06) continue;
					const ch = RAMP[Math.min(RAMP.length - 1, Math.round(v * (RAMP.length - 1)))];
					if (ch === ' ') continue;
					cells.push({
						x: c * cellW,
						y: r * cellH,
						ch,
						glyph: ch,
						dx: 0,
						dy: 0,
						vx: 0,
						vy: 0,
						scrambleUntil: 0
					});
				}
			}

			height = Math.ceil(rows * cellH);
			const dpr = Math.min(devicePixelRatio || 1, 2);
			canvas!.width = Math.round(width * dpr);
			canvas!.height = Math.round(height * dpr);
			canvas!.style.height = `${height}px`;
			ctx!.setTransform(dpr, 0, 0, dpr, 0, 0);
			ctx!.font = mono;
			ctx!.textBaseline = 'top';
			readColors();
			draw();
		}

		function draw() {
			ctx!.clearRect(0, 0, width, height);
			const still = reduce.matches;
			const t = clock;
			for (const c of cells) {
				const moved = Math.min(1, Math.hypot(c.dx, c.dy) / PUSH);
				// Slow diagonal wave: neighbouring characters move together, so it reads as a flow
				const wx = still ? 0 : Math.sin(t * 0.0011 + c.y * 0.035 + c.x * 0.006) * WAVE_X;
				const wy = still ? 0 : Math.cos(t * 0.0008 + c.x * 0.012) * WAVE_Y;
				// Characters that have been pushed glow toward the accent colour
				ctx!.globalAlpha = colors.alpha + moved * (1 - colors.alpha);
				ctx!.fillStyle = moved > 0.15 ? colors.hot : colors.base;
				ctx!.fillText(c.glyph, c.x + c.dx + wx, c.y + c.dy + wy);
			}
			ctx!.globalAlpha = 1;
		}

		function step(now: number) {
			clock = now;
			// Colours ease during a theme switch, so follow them every frame rather than sampling once
			readColors();
			let active = false;

			for (const c of cells) {
				const cx = c.x + cellW / 2;
				const cy = c.y + cellH / 2;
				let fx = 0;
				let fy = 0;

				if (pointer) {
					const ddx = cx - pointer.x;
					const ddy = cy - pointer.y;
					const d = Math.hypot(ddx, ddy);
					if (d < RADIUS && d > 0.001) {
						const f = (1 - d / RADIUS) ** 2 * PUSH * 0.2;
						fx += (ddx / d) * f;
						fy += (ddy / d) * f;
						if (Math.random() < 0.18 * (1 - d / RADIUS)) c.scrambleUntil = now + 260;
					}
				}

				// Ripples: a ring that travels outward and kicks characters it passes
				for (const rp of ripples) {
					const age = (now - rp.t) / 1000;
					const ring = age * 520;
					const ddx = cx - rp.x;
					const ddy = cy - rp.y;
					const d = Math.hypot(ddx, ddy);
					const band = Math.abs(d - ring);
					if (band < 34 && d > 0.001) {
						const f = (1 - band / 34) * (1 - age) * 3.2;
						fx += (ddx / d) * f;
						fy += (ddy / d) * f;
						if (Math.random() < 0.15) c.scrambleUntil = now + 260;
					}
				}

				// Spring back home
				c.vx = (c.vx + fx - c.dx * STIFFNESS) * DAMPING;
				c.vy = (c.vy + fy - c.dy * STIFFNESS) * DAMPING;
				c.dx += c.vx;
				c.dy += c.vy;

				if (onScreen && Math.random() < FLICKER) c.scrambleUntil = now + 160;

				if (now < c.scrambleUntil) {
					c.glyph = SCRAMBLE[(Math.random() * SCRAMBLE.length) | 0];
				} else {
					c.glyph = c.ch;
				}

				if (
					Math.abs(c.dx) > 0.05 ||
					Math.abs(c.dy) > 0.05 ||
					Math.abs(c.vx) > 0.05 ||
					Math.abs(c.vy) > 0.05 ||
					now < c.scrambleUntil
				) {
					active = true;
				} else {
					c.dx = c.dy = c.vx = c.vy = 0;
				}
			}

			ripples = ripples.filter((rp) => now - rp.t < 1000);
			draw();

			if (onScreen || active || pointer || ripples.length) {
				raf = requestAnimationFrame(step);
			} else {
				raf = 0;
			}
		}

		function wake() {
			if (!raf && !reduce.matches) raf = requestAnimationFrame(step);
		}

		function local(e: PointerEvent) {
			const r = canvas!.getBoundingClientRect();
			return { x: e.clientX - r.left, y: e.clientY - r.top };
		}

		const onMove = (e: PointerEvent) => {
			if (reduce.matches) return;
			pointer = local(e);
			wake();
		};
		const onLeave = () => {
			pointer = null;
		};
		const onDown = (e: PointerEvent) => {
			if (reduce.matches) return;
			ripples.push({ ...local(e), t: performance.now() });
			wake();
		};

		canvas.addEventListener('pointermove', onMove);
		canvas.addEventListener('pointerleave', onLeave);
		canvas.addEventListener('pointercancel', onLeave);
		canvas.addEventListener('pointerdown', onDown);

		// Idle drift runs only while the footer is visible
		const io = new IntersectionObserver(([entry]) => {
			onScreen = entry.isIntersecting && !reduce.matches;
			if (onScreen) wake();
		});
		io.observe(wrap);

		// Rebuild on resize; redraw when the theme changes so colours follow it
		let resizeTimer: ReturnType<typeof setTimeout> | undefined;
		const ro = new ResizeObserver(() => {
			clearTimeout(resizeTimer);
			resizeTimer = setTimeout(build, 80);
		});
		ro.observe(wrap);

		// When the loop is idle (footer off screen), redraw once the theme's colour fade has finished
		const themeObserver = new MutationObserver(() => {
			setTimeout(() => {
				readColors();
				draw();
			}, 400);
		});
		themeObserver.observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme'] });
		const scheme = matchMedia('(prefers-color-scheme: dark)');
		const onScheme = () => {
			readColors();
			draw();
		};
		scheme.addEventListener('change', onScheme);

		// Söhne must be loaded before the word is sampled, or the fallback font gets drawn
		Promise.all([
			document.fonts.load(`700 100px sohne`),
			document.fonts.load(`500 12px 'sohne mono'`)
		])
			.catch(() => {})
			.finally(build);

		return () => {
			cancelAnimationFrame(raf);
			clearTimeout(resizeTimer);
			ro.disconnect();
			io.disconnect();
			themeObserver.disconnect();
			scheme.removeEventListener('change', onScheme);
			canvas?.removeEventListener('pointermove', onMove);
			canvas?.removeEventListener('pointerleave', onLeave);
			canvas?.removeEventListener('pointercancel', onLeave);
			canvas?.removeEventListener('pointerdown', onDown);
		};
	});
</script>

<div class="ascii" bind:this={wrap} aria-hidden="true">
	<canvas bind:this={canvas}></canvas>
</div>

<style>
	.ascii {
		width: min(1200px, 100% - 32px);
		margin: 64px auto 0;
		padding-bottom: 24px;
	}

	canvas {
		display: block;
		width: 100%;
		color: var(--text);
		cursor: crosshair;
		/* Vertical swipes still scroll the page on touch screens */
		touch-action: pan-y;
	}
</style>
