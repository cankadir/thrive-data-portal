/**
 * Registry of data-entry surveys backed by an ArcGIS FeatureServer layer.
 *
 * Each entry becomes a page at /forms/<slug> that lists every feature and links
 * it to its editable Survey123 response. To add a form, append an entry here.
 *
 * Entry shape:
 *   title           Heading shown on the page.
 *   description     Optional short intro.
 *   serviceUrl      FeatureServer root (no trailing slash).
 *   layerId         Layer index within the service.
 *   globalIdField   Field holding the GlobalID used as the Survey123 `globalId` param.
 *   objectIdField   OID field, used for stable pagination ordering.
 *   labelField      Main field shown as the (clickable) record label.
 *   columns         Extra fields shown as columns.
 *   statusField     Optional column whose values render as coloured tags.
 *   statusStyles    Map of raw value → { label, tone } (tone: green/red/blue/grey).
 *   emptyStatus     Tag used when a status cell is null/empty.
 *   surveyUrl       Survey123 share URL (no query string).
 */
export const forms = {
	'regional-activity-map': {
		title: 'Regional Activity Map — Project Editor',
		description:
			'Every project polygon in the Regional Activity Map dataset, linked to its editable Survey123 response.',
		serviceUrl:
			'https://services3.arcgis.com/xpR2E2r2KmCE5hF3/arcgis/rest/services/260919_RAM_Data_Polygons_Can_2/FeatureServer',
		layerId: 0,
		globalIdField: 'GlobalID_2',
		objectIdField: 'ObjectId',
		labelField: 'project_name',
		columns: ['sector', 'organization', 'review_status'],
		statusField: 'review_status',
		statusStyles: {
			yes: { label: 'Yes', tone: 'green' },
			no: { label: 'No', tone: 'red' },
			in_review: { label: 'In review', tone: 'blue' }
		},
		emptyStatus: { label: 'Needs review', tone: 'grey' },
		surveyUrl: 'https://survey123.arcgis.com/share/e7199db2f8354ce7a2eecc55cafa6d5a'
	}
};

export function formBySlug(slug) {
	return forms[slug] ?? null;
}

/** Build the Survey123 edit URL for a given feature's global id. */
export function surveyEditUrl(form, globalId) {
	const url = new URL(form.surveyUrl);
	url.searchParams.set('mode', 'edit');
	url.searchParams.set('globalId', globalId);
	return url.toString();
}
