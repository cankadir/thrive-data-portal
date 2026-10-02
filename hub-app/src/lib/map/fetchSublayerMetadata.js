// Layer content for the map panel. Descriptions and links are read from the
// CMS_DataDetails layer (see cmsContent.js), which is authoritative for the
// sector maps — there is no fallback to REST/portal metadata.

import { get } from 'svelte/store';
import { mapView } from '$lib/mapStore';
import { matchCmsRow, cmsDescription, cmsLinks, clearCmsCache } from '$lib/map/cmsContent';

/** @typedef {{ description: string | null, source: { text: string, url: string | null } | null, interHub: { name: string, url: string | null } | null }} LayerContent */

const EMPTY = { description: null, source: null, interHub: null };

/** @type {Map<string, Promise<LayerContent>>} */
const cache = new Map();

/** @type {Map<string, Promise<string | null>>} */
const visualFieldCache = new Map();

/**
 * Resolve the alias of the field a layer is visually symbolized by
 * (e.g. a unique-value renderer on `Pub_Access` -> "Public Access").
 * @param {string} layerId
 * @param {{ layerUrl?: string | null }} [options]
 * @returns {Promise<string | null>}
 */
export async function fetchLayerVisualFieldAlias(layerId, options = {}) {
	if (!layerId) return null;

	const cacheKey = `${layerId}:${options.layerUrl ?? ''}`;
	if (visualFieldCache.has(cacheKey)) {
		return visualFieldCache.get(cacheKey);
	}

	const request = (async () => {
		const layer = get(mapView)?.map?.findLayerById(layerId);
		if (!layer) return null;

		try {
			await layer.load();
		} catch (error) {
			console.warn('[Layer metadata] Failed to load layer:', layerId, error);
		}

		const fieldName = resolveRendererField(layer.renderer);
		if (!fieldName) return null;

		// `getFieldAlias` prefers the web-map fieldConfiguration alias (a saved
		// "River Access Type" override) over the service alias, which is often
		// just the raw column name.
		const field = (layer.fields ?? []).find(
			(/** @type {{ name: string }} */ f) => f.name === fieldName
		);
		return layer.getFieldAlias?.(fieldName) || field?.alias || fieldName;
	})();

	visualFieldCache.set(cacheKey, request);
	return request;
}

/**
 * Field a renderer is symbolized by. Renderers expose it differently:
 * `field1`/`field2`/`field3` (unique-value), `field` (class-breaks, heatmap,
 * proportional), size/color `visualVariables[].field`, and `normalizationField`.
 * @param {any} renderer
 * @returns {string | null}
 */
function resolveRendererField(renderer) {
	if (!renderer) return null;

	const candidates = [
		renderer.field1,
		renderer.field,
		renderer.field2,
		renderer.field3,
		...(renderer.visualVariables ?? []).map((/** @type {any} */ variable) => variable.field),
		renderer.normalizationField
	];

	const field = candidates.find((name) => typeof name === 'string' && name.trim());
	return field ?? null;
}

/**
 * CMS content for a layer: description, source link and inter-hub link.
 * @param {string} layerId
 * @param {{ layerUrl?: string | null }} [options]
 * @returns {Promise<LayerContent>}
 */
export async function fetchLayerMetadata(layerId, options = {}) {
	if (!layerId) return EMPTY;

	const cacheKey = `${layerId}:${options.layerUrl ?? ''}`;
	if (cache.has(cacheKey)) {
		return cache.get(cacheKey);
	}

	const request = (async () => {
		const view = get(mapView);
		const layer = view?.map?.findLayerById(layerId);
		if (!layer || !view?.map) {
			console.warn('[Layer metadata] Layer not found:', layerId);
			return EMPTY;
		}

		try {
			await layer.load();
		} catch (error) {
			console.warn('[Layer metadata] Failed to load layer:', layerId, error);
		}

		const row = await matchCmsRow(view.map.portalItem?.id, {
			itemId: layer.portalItem?.id ?? null,
			url: layer.url ?? options.layerUrl ?? null,
			title: layer.title
		});

		if (!row) return EMPTY;

		const { source, interHub } = cmsLinks(row);
		return { description: cmsDescription(row), source, interHub };
	})();

	cache.set(cacheKey, request);
	return request;
}

export function clearSublayerMetadataCache() {
	cache.clear();
	visualFieldCache.clear();
	clearCmsCache();
}
