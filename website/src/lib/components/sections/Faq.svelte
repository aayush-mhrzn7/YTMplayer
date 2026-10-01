<script lang="ts">
	import Plus from 'phosphor-svelte/lib/Plus';

	const faqs = [
		{
			q: 'Does the YouTube Music tab need to stay open?',
			a: "Yes. Lyriq reads the song and the time from that tab, so keep it open. It can sit in the background; you don't need to look at it."
		},
		{
			q: 'Does Lyriq play the music?',
			a: "No. YouTube Music still plays it. The widget's controls just press play, pause, skip and seek in your YouTube Music tab."
		},
		{
			q: "What happens when a song has no lyrics?",
			a: 'The widget says "Lyrics not found" or "Instrumental" and shrinks to its title bar. It opens again on the next song that has lyrics, unless you minimized it yourself.'
		},
		{
			q: 'The lyrics are wrong or out of time. Can I fix that?',
			a: 'Lyrics come from lrclib.net, a community database, so timing can vary between songs. You can add or correct lyrics there, and Lyriq will pick up the change.'
		},
		{
			q: 'Can I turn it off on some pages?',
			a: 'The close button on the widget, or the Overlay switch in the toolbar popup, turns it off on every tab. Turn the switch back on to bring it back.'
		},
		{
			q: 'Which browsers does it work in?',
			a: "It's built for Chrome and Chromium. Other Chromium browsers that load unpacked extensions, like Edge and Brave, should work too but aren't tested."
		},
		{
			q: "Why isn't it on the Chrome Web Store?",
			a: "It isn't published yet. For now you build it from the source and load it unpacked, which takes about a minute. The steps are in the Install section."
		},
		{
			q: 'Is it free?',
			a: "Yes, it's free for personal use."
		}
	];
</script>

<section id="faq" class="faq wrap" aria-labelledby="faq-title">
	<h2 id="faq-title" class="display">Questions</h2>

	<div class="list">
		{#each faqs as f, i (f.q)}
			<!-- name= makes this an exclusive accordion: opening one closes the others -->
			<details name="faq" open={i === 0}>
				<summary>
					<span>{f.q}</span>
					<span class="toggle" aria-hidden="true"><Plus size={18} weight="bold" /></span>
				</summary>
				<p>{f.a}</p>
			</details>
		{/each}
	</div>
</section>

<style>
	.faq {
		display: grid;
		grid-template-columns: minmax(0, 4fr) minmax(0, 7fr);
		gap: 64px;
		padding: 120px 0;
		align-items: start;
	}

	.list {
		border-bottom: 1px solid var(--line);
	}

	details {
		border-top: 1px solid var(--line);
	}

	summary {
		display: flex;
		align-items: center;
		justify-content: space-between;
		gap: 24px;
		padding: 22px 0;
		cursor: pointer;
		list-style: none;
		font-size: 18px;
		font-weight: 500;
		letter-spacing: -0.01em;
	}

	summary::-webkit-details-marker {
		display: none;
	}

	summary:focus-visible {
		outline: 2px solid var(--accent);
		outline-offset: 4px;
		border-radius: 4px;
	}

	.toggle {
		display: grid;
		place-items: center;
		flex-shrink: 0;
		width: 32px;
		height: 32px;
		border-radius: 999px;
		box-shadow: inset 0 0 0 1.5px var(--line);
		color: var(--text-2);
		transition: transform 200ms var(--ease-out);
	}

	/* The plus turns into a cross: one control that shows its state */
	details[open] .toggle {
		transform: rotate(45deg);
	}

	@media (hover: hover) and (pointer: fine) {
		summary:hover .toggle {
			box-shadow: inset 0 0 0 1.5px color-mix(in srgb, var(--text) 35%, transparent);
		}
	}

	p {
		margin: 0;
		padding: 0 56px 24px 0;
		color: var(--text-2);
		line-height: 1.6;
		max-width: 62ch;
	}

	/* Answers open to their natural height where the browser supports it; elsewhere they appear instantly */
	details::details-content {
		block-size: 0;
		overflow: clip;
		transition:
			block-size 250ms var(--ease-out),
			content-visibility 250ms allow-discrete;
	}

	details[open]::details-content {
		block-size: auto;
	}

	@media (prefers-reduced-motion: reduce) {
		details::details-content {
			transition: none;
		}
	}

	@media (max-width: 900px) {
		.faq {
			grid-template-columns: 1fr;
			gap: 32px;
		}
	}

	@media (max-width: 640px) {
		.faq {
			padding: 88px 0;
		}
		summary {
			font-size: 17px;
		}
		p {
			padding-right: 0;
		}
	}
</style>
