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
 *   columns         Fields shown as columns. Each entry is either a field name
 *                   (renders the raw value) or an object for a derived/tag column:
 *                     { name, label, sources?, value?, styles?, empty? }
 *                   `sources` lists raw fields the value needs (added to outFields);
 *                   `value(attrs)` derives the cell; `styles` maps a raw value to
 *                   { label, tone } (tone: green/red/blue/grey) so it renders as a tag,
 *                   with `empty` for null/empty.
 *   columnLabels    Optional map of column name → header text (for string columns).
 *   statusField     Legacy single-status shortcut: column name + statusValue/statusStyles/
 *                   emptyStatus. Prefer object columns for new forms.
 *   statusValue     Optional (attrs) => value to derive the status cell for statusField.
 *   statusStyles    Map of raw value → { label, tone } for statusField.
 *   emptyStatus     Tag used when a statusField cell is null/empty.
 *   surveyUrl       Survey123 share URL (no query string).
 *   attachments     Optional. Enables the /forms/<slug>/photos/<globalId> page and the
 *                   "Photos" button on each row. Shape: { slots: [{ keyword, label, kind }] }
 *                   where keyword is the Survey123 attachment keyword (e.g. photo_1) and
 *                   kind is 'image' (resized client-side) or 'video' (uploaded as-is).
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
		surveyUrl: 'https://survey123.arcgis.com/share/e7199db2f8354ce7a2eecc55cafa6d5a',
		attachments: {
			slots: [
				{ keyword: 'photo_1', label: 'Photo 1', kind: 'image' },
				{ keyword: 'photo_2', label: 'Photo 2', kind: 'image' },
				{ keyword: 'photo_3', label: 'Photo 3', kind: 'image' },
				{ keyword: 'short_video', label: 'Short video', kind: 'video' }
			]
		}
	},
	'hub-data-submission': {
		title: 'Hub Data Submission — Tool Editor',
		description: 'Every tool submitted to the Hub, linked to its editable Survey123 response.',
		serviceUrl:
			'https://services3.arcgis.com/xpR2E2r2KmCE5hF3/arcgis/rest/services/survey123_46ca68a2d700413a86df84e23eca68f9_results/FeatureServer',
		layerId: 0,
		globalIdField: 'globalid',
		objectIdField: 'objectid',
		labelField: 'title',
		columns: ['author', 'is_the_tool_approved'],
		statusField: 'is_the_tool_approved',
		statusStyles: {
			Y: { label: 'Yes', tone: 'green' },
			N: { label: 'No', tone: 'red' }
		},
		emptyStatus: { label: 'Needs review', tone: 'grey' },
		surveyUrl: 'https://survey123.arcgis.com/share/46ca68a2d700413a86df84e23eca68f9'
	},
	'cms-data-descriptions': {
		title: 'CMS Data Descriptions — Map Content Editor',
		description:
			'Every group, layer, and sublayer in the sector maps, linked to its editable CMS description response.',
		serviceUrl:
			'https://services3.arcgis.com/xpR2E2r2KmCE5hF3/arcgis/rest/services/CMS_DataDetails/FeatureServer',
		layerId: 0,
		globalIdField: 'GlobalID',
		objectIdField: 'FID',
		labelField: 'node_title',
		columns: [
			'map_title',
			'group_path',
			{
				name: 'new_description',
				label: 'New description filled',
				sources: ['new_description'],
				value: (attrs) => (attrs.new_description?.trim() ? 'yes' : 'no'),
				styles: {
					yes: { label: 'Yes', tone: 'green' },
					no: { label: 'No', tone: 'red' }
				}
			},
			{
				name: 'data_source',
				label: 'Data Source',
				sources: ['data_source_link'],
				value: (attrs) => ((attrs.data_source_link ?? '').trim() ? 'yes' : 'no'),
				styles: {
					yes: { label: 'Yes', tone: 'green' },
					no: { label: 'No', tone: 'red' }
				}
			},
			{
				name: 'inter_hub_link',
				label: 'Inter-hub link',
				sources: ['inter_hub_link_url'],
				value: (attrs) => ((attrs.inter_hub_link_url ?? '').trim() ? 'yes' : 'no'),
				styles: {
					yes: { label: 'Yes', tone: 'green' },
					no: { label: 'No', tone: 'red' }
				}
			}
		],
		surveyUrl: 'https://survey123.arcgis.com/share/d4df43573e564cc4b1b933ef1e974b10'
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
