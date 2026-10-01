<script lang="ts">
	let { repo }: { repo: string } = $props();

	// Checked against extension/manifest.json and extension/src (no other network calls exist)
	const access = [
		{
			name: 'Read and change data on websites you visit',
			body: "Needed to put the widget on the page you're on. On other sites it only adds the widget. On music.youtube.com it reads the player: song, artist, artwork and time."
		},
		{
			name: 'Tabs',
			body: 'Finds your YouTube Music tab so the playback controls and the open-player button can reach it.'
		},
		{
			name: 'Scripting',
			body: "Adds the widget to tabs that were already open before Lyriq loaded, and runs the controls inside YouTube Music's player."
		},
		{
			name: 'Storage',
			body: 'Remembers your settings, where you left the widget and the current song. It stays on this device.'
		}
	];
</script>

<section id="privacy" class="privacy" aria-labelledby="privacy-title">
	<div class="wrap">
		<div class="head">
			<h2 id="privacy-title" class="display">Privacy</h2>
			<p>
				Lyriq has no account, no analytics and no server of its own. Here's what it asks your browser
				for, and what it sends anywhere.
			</p>
		</div>

		<div class="cols">
			<div>
				<h3>What it can access</h3>
				<dl>
					{#each access as a (a.name)}
						<div class="row">
							<dt>{a.name}</dt>
							<dd>{a.body}</dd>
						</div>
					{/each}
				</dl>
			</div>

			<div>
				<h3>What leaves your browser</h3>
				<dl>
					<div class="row">
						<dt>Song details, to lrclib.net</dt>
						<dd>
							The title, artist and length of the song, to look up its lyrics. lrclib is a free, open
							lyrics database.
						</dd>
					</div>
					<div class="row">
						<dt>A request for the album artwork</dt>
						<dd>
							The cover image is loaded from YouTube's image servers to pick the widget's colour. The
							colour is worked out on your device.
						</dd>
					</div>
					<div class="row">
						<dt>Nothing else</dt>
						<dd>
							No tracking and no usage data. The code is
							<a href={repo} target="_blank" rel="noreferrer">on GitHub</a> if you want to check.
						</dd>
					</div>
				</dl>
			</div>
		</div>

		<p class="more"><a href="/privacy">Read the full privacy policy</a></p>
	</div>
</section>

<style>
	.privacy {
		background: var(--band);
		padding: 120px 0;
	}

	.head {
		max-width: 60ch;
		margin-bottom: 56px;
	}

	.head p {
		margin: 14px 0 0;
		font-size: 18px;
		color: var(--text-2);
	}

	.cols {
		display: grid;
		grid-template-columns: minmax(0, 1fr) minmax(0, 1fr);
		gap: 64px;
	}

	h3 {
		margin: 0 0 8px;
		font-size: 15px;
		font-weight: 500;
		color: var(--muted);
	}

	dl {
		margin: 0;
	}

	.row {
		padding: 20px 0;
		border-top: 1px solid var(--line);
	}

	dt {
		font-size: 17px;
		font-weight: 500;
		letter-spacing: -0.01em;
	}

	dd {
		margin: 6px 0 0;
		color: var(--text-2);
		line-height: 1.55;
		max-width: 52ch;
	}

	dd a {
		color: var(--accent-text);
		text-underline-offset: 3px;
	}

	.more {
		margin: 48px 0 0;
	}

	.more a {
		color: var(--accent-text);
		font-weight: 500;
		text-underline-offset: 3px;
	}

	@media (max-width: 900px) {
		.cols {
			grid-template-columns: 1fr;
			gap: 40px;
		}
	}

	@media (max-width: 640px) {
		.privacy {
			padding: 88px 0;
		}
		.head {
			margin-bottom: 40px;
		}
	}
</style>
