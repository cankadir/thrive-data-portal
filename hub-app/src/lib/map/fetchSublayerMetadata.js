// This file is used to fetch the layer metadata for the map layers
// Sublayer information was wrong f missing, this file ensures the metadata is recieved from the layer itself and the service catalog

import { get } from 'svelte/store';
import { mapView } from '$lib/mapStore';

/** @type {Map<string, Promise<{ description: string | null, copyright: string | null, source: string }>>} */
const cache = new Map();

/** @type {Map<string, Promise<{ id: number, name: string }[]>>} */
const serviceCatalogCache = new Map();

/**
 * Fetch layer-specific description + copyright using the live ArcGIS layer.
 * @param {string} layerId
 * @param {{ layerUrl?: string | null }} [options]
 */
export async function fetchLayerMetadata(layerId, options = {}) {
	if (!layerId) {
		return { description: null, copyright: null, source: 'none' };
	}

	const cacheKey = `${layerId}:${options.layerUrl ?? ''}`;
	if (cache.has(cacheKey)) {
		return cache.get(cacheKey);
	}

	const request = (async () => {
		const view = get(mapView);
		const layer = view?.map?.findLayerById(layerId);

		if (!layer) {
			console.warn('[Layer metadata] Layer not found:', layerId);
			return { description: null, copyright: null, source: 'missing-layer' };
		}

		try {
			await layer.load();
		} catch (error) {
			console.warn('[Layer metadata] Failed to load layer:', layerId, error);
		}

		const candidateUrls = collectMetadataUrls(layer, options.layerUrl);
		console.log('[Layer metadata]', layer.title || layerId, {
			candidateUrls,
			layerUrl: layer.url,
			sublayerId: layer.layerId ?? layer.sourceJSON?.id ?? null
		});

		for (const metadataUrl of candidateUrls) {
			const restMetadata = await fetchSublayerRest(metadataUrl);
			if (restMetadata) {
				return restMetadata;
			}
		}

		// Stale web-map URLs (e.g. /162 when service only has /152) — match by title
		const serviceUrl = getServiceRoot(candidateUrls[0] ?? layer.url ?? options.layerUrl);
		if (serviceUrl && layer.title) {
			const resolved = await fetchMetadataByTitle(serviceUrl, layer.title);
			if (resolved) {
				return resolved;
			}
		}

		const sourceDescription = layer.sourceJSON?.description?.trim();
		const sourceCopyright = layer.sourceJSON?.copyrightText?.trim();

		if (sourceDescription || sourceCopyright) {
			return {
				description: sourceDescription || null,
				copyright: sourceCopyright || null,
				source: 'source-json'
			};
		}

		// Skip parent Feature Service portal copy — it is shared across all sublayers
		if (layer.portalItem && !isSharedFeatureServiceLayer(layer)) {
			try {
				await layer.portalItem.load();
				const description = layer.portalItem.description?.trim() || null;

				if (description) {
					return {
						description,
						copyright: layer.copyright?.trim() || null,
						source: 'portal-item'
					};
				}
			} catch (error) {
				console.warn('[Layer metadata] Portal item fetch failed:', layerId, error);
			}
		}

		return {
			description: layer.description?.trim() || null,
			copyright: layer.copyright?.trim() || null,
			source: 'layer-props'
		};
	})();

	cache.set(cacheKey, request);
	return request;
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

/** @param {string | null | undefined} url */
function getServiceRoot(url) {
	const base = url?.replace(/\/+$/, '').replace(/\?.*$/, '');
	if (!base) return null;

	const match = base.match(/^(.*\/(?:FeatureServer|MapServer))(?:\/\d+)?$/i);
	return match?.[1] ?? null;
}

/** @param {string} metadataUrl */
async function fetchSublayerRest(metadataUrl) {
	try {
		const response = await fetch(`${metadataUrl}?f=json`);
		if (!response.ok) return null;

		const data = await response.json();
		if (data.error) return null;

		const description = data.description?.trim() || null;
		const copyright = data.copyrightText?.trim() || null;

		if (description || copyright) {
			return { description, copyright, source: 'sublayer-rest' };
		}
	} catch (error) {
		console.warn('[Layer metadata] REST fetch failed:', metadataUrl, error);
	}

	return null;
}

/** @param {string} serviceUrl @param {string} title */
async function fetchMetadataByTitle(serviceUrl, title) {
	const catalog = await getServiceCatalog(serviceUrl);
	if (!catalog.length) return null;

	const normalized = normalizeLayerTitle(title);
	const match =
		catalog.find((entry) => normalizeLayerTitle(entry.name) === normalized) ??
		catalog.find((entry) => titlesMatchLoosely(normalized, normalizeLayerTitle(entry.name)));

	if (!match) return null;

	return fetchSublayerRest(`${serviceUrl}/${match.id}`);
}

/** @param {string} serviceUrl */
async function getServiceCatalog(serviceUrl) {
	if (serviceCatalogCache.has(serviceUrl)) {
		return serviceCatalogCache.get(serviceUrl);
	}

	const request = (async () => {
		try {
			const response = await fetch(`${serviceUrl}?f=json`);
			if (!response.ok) return [];

			const data = await response.json();
			if (data.error || !Array.isArray(data.layers)) return [];

			return data.layers.map((/** @type {{ id: number, name: string }} */ layer) => ({
				id: layer.id,
				name: layer.name
			}));
		} catch (error) {
			console.warn('[Layer metadata] Service catalog fetch failed:', serviceUrl, error);
			return [];
		}
	})();

	serviceCatalogCache.set(serviceUrl, request);
	return request;
}

/** @param {string} title */
function normalizeLayerTitle(title) {
	return title
		.toLowerCase()
		.replace(/[^\w\s]/g, ' ')
		.replace(/\s+/g, ' ')
		.trim();
}

/** @param {string} a @param {string} b */
function titlesMatchLoosely(a, b) {
	if (a.includes(b) || b.includes(a)) return true;

	const stripYear = (/** @type {string} */ value) => value.replace(/\bfy?\s*\d{4}\b/g, '').trim();
	const aCore = stripYear(a);
	const bCore = stripYear(b);

	return aCore.length > 8 && bCore.length > 8 && (aCore.includes(bCore) || bCore.includes(aCore));
}

/** @param {import('@arcgis/core/layers/Layer').default} layer */
function isSharedFeatureServiceLayer(layer) {
	const url = layer.url ?? layer.portalItem?.url ?? '';
	return /\/(FeatureServer|MapServer)(?:\/\d+)?$/i.test(url);
}

export function clearSublayerMetadataCache() {
	cache.clear();
	serviceCatalogCache.clear();
}
