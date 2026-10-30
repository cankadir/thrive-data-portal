// Layer content for the map panel. Descriptions and links are read from the
// `cms_simple` table (see cmsContent.js) and matched by map name + layer title,
// which is authoritative for the sector maps — there is no fallback to
// REST/portal metadata.

import { get } from 'svelte/store';
import { mapView } from '$lib/mapStore';
import {
	matchCmsRow,
	cmsTitle,
	cmsDescription,
	cmsLinks,
	clearCmsCache
} from '$lib/map/cmsContent';

/** @typedef {{ title: string | null, description: string | null, source: { text: string, url: string | null } | null, interHub: { name: string, url: string | null } | null }} LayerContent */

const EMPTY = { title: null, description: null, source: null, interHub: null };

/** @param {object} row */
function contentFromRow(row) {
	const { source, interHub } = cmsLinks(row);
	return { title: cmsTitle(row), description: cmsDescription(row), source, interHub };
}

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
		const configured = layer.getFieldAlias?.(fieldName)?.trim();
		if (configured && configured !== fieldName) return configured;

		const fieldAlias = field?.alias?.trim();
		if (fieldAlias && fieldAlias !== fieldName) return fieldAlias;

		// Raster layers are the exception: an ImageServer never lists the
		// classification field (`ClassName`, `value`) in `fields`, so both lookups
		// above fail. The only human label Esri publishes is the popup's field
		// label — prefixed `Raster.ClassName` → "Projected Land Cover". When even
		// that is absent, return null: a raw column name is worse than no heading.
		return popupFieldLabel(layer.popupTemplate, fieldName);
	})();

	visualFieldCache.set(cacheKey, request);
	return request;
}

/**
 * Label the popup config gives a field.
 *
 * Two raster quirks: image-service fields are prefixed `Raster.`, and the
 * renderer's value field is a pseudo-field — `value`/`Value` is exposed to the
 * popup as `Raster.ServicePixelValue` (which is where the display name is set).
 * Esri's own placeholder labels there are not headings, so they resolve to null.
 * @param {any} popupTemplate
 * @param {string} fieldName
 */
function popupFieldLabel(popupTemplate, fieldName) {
	const infos = popupTemplate?.fieldInfos ?? [];
	const candidates = [
		fieldName,
		`Raster.${fieldName}`,
		RASTER_POPUP_FIELDS[fieldName.toLowerCase()]
	].filter(Boolean);

	const match = infos.find((/** @type {{ fieldName: string }} */ info) =>
		candidates.includes(info.fieldName)
	);
	const label = match?.label?.trim();
	if (!label || label === fieldName) return null;
	return GENERIC_RASTER_LABELS.has(label.toLowerCase()) ? null : label;
}

/** Raster renderer fields as they appear in `popupInfo.fieldInfos`. */
const RASTER_POPUP_FIELDS = {
	value: 'Raster.ServicePixelValue',
	count: 'Raster.Count',
	red: 'Raster.Red',
	green: 'Raster.Green',
	blue: 'Raster.Blue'
};

/** Esri's default raster labels — placeholders, not real headings. */
const GENERIC_RASTER_LABELS = new Set(['pixel value', 'service pixel value', 'raw pixel value']);

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
 * CMS content for one layer: description, source link and inter-hub link.
 * @param {{ mapTitle?: string | null, layerTitle?: string | null }} identity
 * @returns {Promise<LayerContent>}
 */
export async function fetchLayerContent(identity = {}) {
	if (!identity.mapTitle || !identity.layerTitle) return EMPTY;

	const cacheKey = `${identity.mapTitle}:${identity.layerTitle}`;
	if (cache.has(cacheKey)) {
		return cache.get(cacheKey);
	}

	const request = (async () => {
		const row = await matchCmsRow(identity.mapTitle, identity.layerTitle);
		return row ? contentFromRow(row) : EMPTY;
	})();

	cache.set(cacheKey, request);
	return request;
}

/**
 * Batch CMS content for many layers/groups at once: the table is loaded once
 * (cached in `loadCmsRows`) and matched in memory by title.
 * @param {string | null | undefined} mapTitle
 * @param {{ id: string, title: string }[]} entries
 * @returns {Promise<Record<string, LayerContent>>}
 */
export async function fetchMapContent(mapTitle, entries) {
	/** @type {Record<string, LayerContent>} */
	const result = {};
	if (!mapTitle) return result;

	await Promise.all(
		entries.map(async (entry) => {
			const row = await matchCmsRow(mapTitle, entry.title);
			if (row) result[entry.id] = contentFromRow(row);
		})
	);

	return result;
}

export function clearSublayerMetadataCache() {
	cache.clear();
	visualFieldCache.clear();
	clearCmsCache();
}
