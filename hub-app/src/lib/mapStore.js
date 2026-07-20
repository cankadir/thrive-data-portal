import { writable, get } from 'svelte/store';

/** Live MapView instance — client only, for toggling layers etc. */
export const mapView = writable(null);

/** Operational layers from the active map */
export const mapLayers = writable([]);

/** Legend entries grouped by layer */
export const mapLegend = writable([]);

/** True while the active map is loading layer/legend data */
export const mapLoading = writable(false);

export function clearMapState() {
	mapView.set(null);
	mapLayers.set([]);
	mapLegend.set([]);
	mapLoading.set(false);
}

/** @param {string} layerId @param {boolean} visible */
export function setMapLayerVisibility(layerId, visible) {
	const view = get(mapView);
	const layer = view?.map?.findLayerById(layerId);
	if (layer) layer.visible = visible;
}
