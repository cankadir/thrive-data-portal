import { error } from '@sveltejs/kit';
import { formBySlug } from '$lib/forms';

/** GlobalID_2 values are plain lowercase GUIDs (36 chars, no braces). */
const GUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/** @type {import('./$types').PageServerLoad} */
export async function load({ params, fetch }) {
	const form = formBySlug(params.slug);
	if (!form || !form.attachments) {
		throw error(404, `This form has no photo page: ${params.slug}`);
	}
	if (!GUID.test(params.globalId)) {
		throw error(404, 'Invalid record id');
	}

	const layerUrl = `${form.serviceUrl}/${form.layerId}`;
	const query = new URLSearchParams({
		where: `${form.globalIdField}='${params.globalId}'`,
		outFields: `${form.objectIdField},${form.labelField}`,
		returnGeometry: 'false',
		f: 'json'
	});

	const res = await fetch(`${layerUrl}/query?${query}`);
	if (!res.ok) throw error(502, `Record lookup failed (${res.status})`);
	const data = await res.json();
	if (data.error) throw error(502, data.error.message ?? 'Feature service error');

	const feature = data.features?.[0];
	if (!feature) throw error(404, 'Record not found');

	const oid = feature.attributes[form.objectIdField];
	const label = feature.attributes[form.labelField] || 'Untitled record';
	const attachUrl = `${layerUrl}/${oid}`;

	const listRes = await fetch(`${attachUrl}/attachments?f=json&returnMetadata=true`);
	const list = await listRes.json();
	const attachments = (list.attachmentInfos ?? []).map((a) => ({
		id: a.id,
		name: a.name,
		contentType: a.contentType ?? '',
		size: a.size ?? 0,
		keywords: a.keywords ?? ''
	}));

	return {
		slug: params.slug,
		title: form.title,
		label,
		globalId: params.globalId,
		slots: form.attachments.slots,
		attachUrl,
		attachments
	};
}
