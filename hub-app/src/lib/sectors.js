import responsibleGrowthIcon from '$lib/assets/icons/sector/responsible-growth.svg';
import naturalTreasuresIcon from '$lib/assets/icons/sector/natural-treasures.svg';
import transportationIcon from '$lib/assets/icons/sector/transportation-infrastructure.svg';
import communityProsperityIcon from '$lib/assets/icons/sector/community-prosperity.svg';

export const sectors = [
	{
		id: 'responsible-growth',
		label: 'Responsible Growth',
		color: '#f68a46',
		button: '#f8a16b',
		icon: responsibleGrowthIcon
	},
	{
		id: 'natural-treasures',
		label: 'Natural Treasures',
		color: '#a9b54d',
		button: '#bec77a',
		icon: naturalTreasuresIcon
	},
	{
		id: 'transportation-infrastructure',
		label: 'Transportation + Infrastructure',
		color: '#33a5b9',
		button: '#66bccb',
		icon: transportationIcon
	},
	{
		id: 'community-prosperity',
		label: 'Community Prosperity',
		color: '#81749a',
		button: '#a197b3',
		icon: communityProsperityIcon
	}
];

export const sectorById = Object.fromEntries(sectors.map((sector) => [sector.id, sector]));
