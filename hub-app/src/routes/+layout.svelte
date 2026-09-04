<script>
	import { page } from '$app/state';
	import favicon from '$lib/assets/favicon.svg';
	import HeaderNav from '$lib/components/HeaderNav.svelte';
	import { approvedTools } from '$lib/store';

	let { children, data } = $props();

	approvedTools.set(data.approvedTools);
</script>

<svelte:head>
	<link rel="icon" href={favicon} />
</svelte:head>

<HeaderNav />

{@render children()}

<style>
	:global(*),
	:global(*)::before,
	:global(*)::after {
		box-sizing: border-box;
	}

	:global(html),
	:global(body) {
		margin: 0;
		padding: 0;
		font-family: 'Source Sans 3', sans-serif;
	}

	:global(h1, h2, h3, h4, h5, h6) {
		font-family: 'Source Sans 3', sans-serif;
		font-weight: 900;
	}
</style>
