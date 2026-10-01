<script lang="ts">
	import LegalPage from '$lib/components/LegalPage.svelte';
	import { ISSUES, REPO } from '$lib/site';
</script>

<svelte:head>
	<title>Terms and conditions | Lyriq</title>
	<meta
		name="description"
		content="The terms for using the Lyriq browser extension and this website."
	/>
</svelte:head>

<LegalPage title="Terms and conditions" updated="1 October 2026">
	{#snippet summary()}
		<p>The short version:</p>
		<ul>
			<li>Lyriq is free for personal, non-commercial use.</li>
			<li>Don't sell it, or redistribute it as your own.</li>
			<li>Lyrics belong to their songwriters and publishers. Lyriq only shows them to you.</li>
			<li>It's provided as-is, without guarantees.</li>
		</ul>
	{/snippet}

	<p>
		These terms apply to the Lyriq browser extension ("Lyriq", "the extension") and this website. By
		installing or using Lyriq, you agree to them. If you don't agree, please don't use it. Lyriq is
		made by Aayush Maharjan ("I", "me").
	</p>

	<h2 id="licence">Licence</h2>
	<p>
		Lyriq is free to use for your own personal, non-commercial purposes. You may download the source
		code from <a href={REPO} target="_blank" rel="noreferrer">GitHub</a>, build it, and load it in your
		own browser.
	</p>
	<p>Without my written permission, you may not:</p>
	<ul>
		<li>sell Lyriq, or include it in a product or service that you charge for;</li>
		<li>publish Lyriq, or a modified version of it, to an extension store or elsewhere as your own;</li>
		<li>remove the credits or this notice from copies you keep.</li>
	</ul>
	<p>All rights not given to you here are kept by me.</p>

	<h2 id="other-services">YouTube Music and lrclib</h2>
	<p>
		Lyriq works alongside services it doesn't own or control. Your use of them is covered by their own
		terms:
	</p>
	<ul>
		<li>
			<strong>YouTube Music</strong> plays the music. Lyriq reads the player in your YouTube Music tab
			and can press its controls for you. You are responsible for using YouTube Music in line with
			YouTube's terms.
		</li>
		<li>
			<strong>lrclib.net</strong> provides the lyrics. Lyriq doesn't guarantee that lyrics exist for a
			song, or that they are accurate or in time.
		</li>
	</ul>
	<p>
		Lyriq is an independent project and is not made by, endorsed by or affiliated with YouTube,
		Google or lrclib. YouTube and YouTube Music are trademarks of Google LLC.
	</p>

	<h2 id="lyrics">Lyrics and other content</h2>
	<p>
		Song lyrics are owned by their songwriters, publishers and other rights holders. Lyriq displays
		them to you while you listen, for your personal use. Don't use Lyriq to copy, collect or republish
		lyrics.
	</p>
	<p>
		The songs and lyrics in the demo on this website are made up for the demo and aren't real
		recordings.
	</p>

	<h2 id="acceptable-use">Acceptable use</h2>
	<p>Please don't use Lyriq or this website to:</p>
	<ul>
		<li>break the law, or the terms of YouTube, lrclib or any other service;</li>
		<li>send automated or excessive requests to lrclib or YouTube;</li>
		<li>interfere with this website or try to get around how it's meant to work.</li>
	</ul>

	<h2 id="no-warranty">No warranty</h2>
	<p>
		Lyriq is provided "as is" and "as available", without warranties of any kind, whether express or
		implied, including that it will work without errors, keep working after changes to YouTube Music,
		Chrome or lrclib, or suit a particular purpose.
	</p>

	<h2 id="liability">Limitation of liability</h2>
	<p>
		To the fullest extent the law allows, I'm not liable for any indirect, incidental or consequential
		loss, or any loss of data, arising from your use of Lyriq or this website. Lyriq is free, and you
		use it at your own risk. Nothing in these terms limits rights you have under laws that can't be
		excluded.
	</p>

	<h2 id="privacy">Privacy</h2>
	<p>
		How Lyriq handles information is explained in the <a href="/privacy">privacy policy</a>.
	</p>

	<h2 id="stopping">Stopping use</h2>
	<p>
		You can stop using Lyriq at any time by turning it off or removing it from
		<code>chrome://extensions</code>. If you break these terms, your permission to use Lyriq ends.
	</p>

	<h2 id="changes">Changes to these terms</h2>
	<p>
		I may update these terms as Lyriq changes. The date at the top shows when they last changed.
		Using Lyriq after an update means you accept the new terms.
	</p>

	<h2 id="contact">Contact</h2>
	<p>
		Questions about these terms? Open an issue on
		<a href={ISSUES} target="_blank" rel="noreferrer">GitHub</a>.
	</p>
</LegalPage>
