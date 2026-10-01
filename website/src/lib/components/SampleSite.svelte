<!-- Any other tab: an ordinary article the widget floats over -->
<article class="site">
	<header>
		<span class="logo">Brew Guide</span>
		<nav aria-label="Sample site"><span>Guides</span><span>Gear</span><span>About</span></nav>
	</header>
	<div class="body">
		<p class="kicker">Coffee, 6 minute read</p>
		<h3>The case for making coffee by hand</h3>
		<p>
			There is a particular kind of quiet that comes with boiling water. The kettle ticks, the grinder
			hums for twenty seconds, and for a few minutes the only job is to pour slowly in small circles.
		</p>
		<p>
			Pour-over asks for very little: a cone, a paper filter, medium-fine grounds and water just off
			the boil. Start with a short bloom, about twice the weight of the coffee, and wait thirty seconds
			while the bed swells and settles.
		</p>
		<blockquote>Most of the craft is just paying attention to one thing at a time.</blockquote>
		<p>
			Then pour in stages. Keep the water level steady and the stream thin. If it drains too fast, grind
			finer next time; if it stalls, go coarser. Write down what you changed so tomorrow's cup is a
			little better than today's.
		</p>
		<p>
			None of this is complicated, and that is the point. It is a small ritual that fits between
			waking up and opening your inbox, and it turns out to be a good place to put a favourite song.
		</p>
	</div>
</article>

<style>
	.site {
		position: absolute;
		inset: 0;
		overflow: auto;
		/* A separate site with its own look: crisp white, one green */
		background: var(--web-bg);
		color: var(--web-text);
		text-align: left;
		font-family: var(--font);
	}

	header {
		display: flex;
		justify-content: space-between;
		align-items: center;
		gap: 16px;
		padding: 16px 28px;
		border-bottom: 1px solid var(--web-line);
		position: sticky;
		top: 0;
		background: var(--web-header);
	}

	.logo {
		font-size: 18px;
		font-weight: 500;
		letter-spacing: -0.01em;
		color: var(--web-green-strong);
	}

	nav {
		display: flex;
		gap: 18px;
		font-size: 13px;
		font-weight: 500;
		color: var(--web-muted);
	}

	.body {
		max-width: 600px;
		margin: 0 auto;
		padding: 32px 28px 220px;
		font-size: 16px;
		line-height: 1.65;
	}

	.kicker {
		font-family: var(--font);
		font-size: 13px;
		font-weight: 500;
		color: var(--web-green);
		margin: 0 0 10px;
	}

	h3 {
		font-size: 34px;
		line-height: 1.1;
		letter-spacing: -0.015em;
		margin: 0 0 20px;
		font-weight: 500;
		text-wrap: balance;
	}

	p {
		margin: 0 0 16px;
	}

	blockquote {
		margin: 24px 0;
		padding-left: 18px;
		border-left: 2px solid var(--web-green);
		font-style: italic;
		color: var(--web-text-2);
	}

	@container viewport (max-width: 520px) {
		header {
			padding: 12px 16px;
		}
		nav {
			display: none;
		}
		.body {
			padding: 22px 16px 260px;
			font-size: 15px;
		}
		h3 {
			font-size: 24px;
		}
	}
</style>
