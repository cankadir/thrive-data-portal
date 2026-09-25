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
		mapId: '33a22411395544f79554a79af04217a2'
	}
};

export const sectorDefaults = {
	'natural-treasures': {
		name: 'Natural Treasures',
		color: sectorById['natural-treasures'].color,
		button: sectorById['natural-treasures'].button,
		tint: sectorById['natural-treasures'].tint,
		question:
			'How do we protect and leverage the natural assets that define our region and support long-term prosperity?',
		description:
			'Explore conservation priorities, wildlife corridors, stream health, and land cover change across the region.'
	},
	'community-prosperity': {
		name: 'Community Prosperity',
		color: sectorById['community-prosperity'].color,
		button: sectorById['community-prosperity'].button,
		tint: sectorById['community-prosperity'].tint,
		description:
			'Explore arts, culture, urbanization, recreation, social vulnerability, and business opportunity data.'
	},
	'responsible-growth': {
		name: 'Responsible Growth',
		color: sectorById['responsible-growth'].color,
		button: sectorById['responsible-growth'].button,
		tint: sectorById['responsible-growth'].tint,
		description:
			'Explore zoning, carbon credit programs, and growth management data across the region.'
	},
	'transportation-infrastructure': {
		name: 'Transportation + Infrastructure',
		color: sectorById['transportation-infrastructure'].color,
		button: sectorById['transportation-infrastructure'].button,
		tint: sectorById['transportation-infrastructure'].tint,
		question:
			'Can people, goods, and information move efficiently across our region to support economic competitiveness and quality of life?',
		description:
			'Explore freight volume, traffic change, infrastructure benchmarks, and transportation network data.'
	}
};
