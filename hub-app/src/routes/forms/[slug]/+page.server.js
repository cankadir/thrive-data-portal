import { error } from '@sveltejs/kit';
import { formBySlug, surveyEditUrl } from '$lib/forms';

const MAX_PAGES = 500;

/** @type {import('./$types').PageServerLoad} */
export async function load({ params, fetch }) {
	const form = formBySlug(params.slug);
	if (!form) {
		throw error(404, `Unknown form: ${params.slug}`);
	}

	const layerRes = await fetch(`${form.serviceUrl}/${form.layerId}?f=json`);
	if (!layerRes.ok) {
		throw error(502, `Could not read layer metadata (${layerRes.status})`);
	}
	const layer = await layerRes.json();
	if (layer.error) {
		throw error(502, layer.error.message ?? 'Feature service error');
	}

	const pageSize = layer.maxRecordCount ?? 1000;
	const outFields = [form.globalIdField, form.labelField, ...(form.columns ?? [])].join(',');

	const rows = [];
	let offset = 0;

	for (let page = 0; page < MAX_PAGES; page += 1) {
		const query = new URLSearchParams({
			where: '1=1',
			outFields,
			returnGeometry: 'false',
			orderByFields: form.objectIdField,
			resultOffset: String(offset),
			resultRecordCount: String(pageSize),
			f: 'json'
		});

		const res = await fetch(`${form.serviceUrl}/${form.layerId}/query?${query}`);
		if (!res.ok) {
			throw error(502, `Feature query failed (${res.status})`);
		}
		const data = await res.json();
		if (data.error) {
			throw error(502, data.error.message ?? 'Feature service error');
		}

		const features = data.features ?? [];
		for (const feature of features) {
			const attrs = feature.attributes;
			const globalId = attrs[form.globalIdField];
			rows.push({
				globalId,
				label: attrs[form.labelField] || 'Untitled record',
				values: (form.columns ?? []).map((column) => attrs[column] ?? ''),
				editUrl: surveyEditUrl(form, globalId),
				photosUrl: form.attachments ? `/forms/${params.slug}/photos/${globalId}` : null
			});
		}

		if (!data.exceededTransferLimit || features.length === 0) break;
		offset += pageSize;
	}

	return {
		title: form.title,
		description: form.description ?? '',
		columns: form.columns ?? [],
		statusField: form.statusField ?? null,
		statusStyles: form.statusStyles ?? {},
		emptyStatus: form.emptyStatus ?? null,
		hasAttachments: Boolean(form.attachments),
		rows
	};
}
