import { filteredToolsView } from '$lib/storeLinks';

// Import Approved tools in the layout to have it available to all pages
/** @type {import('./$types').LayoutLoad} */
export async function load({ fetch }) {
	const url = `${filteredToolsView}/0/query?where=1%3D1&outFields=*&returnGeometry=false&f=json`;
	const response = await fetch(url);

	if (!response.ok) {
		throw new Error(`Failed to fetch approved tools: ${response.status}`);
	}

	const data = await response.json();

	return {
		approvedTools: data.features ?? []
	};
}
