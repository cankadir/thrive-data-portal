<script>
	import { page } from '$app/state';
	import ArcGISMap from '$lib/components/ArcGISMap.svelte';
	import SectorSidebar from '$lib/components/SectorSidebar.svelte';
	import MapPageLayout from '$lib/components/MapPageLayout.svelte';
	import ComingSoon from '$lib/components/ComingSoon.svelte';
	import { maps, regionalActivityMapReady } from '$lib/store';
	import { regionalActivity } from '$lib/sectors';
	import { secondaryBoundaryExtent } from '$lib/map/secondaryBoundary';

	const mapId = maps['regional-activity'].mapId;

	const participate = { label: 'Submit your activity here', url: 'https://arcg.is/1nLbOP3' };

	// `?ram=off` shows the Coming soon page, `?ram=on` forces the map — overrides
	// the `regionalActivityMapReady` flag without a code change.
	const override = $derived(page.url.searchParams.get('ram'));
	const showMap = $derived(override ? override === 'on' : regionalActivityMapReady);
</script>

{#if showMap}
	<MapPageLayout>
		<SectorSidebar
			{mapId}
			sectorName={regionalActivity.label}
			sectorColor={regionalActivity.color}
			sectorButton={regionalActivity.button}
			sectorTint={regionalActivity.tint}
			question=""
			description="Explore the projects and activities happening across the Thrive region."
			{participate}
		/>
		<div class="map-container">
			<ArcGISMap
				{mapId}
				defaultExtent={secondaryBoundaryExtent}
				accentColor={regionalActivity.color}
			/>
		</div>
	</MapPageLayout>
{:else}
	<ComingSoon title="Regional Activity Map" />
{/if}

<style>
	.map-container {
		flex: 1;
		min-width: 0;
		height: 100%;
		overflow: hidden;
		/* Larger popups than the sector maps (MapPopup defaults). */
		--popup-min-width: 20rem;
		--popup-max-width: 30rem;
		--popup-max-height: 300px;
	}
</style>
