<script>
	import { arcgisPortalUrl } from '$lib/storeLinks';
	import { mapView, mapLayers, mapLegend, mapLoading, clearMapState } from '$lib/mapStore';
	import { extractLayers, extractMapPanelData, watchMapLayerChanges } from '$lib/map/extractMapPanelData';
	import { clearSublayerMetadataCache } from '$lib/map/fetchSublayerMetadata';
	import WebMap from '@arcgis/core/WebMap.js';
	import MapView from '@arcgis/core/views/MapView.js';
	import '@arcgis/core/assets/esri/themes/light/main.css';

	let { mapId } = $props();

	/** @param {import('@arcgis/core/views/MapView').default} view */
	async function updatePanel(view) {
		const { layers, legend } = await extractMapPanelData(view);
		mapLayers.set(layers);
		mapLegend.set(legend);
	}

	/** @param {HTMLDivElement} container */
	function attachMap(container) {
		let view;
		let cancelled = false;
		let layerWatchHandle;

		clearMapState();
		mapLoading.set(true);
		loadMap();

		async function loadMap() {
			try {
				const webmap = new WebMap({
					portalItem: { id: mapId, portal: { url: arcgisPortalUrl } }
				});
				await webmap.load();
				if (cancelled) return;

				view = new MapView({ container, map: webmap });
				mapView.set(view);

				extractLayers(view).then((layers) => {
					if (!cancelled) {
						mapLayers.set(layers);
						mapLoading.set(false);
					}
				});

				const { layers, legend } = await extractMapPanelData(view);
				if (cancelled) return;
				mapLayers.set(layers);
				mapLegend.set(legend);
				mapLoading.set(false);

				layerWatchHandle = watchMapLayerChanges(view, () => updatePanel(view));
			} catch (error) {
				console.error('Failed to load map:', error);
			} finally {
				mapLoading.set(false);
			}
		}

		return () => {
			cancelled = true;
			layerWatchHandle?.remove?.();
			view?.destroy();
			clearMapState();
			clearSublayerMetadataCache();
		};
	}
</script>

<div class="map" {@attach attachMap}></div>

<style>
	.map {
		width: 100%;
		height: 100%;
		min-height: 500px;
	}
</style>
