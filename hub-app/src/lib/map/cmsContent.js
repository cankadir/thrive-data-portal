// CMS content for the map panel. Descriptions and links are authored in the
// `cms_simple` table and matched to live map layers by map name + layer title.
// The whole table is loaded once and filtered in memory, so a map page never
// needs an id or a per-map query.

const CMS_TABLE_URL =
	'https://services3.arcgis.com/xpR2E2r2KmCE5hF3/arcgis/rest/services/cms_simple/FeatureServer/0';

const OUT_FIELDS = [
	'map_title',
	'layer_title_inmap',
	'layer_title_display',
	'new_description',
	'source',
	'cross_link',
	'data_source_link',
	'inter_hub_link_name',
	'inter_hub_link_url'
].join(',');

/** @type {Promise<object[]> | null} */
let rowsPromise = null;

/**
 * Every CMS row (~100). Shared by all maps; pages filter by map name.
 * @returns {Promise<object[]>}
 */
export function loadCmsRows() {
	if (!rowsPromise) rowsPromise = fetchRows();
	return rowsPromise;
}

/** @returns {Promise<object[]>} */
async function fetchRows() {
	try {
		const params = new URLSearchParams({
			where: '1=1',
			outFields: OUT_FIELDS,
			returnGeometry: 'false',
			resultRecordCount: '2000',
			f: 'json'
		});
		const response = await fetch(`${CMS_TABLE_URL}/query?${params}`);
		if (!response.ok) return [];

		const data = await response.json();
		return (data.features ?? []).map((/** @type {any} */ feature) => feature.attributes);
	} catch (error) {
		console.warn('[CMS] Failed to load CMS rows:', error);
		return [];
	}
}

/** Optional display-title override for a row. @param {object | null | undefined} row */
export function cmsTitle(row) {
	return row?.layer_title_display?.trim() || null;
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
 * CMS row for a live map node: the map name plus the layer's title in the map.
 * Group names live in the same column, so groups and layers share a namespace.
 * @param {string | null | undefined} mapTitle
 * @param {string | null | undefined} layerTitle
 */
export async function matchCmsRow(mapTitle, layerTitle) {
	const wantedMap = normalize(mapTitle);
	const wantedLayer = normalize(layerTitle);
	if (!wantedMap || !wantedLayer) return null;

	const rows = await loadCmsRows();
	return (
		rows.find(
			(row) =>
				normalize(row.map_title) === wantedMap && normalize(row.layer_title_inmap) === wantedLayer
		) ?? null
	);
}

/** Titles come from Excel and AGOL, so ignore case and stray whitespace. */
function normalize(value) {
	return String(value ?? '')
		.replace(/\s+/g, ' ')
		.trim()
		.toLowerCase();
}

export function clearCmsCache() {
	rowsPromise = null;
}
