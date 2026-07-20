<script>
	import { page } from '$app/state';
	import ArcGISMap from '$lib/components/ArcGISMap.svelte';
	import MapLayerPanel from '$lib/components/MapLayerPanel.svelte';
	import SectorSidebar from '$lib/components/SectorSidebar.svelte';
	import MapPageLayout from '$lib/components/MapPageLayout.svelte';
	import { maps, sectorDefaults } from '$lib/store';

	const map = $derived(maps[page.params.id]);
	const sector = $derived(sectorDefaults[page.params.id] ?? null);
</script>

{#if map}
	<MapPageLayout>
		{#if sector}
			<SectorSidebar sectorName={sector.name} sectorColor={sector.color} description={sector.description} />
		{:else}
			<MapLayerPanel />
		{/if}
		<div class="map-container">
			<ArcGISMap mapId={map.mapId} />
		</div>
	</MapPageLayout>
{:else}
	<p>Map not found.</p>
{/if}

<style>
	.map-container {
		flex: 1;
		min-width: 0;
		height: 100%;
		overflow: hidden;
	}
</style>
