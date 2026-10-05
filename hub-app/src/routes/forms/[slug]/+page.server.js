import { error } from '@sveltejs/kit';
import { formBySlug, surveyEditUrl } from '$lib/forms';

const MAX_PAGES = 500;
const ATTACHMENT_CHUNK = 1000;

/**
 * Object ids that have at least one attachment, resolved in bulk (one
 * queryAttachments call per chunk of ids, not one call per feature).
 * @param {any} form
 * @param {any[]} features
 * @param {typeof fetch} fetch
 */
async function attachedObjectIds(form, features, fetch) {
	const ids = features
		.map((feature) => feature.attributes[form.objectIdField])
		.filter((id) => id != null);

	const attached = new Set();
	for (let i = 0; i < ids.length; i += ATTACHMENT_CHUNK) {
		const params = new URLSearchParams({
			objectIds: ids.slice(i, i + ATTACHMENT_CHUNK).join(','),
			f: 'json'
		});
		const res = await fetch(`${form.serviceUrl}/${form.layerId}/queryAttachments?${params}`);
		if (!res.ok) continue;
		const data = await res.json();
		for (const group of data.attachmentGroups ?? []) {
			if (group.attachmentInfos?.length) attached.add(group.parentObjectId);
		}
	}
	return attached;
}

/** @param {{ geometry?: any }} feature */
function hasGeometry(feature) {
	const geometry = feature?.geometry;
	if (!geometry) return false;
	return Boolean(
		geometry.rings?.length ||
		geometry.paths?.length ||
		geometry.points?.length ||
		geometry.x != null ||
		geometry.y != null
	);
}

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
	const wantsGeometry = columns.some(
		(column) => typeof column === 'object' && Boolean(column.geometry)
	);
	const wantsAttachments =
		layer.hasAttachments &&
		columns.some((column) => typeof column === 'object' && Boolean(column.attachments));
	const outFields = [
		...new Set(
			[
				form.globalIdField,
				form.labelField,
				...(wantsAttachments ? [form.objectIdField] : []),
				...columns.flatMap((column) =>
					typeof column === 'string' ? [column] : (column.sources ?? [])
				)
			].filter(Boolean)
		)
	].join(',');

	const features = [];
	let offset = 0;

	for (let page = 0; page < MAX_PAGES; page += 1) {
		const query = new URLSearchParams({
			where: '1=1',
			outFields,
			returnGeometry: wantsGeometry ? 'true' : 'false',
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

		const batch = data.features ?? [];
		features.push(...batch);

		if (!data.exceededTransferLimit || batch.length === 0) break;
		offset += pageSize;
	}

	const attachedOids = wantsAttachments
		? await attachedObjectIds(form, features, fetch)
		: new Set();

	const rows = features.map((feature) => {
		const attrs = feature.attributes;
		const globalId = attrs[form.globalIdField];
		return {
			globalId,
			label: attrs[form.labelField] || 'Untitled record',
			values: columns.map((column) => {
				if (typeof column === 'object') {
					if (column.geometry) return hasGeometry(feature) ? 'yes' : 'no';
					if (column.attachments) return attachedOids.has(attrs[form.objectIdField]) ? 'yes' : 'no';
					return column.value ? column.value(attrs) : (attrs[column.name] ?? '');
				}
				return column === form.statusField && form.statusValue
					? form.statusValue(attrs)
					: (attrs[column] ?? '');
			}),
			editUrl: surveyEditUrl(form, globalId),
			photosUrl: form.attachments ? `/forms/${params.slug}/photos/${globalId}` : null
		};
	});

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
				? {
						name: column.name,
						label: column.label ?? column.name.replaceAll('_', ' '),
						truncate: column.truncate ?? false
					}
				: { name: column, label: form.columnLabels?.[column] ?? column.replaceAll('_', ' ') }
		),
		statusConfig,
		hasAttachments: Boolean(form.attachments),
		rows
	};
}
