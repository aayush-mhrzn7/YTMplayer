<script lang="ts">
	import '../app.css';

	let { children } = $props();
</script>

<svelte:head>
	<link rel="icon" type="image/png" href="/icons/icon32.png" />
</svelte:head>

{@render children()}
