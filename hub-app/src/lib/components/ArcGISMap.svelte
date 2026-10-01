<script>
	import { arcgisPortalUrl } from '$lib/storeLinks';
	import {
		mapView,
		mapLayers,
		mapLegend,
		mapLoading,
		mapPopup,
		clearMapState
	} from '$lib/mapStore';
	import {
		extractLayers,
		extractLegendLazy,
		watchMapLayerChanges
	} from '$lib/map/extractMapPanelData';
	import { clearSublayerMetadataCache } from '$lib/map/fetchSublayerMetadata';
	import { regionExtent } from '$lib/map/region';
	import Spinner from '$lib/components/Spinner.svelte';
	import MapPopup from '$lib/components/MapPopup.svelte';
	import WebMap from '@arcgis/core/WebMap.js';
	import MapView from '@arcgis/core/views/MapView.js';
	import '@arcgis/core/assets/esri/themes/light/main.css';

	let { mapId, defaultExtent = null, accentColor = '#a9b54d' } = $props();

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
		let popupClickHandle;

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
			} else {
				console.log( "Second boundary layer is not here" )
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

				view = new MapView({
					container,
					map: webmap,
					extent: regionExtent,
					constraints: {
						geometry: regionExtent,
						minScale: 2500000,
						maxScale: 2000,
						rotationEnabled: false
					}
				});
				// Use our own popup shell, not the built-in Esri popup.
				view.popupEnabled = false;
				mapView.set(view);

				popupClickHandle = view.on('click', async (event) => {
					try {
						const hit = await view.hitTest(event);
						const result = hit.results.find(
							(r) =>
								r.graphic?.layer &&
								r.graphic.layer.popupEnabled !== false &&
								(r.graphic.popupTemplate ?? r.graphic.layer?.popupTemplate)
						);

						if (!result?.graphic) {
							mapPopup.set(null);
							return;
						}

						const graphic = result.graphic;
						if (!graphic.popupTemplate && graphic.layer?.popupTemplate) {
							graphic.popupTemplate = graphic.layer.popupTemplate;
						}
						mapPopup.set({ feature: graphic, location: event.mapPoint });
					} catch (error) {
						console.error('Popup hit test failed:', error);
					}
				});

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
			popupClickHandle?.remove?.();
			mapPopup.set(null);
			view?.destroy();
			clearMapState();
			clearSublayerMetadataCache();
		};
	}
</script>

<div class="map-wrap">
	<div class="map" {@attach attachMap}></div>
	<MapPopup color={accentColor} />
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
		min-height: 31.25rem;
	}

	/* The SDK adds the `esri-view` class to the container element itself (our
	   `.map` div) — `container.classList.add("esri-view")` — so this must be a
	   global `.esri-view` rule, not a descendant of `.map`. It paints the focus
	   ring on `.esri-view-surface:focus::after` from `--esri-view-outline`
	   (default `2px solid var(--calcite-color-brand)` = blue). Kill the variables
	   and the pseudo-element. */
	:global(.esri-view) {
		--esri-view-outline-color: none !important;
		--esri-view-outline: none !important;
		--esri-view-outline-offset: 0 !important;
	}

	:global(.esri-view .esri-view-surface:focus::after) {
		outline: none !important;
	}
</style>
