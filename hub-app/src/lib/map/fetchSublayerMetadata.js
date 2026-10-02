// Layer metadata for the map panel: the portal item snippet (summary — groups
// rely on it) and the layer description. Missing values are simply null.

import { get } from 'svelte/store';
import { mapView } from '$lib/mapStore';

/** @type {Map<string, Promise<{ summary: string | null, description: string | null }>>} */
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
 * Portal summary (snippet) + layer description.
 * @param {string} layerId
 * @param {{ layerUrl?: string | null }} [options]
 */
export async function fetchLayerMetadata(layerId, options = {}) {
	if (!layerId) return { summary: null, description: null };

	const cacheKey = `${layerId}:${options.layerUrl ?? ''}`;
	if (cache.has(cacheKey)) {
		return cache.get(cacheKey);
	}

	const request = (async () => {
		const layer = get(mapView)?.map?.findLayerById(layerId);
		if (!layer) {
			console.warn('[Layer metadata] Layer not found:', layerId);
			return { summary: null, description: null };
		}

		try {
			await layer.load();
		} catch (error) {
			console.warn('[Layer metadata] Failed to load layer:', layerId, error);
		}

		return {
			summary: await fetchPortalSummary(layer),
			description: await fetchDescription(layer, options.layerUrl)
		};
	})();

	cache.set(cacheKey, request);
	return request;
}

/**
 * First available description: REST layer `description` (by candidate URL),
 * then `sourceJSON.description`, then the portal item description, then the
 * layer's own `description`.
 * @param {import('@arcgis/core/layers/Layer').default} layer
 * @param {string | null | undefined} storedUrl
 */
async function fetchDescription(layer, storedUrl) {
	for (const url of collectMetadataUrls(layer, storedUrl)) {
		const description = await fetchRestDescription(url);
		if (description) return description;
	}

	const fromSource = layer.sourceJSON?.description?.trim();
	if (fromSource) return fromSource;

	// Skip parent Feature Service portal copy — it is shared across all sublayers
	if (layer.portalItem && !isSharedFeatureServiceLayer(layer)) {
		try {
			await layer.portalItem.load();
			const fromPortal = layer.portalItem.description?.trim();
			if (fromPortal) return fromPortal;
		} catch (error) {
			console.warn('[Layer metadata] Portal item fetch failed:', error);
		}
	}

	return layer.description?.trim() || null;
}

/**
 * Portal item "snippet" — used as the group summary in the panel.
 * @param {import('@arcgis/core/layers/Layer').default} layer
 * @returns {Promise<string | null>}
 */
async function fetchPortalSummary(layer) {
	if (!layer?.portalItem) return null;

	try {
		await layer.portalItem.load();
		return layer.portalItem.snippet?.trim() || null;
	} catch (error) {
		console.warn('[Layer metadata] Portal summary fetch failed:', error);
		return null;
	}
}

/** @param {import('@arcgis/core/layers/Layer').default} layer @param {string | null | undefined} storedUrl */
function collectMetadataUrls(layer, storedUrl) {
	/** @type {string[]} */
	const urls = [];

	for (const raw of [layer.url, storedUrl, layer.portalItem?.url]) {
		const resolved = resolveMetadataUrl(raw, layer);
		if (resolved && !urls.includes(resolved)) {
			urls.push(resolved);
		}
	}

	return urls;
}

/** @param {string | null | undefined} url @param {import('@arcgis/core/layers/Layer').default} layer */
function resolveMetadataUrl(url, layer) {
	const base = url?.replace(/\/+$/, '').replace(/\?.*$/, '');
	if (!base) return null;

	if (/\/(FeatureServer|MapServer)\/\d+$/i.test(base)) {
		return base;
	}

	const sublayerId = layer.layerId ?? layer.sourceJSON?.id;

	if (/\/(FeatureServer|MapServer)$/i.test(base) && sublayerId != null) {
		return `${base}/${sublayerId}`;
	}

	return base;
}

/** @param {string} metadataUrl @returns {Promise<string | null>} */
async function fetchRestDescription(metadataUrl) {
	try {
		const response = await fetch(`${metadataUrl}?f=json`);
		if (!response.ok) return null;

		const data = await response.json();
		return data.description?.trim() || null;
	} catch (error) {
		console.warn('[Layer metadata] REST fetch failed:', metadataUrl, error);
		return null;
	}
}

/** @param {import('@arcgis/core/layers/Layer').default} layer */
function isSharedFeatureServiceLayer(layer) {
	const url = layer.url ?? layer.portalItem?.url ?? '';
	return /\/(FeatureServer|MapServer)(?:\/\d+)?$/i.test(url);
}

export function clearSublayerMetadataCache() {
	cache.clear();
	visualFieldCache.clear();
}
