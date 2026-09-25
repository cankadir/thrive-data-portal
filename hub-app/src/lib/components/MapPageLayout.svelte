<script>
	let { children } = $props();
</script>

<div class="map-page">
	{@render children()}
</div>

<style>
	.map-page {
		height: calc(100vh - 3.75rem);
		display: flex;
	}
</style>
