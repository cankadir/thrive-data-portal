<script>
	import { page } from '$app/state';
	import ArcGISMap from '$lib/components/ArcGISMap.svelte';
	import SectorSidebar from '$lib/components/SectorSidebar.svelte';
	import MapPageLayout from '$lib/components/MapPageLayout.svelte';
	import ComingSoon from '$lib/components/ComingSoon.svelte';
	import { maps, sectorDefaults } from '$lib/store';
	import { secondaryBoundaryExtent } from '$lib/map/secondaryBoundary';

	const map = $derived(maps[page.params.id]);
	const sector = $derived(sectorDefaults[page.params.id] ?? null);
</script>

{#if map && map.mapId && sector}
	<MapPageLayout>
		<SectorSidebar
			mapTitle={map.cmsTitle ?? map.title}
			sectorName={sector.name}
			sectorColor={sector.color}
			sectorIcon={sector.icon}
			sectorButton={sector.button}
			sectorTint={sector.tint}
			question={sector.question}
			miniTitle={sector.miniTitle}
			description={sector.description}
		/>
		<div class="map-container">
			<ArcGISMap
				mapId={map.mapId}
				defaultExtent={secondaryBoundaryExtent}
				accentColor={sector.color}
			/>
		</div>
	</MapPageLayout>
{:else if map}
	<ComingSoon title={map.title} />
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
