// CMS content for the map panel. Descriptions, source links and inter-hub links
// are authored in the CMS_DataDetails feature layer (survey123-backed) and are
// authoritative — there is no fallback to REST/portal metadata.

const CMS_LAYER_URL =
	'https://services3.arcgis.com/xpR2E2r2KmCE5hF3/arcgis/rest/services/CMS_DataDetails/FeatureServer/0';

const OUT_FIELDS = [
	'kind',
	'node_title',
	'item_id',
	'url',
	'new_description',
	'source',
	'data_source_link',
	'inter_hub_link_name',
	'inter_hub_link_url'
].join(',');

/** @type {Map<string, Promise<object[]>>} */
const cache = new Map();

/**
 * CMS rows for a webmap (keyed by the webmap item id), fetched once per map.
 * @param {string | null | undefined} mapId
 * @returns {Promise<object[]>}
 */
export function loadCmsForMap(mapId) {
	if (!mapId) return Promise.resolve([]);
	if (!cache.has(mapId)) {
		cache.set(mapId, fetchCmsRows(mapId));
	}
	return cache.get(mapId);
}

/** @param {string} mapId */
async function fetchCmsRows(mapId) {
	try {
		const params = new URLSearchParams({
			where: `map_id='${mapId.replaceAll("'", "''")}'`,
			outFields: OUT_FIELDS,
			returnGeometry: 'false',
			resultRecordCount: '2000',
			f: 'json'
		});
		const response = await fetch(`${CMS_LAYER_URL}/query?${params}`);
		if (!response.ok) return [];

		const data = await response.json();
		return (data.features ?? []).map((/** @type {any} */ feature) => feature.attributes);
	} catch (error) {
		console.warn('[CMS] Failed to load CMS rows:', error);
		return [];
	}
}

/** @param {object | null | undefined} row */
export function cmsDescription(row) {
	return row?.new_description?.trim() || null;
}

/** @param {object | null | undefined} row */
export function cmsLinks(row) {
	const sourceText = row?.source?.trim() || null;
	const sourceUrl = row?.data_source_link?.trim() || null;
	const interName = row?.inter_hub_link_name?.trim() || null;
	const interUrl = row?.inter_hub_link_url?.trim() || null;

	return {
		source: sourceText || sourceUrl ? { text: sourceText ?? sourceUrl, url: sourceUrl } : null,
		interHub: interName || interUrl ? { name: interName ?? interUrl, url: interUrl } : null
	};
}

/**
 * Find the CMS row for a live map layer: item_id (groups/layers), then
 * normalized URL (sublayers sharing an item_id), then title (plain groups).
 * @param {string | null | undefined} mapId
 * @param {{ itemId?: string | null, url?: string | null, title?: string | null }} identity
 */
export async function matchCmsRow(mapId, { itemId, url, title }) {
	const rows = await loadCmsForMap(mapId);
	if (rows.length === 0) return null;

	const targetUrl = normalizeUrl(url);
	const targetTitle = normalizeTitle(title);

	/** @param {object[]} list */
	const narrow = (list) => {
		if (list.length <= 1) return list;

		if (targetUrl) {
			const byUrl = list.filter((row) => normalizeUrl(row.url) === targetUrl);
			if (byUrl.length > 0) list = byUrl;
		}
		if (list.length > 1 && targetTitle) {
			const byTitle = list.filter((row) => normalizeTitle(row.node_title) === targetTitle);
			if (byTitle.length > 0) list = byTitle;
		}
		return list;
	};

	if (itemId) {
		const byItem = rows.filter((row) => row.item_id === itemId);
		if (byItem.length > 0) return narrow(byItem)[0] ?? null;
	}
	if (targetUrl) {
		const byUrl = rows.filter((row) => normalizeUrl(row.url) === targetUrl);
		if (byUrl.length > 0) return narrow(byUrl)[0] ?? null;
	}
	if (targetTitle) {
		const byTitle = rows.filter((row) => normalizeTitle(row.node_title) === targetTitle);
		if (byTitle.length > 0) return narrow(byTitle)[0] ?? null;
	}
	return null;
}

/** @param {string | null | undefined} url */
function normalizeUrl(url) {
	return url ? url.split('?')[0].replace(/\/+$/, '').toLowerCase() : null;
}

/** @param {string | null | undefined} title */
function normalizeTitle(title) {
	return (title ?? '').trim().toLowerCase();
}

export function clearCmsCache() {
	cache.clear();
}
