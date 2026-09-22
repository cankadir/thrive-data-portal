<script>
	let { children } = $props();
</script>

<div class="map-page">
	{@render children()}
</div>

<style>
	.map-page {
		height: calc(100vh - 60px);
		display: flex;
	}
</style>
