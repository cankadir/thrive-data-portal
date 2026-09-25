import responsibleGrowthIcon from '$lib/assets/icons/sector/responsible-growth.svg';
import naturalTreasuresIcon from '$lib/assets/icons/sector/natural-treasures.svg';
import transportationIcon from '$lib/assets/icons/sector/transportation-infrastructure.svg';
import communityProsperityIcon from '$lib/assets/icons/sector/community-prosperity.svg';

export const sectors = [
	{
		id: 'responsible-growth',
		label: 'Responsible Growth',
		color: '#f68a46',
		hover: '#fe8538',
		rowHover: '#fc7520',
		button: '#f8a16b',
		tint: '#fbd0b5',
		icon: responsibleGrowthIcon
	},
	{
		id: 'natural-treasures',
		label: 'Natural Treasures',
		color: '#a9b54d',
		hover: '#93a221',
		rowHover: '#93a221',
		button: '#bec77a',
		tint: '#d0d88d',
		icon: naturalTreasuresIcon
	},
	{
		id: 'transportation-infrastructure',
		label: 'Transportation + Infrastructure',
		color: '#33a5b9',
		hover: '#008fa8',
		rowHover: '#008fa8',
		button: '#66bccb',
		tint: '#99d2dc',
		icon: transportationIcon
	},
	{
		id: 'community-prosperity',
		label: 'Community Prosperity',
		color: '#81749a',
		hover: '#6b588e',
		rowHover: '#625181',
		button: '#a197b3',
		tint: '#c0b9cd',
		icon: communityProsperityIcon
	}
];

export const sectorById = Object.fromEntries(sectors.map((sector) => [sector.id, sector]));
