import { writable } from 'svelte/store';

export const approvedTools = writable([]);

export const sectorColors = writable({
	'Natural_Treasures': '#588c02',
	'Community_Prosperity': '#625181',
	'Responsible_Growth': '#3064B2',
	'Transportation_/_Infrastructure': '#F68A46'
});

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
		mapId: ''
	}
};

export const sectorDefaults = {
	'natural-treasures': {
		name: 'Natural Treasures',
		color: '#588c02',
		description: 'Explore conservation priorities, wildlife corridors, stream health, and land cover change across the region.'
	},
	'community-prosperity': {
		name: 'Community Prosperity',
		color: '#625181',
		description: 'Explore arts, culture, urbanization, recreation, social vulnerability, and business opportunity data.'
	},
	'responsible-growth': {
		name: 'Responsible Growth',
		color: '#3064B2',
		description: 'Explore zoning, carbon credit programs, and growth management data across the region.'
	},
	'transportation-infrastructure': {
		name: 'Transportation + Infrastructure',
		color: '#F68A46',
		description: 'Explore freight volume, traffic change, infrastructure benchmarks, and transportation network data.'
	}
};
