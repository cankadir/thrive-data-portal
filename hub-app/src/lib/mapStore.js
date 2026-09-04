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
	if (!layer) return;

	layer.visible = visible;

	if (visible) {
		let parent = findParentGroup(view.map, layer);
		while (parent) {
			parent.visible = true;
			parent = findParentGroup(view.map, parent);
		}
	}
}

/**
 * Find the group layer that directly contains `layer` (or the group containing a group).
 * @param {import('@arcgis/core/Map').default} map
 * @param {import('@arcgis/core/layers/Layer').default} layer
 * @returns {import('@arcgis/core/layers/GroupLayer').default | null}
 */
function findParentGroup(map, layer) {
	const walk = (group) => {
		for (const child of group.layers.toArray()) {
			if (child === layer) return group;
			if (child.type === 'group') {
				const found = walk(child);
				if (found) return found;
			}
		}
		return null;
	};

	for (const l of map.layers.toArray()) {
		if (l.type === 'group') {
			const found = walk(l);
			if (found) return found;
		}
	}
	return null;
}
