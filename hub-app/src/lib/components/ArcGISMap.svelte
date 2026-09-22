<script>
	import { arcgisPortalUrl } from '$lib/storeLinks';
	import { mapView, mapLayers, mapLegend, mapLoading, clearMapState } from '$lib/mapStore';
	import {
		extractLayers,
		extractLegendLazy,
		watchMapLayerChanges
	} from '$lib/map/extractMapPanelData';
	import { clearSublayerMetadataCache } from '$lib/map/fetchSublayerMetadata';
	import Spinner from '$lib/components/Spinner.svelte';
	import WebMap from '@arcgis/core/WebMap.js';
	import MapView from '@arcgis/core/views/MapView.js';
	import '@arcgis/core/assets/esri/themes/light/main.css';

	let { mapId, defaultExtent = null } = $props();

	/** @param {import('@arcgis/core/views/MapView').default} view */
	async function extractPanel(view) {
		return Promise.all([extractLayers(view), extractLegendLazy(view)]);
	}

	/** @param {import('@arcgis/core/views/MapView').default} view */
	async function updatePanel(view) {
		const [layers, legend] = await extractPanel(view);
		mapLayers.set(layers);
		mapLegend.set(legend);
	}

	/** @param {HTMLDivElement} container */
	function attachMap(container) {
		let view;
		let cancelled = false;
		let layerWatchHandle;

		/**
		 * Zoom to the `thrive_secondary_boundary` layer when the webmap has it,
		 * otherwise to the provided fallback extent so every sector map opens
		 * at the same view.
		 * @param {import('@arcgis/core/views/MapView').default} view
		 * @param {object | null} fallbackExtent
		 */
		async function zoomToSecondaryBoundary(view, fallbackExtent) {
			await view.when();
			if (cancelled) return;

			const layer = view.map.allLayers.find(
				(l) => l.id === 'thrive_secondary_boundary' || l.title === 'thrive_secondary_boundary'
			);

			if (layer) {
				try {
					await layer.load();
				} catch {
					/* fall through to the fallback extent */
				}
				if (cancelled) return;
				if (layer.fullExtent) {
					view.goTo(layer.fullExtent);
					return;
				}
			}

			if (fallbackExtent) view.goTo(fallbackExtent);
		}

		clearMapState();
		mapLoading.set(true);
		loadMap();

		async function loadMap() {
			try {
				const webmap = new WebMap({
					portalItem: { id: mapId, portal: { url: arcgisPortalUrl } }
				});

				view = new MapView({ container, map: webmap });
				mapView.set(view);

				zoomToSecondaryBoundary(view, defaultExtent);

				const [layers, legend] = await extractPanel(view);

				if (cancelled) return;

				mapLayers.set(layers);
				mapLegend.set(legend);

				layerWatchHandle = watchMapLayerChanges(view, () => updatePanel(view));
			} catch (error) {
				console.error('Failed to load map:', error);
			} finally {
				if (!cancelled) mapLoading.set(false);
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

<div class="map-wrap">
	<div class="map" {@attach attachMap}></div>
	{#if $mapLoading}
		<Spinner overlay label="Loading map" />
	{/if}
</div>

<style>
	.map-wrap {
		position: relative;
		width: 100%;
		height: 100%;
	}

	.map {
		width: 100%;
		height: 100%;
		min-height: 500px;
	}
</style>
