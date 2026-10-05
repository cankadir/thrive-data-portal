import { sectorById } from '$lib/sectors';

export const maps = {
	'natural-treasures': {
		title: 'Natural Treasures',
		mapId: 'aba702c5420e4a36ac645f14a00ba8f1'
	},
	'community-prosperity': {
		title: 'Community Prosperity',
		mapId: ''
	},
	'responsible-growth': {
		title: 'Responsible Growth',
		mapId: ''
	},
	'transportation-infrastructure': {
		title: 'Transportation + Infrastructure',
		mapId: '25c75ac490b94b85b02aa4fd2f341fbb'
	},
	'regional-activity': {
		title: 'Regional Activity Map',
		mapId: '79e19dd5e63645beb992122c502b69e5'
	}
};

/**
 * Flip to false to serve the "Coming soon" page for the Regional Activity Map
 * instead of the live map. A `?ram=on|off` query param on `/regional-activity`
 * overrides this at runtime (handy during a demo).
 */
export const regionalActivityMapReady = true;

// Per-sector copy only; colour/icon/button/tint all come from `sectors.js`.
const sectorCopy = {
	'natural-treasures': {
		question:
			'How do we protect and leverage the natural assets that define our region and support long-term prosperity?',
		miniTitle: 'The Natural Environment',
		description:
			"The Cradle of Southern Appalachia is one of North America's most biodiverse yet least protected landscapes. This unique geography is at the heart of the region’s character."
	},
	'community-prosperity': {
		description:
			'Explore arts, culture, urbanization, recreation, social vulnerability, and business opportunity data.'
	},
	'responsible-growth': {
		description:
			'Explore zoning, carbon credit programs, and growth management data across the region.'
	},
	'transportation-infrastructure': {
		question:
			'Can people, goods, and information move efficiently across our region to support economic competitiveness and quality of life?',
		description:
			'Explore freight volume, traffic change, infrastructure benchmarks, and transportation network data.'
	}
};

export const sectorDefaults = Object.fromEntries(
	Object.entries(sectorCopy).map(([id, copy]) => [
		id,
		{ ...sectorById[id], name: sectorById[id].label, ...copy }
	])
);
