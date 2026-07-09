<script>
	import { page } from '$app/state';
	import ArcGISMap from '$lib/components/ArcGISMap.svelte';
	import MapLayerPanel from '$lib/components/MapLayerPanel.svelte';
	import MapPageLayout from '$lib/components/MapPageLayout.svelte';
	import { maps } from '$lib/store';

	const map = $derived(maps[page.params.id]);
</script>

{#if map}
	<MapPageLayout title={map.title}>
		<MapLayerPanel />
		<div class="map-container">
			<ArcGISMap mapId={map.mapId} />
		</div>
	</MapPageLayout>
{:else}
	<p>Map not found.</p>
{/if}

<style>
	.map-container {
		min-width: 0;
		height: 100%;
		overflow: hidden;
	}
</style>
