<script lang="ts">
	import LegalPage from '$lib/components/LegalPage.svelte';
	import { ISSUES, REPO } from '$lib/site';

	// Every statement here was checked against extension/manifest.json and extension/src.
	// Update this page whenever the extension starts collecting or sending anything new.
	// The website (not the extension) uses Vercel Web Analytics: see "This website" below.
</script>

<svelte:head>
	<title>Privacy policy | Lyriq</title>
	<meta
		name="description"
		content="What the Lyriq browser extension and this website access, store and send. The extension has no accounts, no analytics and no tracking."
	/>
</svelte:head>

<LegalPage title="Privacy policy" updated="1 October 2026">
	{#snippet summary()}
		<p>The short version:</p>
		<ul>
			<li>The extension has no accounts, no analytics, no ads and no server of its own.</li>
			<li>To find lyrics, it sends the song's title, artist and length to lrclib.net.</li>
			<li>Your settings and the current song are saved in your browser, on your device only.</li>
			<li>This website counts page views with Vercel Web Analytics, which doesn't use cookies.</li>
			<li>Nothing is sold or shared with anyone else.</li>
		</ul>
	{/snippet}

	<p>
		This policy covers the Lyriq browser extension ("Lyriq", "the extension") and this website. Lyriq is
		an independent project made by Aayush Maharjan. It is not made by, or affiliated with, YouTube or
		Google.
	</p>

	<h2 id="what-the-extension-accesses">What the extension can access</h2>
	<p>When you install Lyriq, your browser asks you to allow these permissions. Here is what each one is used for.</p>
	<ul>
		<li>
			<strong>Read and change data on the websites you visit.</strong> Lyriq needs this to show its
			lyrics widget on the page you're looking at. On most websites it only adds the widget and does not
			read the page. On <code>music.youtube.com</code> it reads the music player: the song title,
			artist, album artwork, how long the song is and how far into it you are.
		</li>
		<li>
			<strong>Tabs.</strong> Used to find your YouTube Music tab, so the widget's playback controls and
			its "open player" button can reach it.
		</li>
		<li>
			<strong>Scripting.</strong> Used to add the widget to tabs that were already open before Lyriq
			loaded, and to run play, pause, skip and seek inside the YouTube Music player.
		</li>
		<li>
			<strong>Storage.</strong> Used to save your settings and the current song on your device, as
			described below.
		</li>
	</ul>

	<h2 id="what-leaves-your-browser">What leaves your browser</h2>
	<h3>Lyrics requests to lrclib.net</h3>
	<p>
		When a new song starts, Lyriq asks <a href="https://lrclib.net" target="_blank" rel="noreferrer"
			>lrclib.net</a
		>, a free, community-run lyrics database, for that song's lyrics. The request contains the song's
		title, artist and length in seconds. Like any request on the internet, lrclib also sees your IP
		address. lrclib is a separate service with its own policies; Lyriq does not control what it does
		with requests.
	</p>
	<h3>Album artwork</h3>
	<p>
		Lyriq loads the song's cover image from the address YouTube Music already uses for it, to pick a
		colour for the widget. The colour is worked out on your device and isn't sent anywhere.
	</p>
	<h3>Nothing else</h3>
	<p>
		Lyriq does not send your browsing history, the pages you visit, what you listen to, or any other
		data to the developer or to anyone else. There are no analytics, crash reports or tracking of any
		kind. The source code is public on <a href={REPO} target="_blank" rel="noreferrer">GitHub</a> if
		you'd like to check.
	</p>

	<h2 id="what-is-stored">What is stored on your device</h2>
	<p>Lyriq uses your browser's extension storage (<code>chrome.storage.local</code>) to keep:</p>
	<ul>
		<li>your settings, such as whether the overlay and playback controls are on;</li>
		<li>where you moved the widget and whether it's minimized;</li>
		<li>the song that's currently playing and its lyrics, so every tab shows the same thing.</li>
	</ul>
	<p>
		This stays in your browser on your device. It is not synced to other devices by Lyriq, and it is
		deleted when you remove the extension.
	</p>

	<h2 id="this-website">This website</h2>
	<p>
		This website uses <a href="https://vercel.com/docs/analytics/privacy-policy" target="_blank"
			rel="noreferrer">Vercel Web Analytics</a
		> to count how many people visit and which pages they look at. It doesn't use cookies. Vercel
		records the page, the site you came from, and general details such as your country, browser and
		type of device, so the numbers can be shown in aggregate. It doesn't build a profile of you or
		follow you to other websites. This applies to the website only; the extension doesn't use it.
	</p>
	<p>
		The website doesn't use any other analytics, advertising or tracking, and it loads its fonts and
		images from its own server. If you use the light/dark switch, your choice is saved in your
		browser's local storage under <code>lyriq-theme</code> so the page remembers it; clearing your
		browser data removes it. The demo on the home page runs entirely in your browser and doesn't
		connect to YouTube Music or lrclib.
	</p>
	<p>
		Like any website, the service that hosts it may keep standard server logs, such as IP addresses
		and browser type, for security and to keep the site running.
	</p>

	<h2 id="children">Children</h2>
	<p>Lyriq doesn't knowingly collect personal information from anyone, including children.</p>

	<h2 id="your-choices">Your choices</h2>
	<ul>
		<li>Turn the overlay off from the Lyriq toolbar popup or the widget's close button.</li>
		<li>Remove the extension from <code>chrome://extensions</code> to delete everything it stored.</li>
		<li>Use YouTube Music without Lyriq at any time; it doesn't change your YouTube account.</li>
	</ul>

	<h2 id="changes">Changes to this policy</h2>
	<p>
		If Lyriq ever starts collecting or sending anything new, this page will be updated first and the
		date at the top will change.
	</p>

	<h2 id="contact">Contact</h2>
	<p>
		Questions about privacy? Open an issue on
		<a href={ISSUES} target="_blank" rel="noreferrer">GitHub</a>.
	</p>
</LegalPage>
