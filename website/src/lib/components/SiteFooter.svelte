<script lang="ts">
	import GithubLogo from 'phosphor-svelte/lib/GithubLogo';
	import Globe from 'phosphor-svelte/lib/Globe';
	import Heart from 'phosphor-svelte/lib/Heart';
	import LinkedinLogo from 'phosphor-svelte/lib/LinkedinLogo';
	import { LINKEDIN, PORTFOLIO, REPO } from '$lib/site';
	import FooterAscii from './FooterAscii.svelte';
</script>

<footer class="footer">
	<div class="wrap">
		<div class="footer-top">
			<div class="footer-brand">
				<img class="footer-logo" src="/icons/lyriq-logo.png" alt="Lyriq" width="128" height="32" />
				<p class="footer-about">
					Synced lyrics for YouTube Music, on top of whatever you're reading. Built for Chrome and
					Chromium.
				</p>
				<p class="footer-info">
					Lyrics provided by <a href="https://lrclib.net" target="_blank" rel="noreferrer">lrclib.net</a>
				</p>
				<h3 class="footer-head">Links</h3>
				<div class="socials">
					<a href={REPO} target="_blank" rel="noreferrer" aria-label="Lyriq on GitHub" title="GitHub">
						<GithubLogo size={20} weight="fill" />
					</a>
					<a href={LINKEDIN} target="_blank" rel="noreferrer" aria-label="Aayush Maharjan on LinkedIn" title="LinkedIn">
						<LinkedinLogo size={20} weight="fill" />
					</a>
					<a href={PORTFOLIO} target="_blank" rel="noreferrer" aria-label="Aayush Maharjan's portfolio" title="Portfolio">
						<Globe size={20} weight="bold" />
					</a>
				</div>
			</div>

			<nav class="footer-cols" aria-label="Footer">
				<div>
					<h3 class="footer-head">Product</h3>
					<ul>
						<li><a href="/#how">How it works</a></li>
						<li><a href="/#demo">Test it out</a></li>
						<li><a href="/#privacy">Privacy</a></li>
						<li><a href="/#install">Install</a></li>
						<li><a href="/#faq">Questions</a></li>
					</ul>
				</div>
				<div>
					<h3 class="footer-head">Resources</h3>
					<ul>
						<li><a href={REPO} target="_blank" rel="noreferrer">GitHub</a></li>
						<li><a href="{REPO}/issues" target="_blank" rel="noreferrer">Report a problem</a></li>
					</ul>
				</div>
			</nav>
		</div>

		<div class="footer-bottom">
			<p class="credit">
				<span
					>Made with <Heart size={14} weight="fill" class="heart" aria-label="love" /> by
					<a class="credit-link" href={PORTFOLIO} target="_blank" rel="noreferrer">Aayush Maharjan</a></span
				>
				<span>Copyright ©{new Date().getFullYear()} Lyriq. All rights reserved.</span>
			</p>
			<p class="footer-legal">
				<a href="/privacy">Privacy policy</a>
				<a href="/terms">Terms and conditions</a>
			</p>
		</div>
	</div>
	<FooterAscii />
</footer>

<style>
	/* Footer */
	.footer {
		background: var(--band);
		color: var(--text-2);
		box-shadow: 0 -1px 0 var(--line);
		padding-top: 96px;
		overflow: hidden;
	}

	.footer-top {
		display: flex;
		justify-content: space-between;
		gap: 56px;
		flex-wrap: wrap;
	}

	.footer-brand {
		max-width: 440px;
	}

	.footer-logo {
		height: 32px;
		filter: var(--logo-filter);
	}

	.footer-about {
		margin: 20px 0 0;
		font-size: 16px;
		line-height: 1.6;
	}

	.footer-info {
		margin: 20px 0 0;
		font-size: 15px;
	}

	.footer a {
		color: var(--text-2);
		text-decoration: none;
		transition: color 0.15s ease;
	}

	.footer a:hover {
		color: var(--text);
	}

	.footer-info a {
		text-decoration: underline;
		text-underline-offset: 3px;
		text-decoration-color: var(--line);
	}

	.footer-head {
		margin: 0;
		font-size: 16px;
		font-weight: 500;
		color: var(--text);
	}

	.footer-brand .footer-head {
		margin-top: 32px;
	}

	.socials {
		display: flex;
		gap: 14px;
		margin-top: 16px;
	}

	.footer .socials a {
		display: grid;
		place-items: center;
		width: 38px;
		height: 38px;
		border-radius: 50%;
		background: var(--social-bg);
		color: var(--social-fg);
	}

	.footer .socials a:hover {
		background: var(--text);
		color: var(--bg);
	}

	.footer-cols {
		display: flex;
		gap: 88px;
	}

	.footer-cols ul {
		list-style: none;
		margin: 22px 0 0;
		padding: 0;
		display: grid;
		gap: 16px;
		font-size: 16px;
	}

	.footer-bottom {
		display: flex;
		justify-content: space-between;
		align-items: center;
		gap: 12px 24px;
		flex-wrap: wrap;
		margin-top: 88px;
		font-size: 14px;
		color: var(--muted);
	}

	.footer-bottom p {
		margin: 0;
	}

	.credit {
		display: flex;
		flex-wrap: wrap;
		gap: 4px 20px;
	}

	.credit > span:first-child {
		color: var(--text-2);
	}

	.credit :global(.heart) {
		vertical-align: -2px;
		color: #e5484d;
	}

	.footer .credit-link {
		color: var(--text);
		font-weight: 500;
		text-decoration: underline;
		text-decoration-color: var(--line);
		text-underline-offset: 3px;
	}

	.footer-legal {
		display: flex;
		align-items: center;
		flex-wrap: wrap;
		gap: 8px 24px;
	}



	@media (max-width: 640px) {
		.footer {
			padding-top: 64px;
		}
		.footer-cols {
			gap: 56px;
		}
		.footer-bottom {
			margin-top: 56px;
			flex-direction: column;
			align-items: flex-start;
		}
		.footer-legal {
			flex-direction: column;
			align-items: flex-start;
			gap: 6px;
		}
	}
</style>
