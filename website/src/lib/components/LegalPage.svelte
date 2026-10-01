<script lang="ts">
	import type { Snippet } from 'svelte';

	let {
		title,
		updated,
		summary,
		children
	}: {
		title: string;
		/** Human-readable date, e.g. "1 October 2026" */
		updated: string;
		/** A few plain-language lines shown above the full text */
		summary: Snippet;
		children: Snippet;
	} = $props();
</script>

<main class="legal wrap">
	<header class="head">
		<h1 class="display">{title}</h1>
		<p class="updated">Last updated {updated}</p>
	</header>

	<aside class="summary" aria-label="Summary">
		{@render summary()}
	</aside>

	<article class="prose">
		{@render children()}
	</article>
</main>

<style>
	.legal {
		max-width: 760px;
		padding: 72px 0 120px;
	}

	h1 {
		margin: 0;
		font-size: clamp(36px, 5vw, 52px);
	}

	.updated {
		margin: 12px 0 0;
		color: var(--muted);
		font-size: 15px;
	}

	.summary {
		margin: 40px 0 48px;
		padding: 24px 28px;
		border-radius: var(--radius);
		background: var(--band);
		color: var(--text-2);
		line-height: 1.6;
	}

	.summary :global(p) {
		margin: 0;
	}

	.summary :global(p + p),
	.summary :global(ul) {
		margin-top: 10px;
	}

	.summary :global(ul) {
		padding-left: 20px;
		margin-bottom: 0;
	}

	.prose {
		line-height: 1.7;
		color: var(--text-2);
	}

	.prose :global(h2) {
		margin: 48px 0 12px;
		font-size: 22px;
		font-weight: 500;
		letter-spacing: -0.015em;
		line-height: 1.3;
		color: var(--text);
		scroll-margin-top: 88px;
	}

	.prose :global(h3) {
		margin: 28px 0 8px;
		font-size: 17px;
		font-weight: 500;
		color: var(--text);
	}

	.prose :global(p),
	.prose :global(ul) {
		margin: 0 0 14px;
	}

	.prose :global(ul) {
		padding-left: 22px;
	}

	.prose :global(li + li) {
		margin-top: 6px;
	}

	.prose :global(strong) {
		font-weight: 500;
		color: var(--text);
	}

	.prose :global(a),
	.summary :global(a) {
		color: var(--accent-text);
		text-underline-offset: 3px;
	}

	.prose :global(code) {
		font-family: var(--font-mono);
		font-size: 0.88em;
		padding: 1px 6px;
		border-radius: 6px;
		background: var(--accent-soft);
		color: var(--accent-text);
	}

	@media (max-width: 640px) {
		.legal {
			padding: 48px 0 88px;
		}
		.summary {
			padding: 20px;
			margin: 32px 0 40px;
		}
	}
</style>
