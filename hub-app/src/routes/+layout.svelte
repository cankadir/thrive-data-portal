<script>
	import favicon from '$lib/assets/favicon.svg';
	import { approvedTools } from '$lib/store';

	let { children, data } = $props();

	$effect(() => {
		console.log('Approved tools:', data.approvedTools);
		approvedTools.set(data.approvedTools);
	});
</script>

<svelte:head>
	<link rel="icon" href={favicon} />
</svelte:head>

{@render children()}

<style>
	:global(html),
	:global(body) {
		margin: 0;
		padding: 0;
	}
</style>
