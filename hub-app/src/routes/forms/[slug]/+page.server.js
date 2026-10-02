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
	const columns = form.columns ?? [];
	const outFields = [
		...new Set(
			[
				form.globalIdField,
				form.labelField,
				...columns.flatMap((column) =>
					typeof column === 'string' ? [column] : (column.sources ?? [])
				)
			].filter(Boolean)
		)
	].join(',');

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
				values: columns.map((column) => {
					if (typeof column === 'object') {
						return column.value ? column.value(attrs) : (attrs[column.name] ?? '');
					}
					return column === form.statusField && form.statusValue
						? form.statusValue(attrs)
						: (attrs[column] ?? '');
				}),
				editUrl: surveyEditUrl(form, globalId),
				photosUrl: form.attachments ? `/forms/${params.slug}/photos/${globalId}` : null
			});
		}

		if (!data.exceededTransferLimit || features.length === 0) break;
		offset += pageSize;
	}

	const statusConfig = {};
	for (const column of columns) {
		if (typeof column === 'object' && column.styles) {
			statusConfig[column.name] = { styles: column.styles, empty: column.empty ?? null };
		}
	}
	if (form.statusField) {
		statusConfig[form.statusField] = {
			styles: form.statusStyles ?? {},
			empty: form.emptyStatus ?? null
		};
	}

	return {
		title: form.title,
		description: form.description ?? '',
		columns: columns.map((column) =>
			typeof column === 'object'
				? { name: column.name, label: column.label ?? column.name.replaceAll('_', ' ') }
				: { name: column, label: form.columnLabels?.[column] ?? column.replaceAll('_', ' ') }
		),
		statusConfig,
		hasAttachments: Boolean(form.attachments),
		rows
	};
}
