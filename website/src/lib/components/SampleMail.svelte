<script lang="ts">
	const threads = [
		{ from: 'Priya Raman', subject: 'Friday design review', preview: 'Moved it to 3pm so Tom can join.', time: '10:42' },
		{ from: 'Kestrel Air', subject: 'Your trip to Lisbon', preview: 'Check-in opens 24 hours before.', time: '09:15' },
		{ from: 'Mateo Alvarez', subject: 'Re: Q3 numbers', preview: 'Looks right to me, one small fix.', time: 'Tue' },
		{ from: 'Northside Climbing', subject: 'Membership renewal', preview: 'Your plan renews on the 14th.', time: 'Mon' },
		{ from: 'Hana Okafor', subject: 'Photos from Saturday', preview: 'Uploaded the whole set, 86 shots.', time: 'Sun' }
	];
</script>

<!-- Another tab: an inbox, the kind of page people keep open all day -->
<div class="mail">
	<ul class="list" aria-label="Sample inbox">
		{#each threads as t, i (t.subject)}
			<li class:open={i === 0} class:unread={i < 2}>
				<span class="row-top"><span class="from">{t.from}</span><span class="time">{t.time}</span></span>
				<span class="subject">{t.subject}</span>
				<span class="preview">{t.preview}</span>
			</li>
		{/each}
	</ul>
	<article class="reader">
		<h3>Friday design review</h3>
		<p class="meta"><strong>Priya Raman</strong> to the design team, 10:42</p>
		<p>Hi all,</p>
		<p>
			I've moved Friday's review to 3pm so Tom can join from the airport. We'll start with the new
			onboarding flow, then go through the settings screens if there's time.
		</p>
		<p>
			Please add anything you want feedback on to the shared doc by Thursday evening, with a short note
			on what you're unsure about.
		</p>
		<p>Thanks,<br />Priya</p>
	</article>
</div>

<style>
	.mail {
		position: absolute;
		inset: 0;
		display: grid;
		grid-template-columns: minmax(220px, 300px) 1fr;
		background: var(--web-bg);
		color: var(--web-text);
		font-family: var(--font);
		text-align: left;
		overflow: hidden;
	}

	.list {
		list-style: none;
		margin: 0;
		padding: 8px;
		border-right: 1px solid var(--web-line);
		background: var(--web-soft);
		overflow: auto;
	}

	li {
		display: grid;
		gap: 2px;
		padding: 10px 12px;
		border-radius: 10px;
		font-size: 13px;
	}

	li.open {
		background: var(--web-select);
	}

	.row-top {
		display: flex;
		justify-content: space-between;
		gap: 8px;
	}

	.from {
		font-weight: 500;
	}

	li.unread .from,
	li.unread .subject {
		font-weight: 500;
	}

	.time {
		color: var(--web-muted);
		font-size: 12px;
		font-variant-numeric: tabular-nums;
	}

	.subject {
		white-space: nowrap;
		overflow: hidden;
		text-overflow: ellipsis;
	}

	.preview {
		color: var(--web-muted);
		white-space: nowrap;
		overflow: hidden;
		text-overflow: ellipsis;
	}

	.reader {
		overflow: auto;
		padding: 28px 36px 220px;
		max-width: 640px;
		font-size: 15px;
		line-height: 1.6;
	}

	h3 {
		margin: 0 0 6px;
		font-size: 24px;
		font-weight: 500;
		letter-spacing: -0.01em;
	}

	.meta {
		margin: 0 0 22px;
		color: var(--web-muted);
		font-size: 13.5px;
	}

	p {
		margin: 0 0 14px;
	}

	@container viewport (max-width: 640px) {
		.mail {
			grid-template-columns: 1fr;
		}
		.reader {
			display: none;
		}
	}
</style>
