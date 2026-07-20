<script>
	import { maps } from '$lib/store';
	import flagIcon from '$lib/assets/icons/icon/flag-triangle-right.png';
	import mapIcon from '$lib/assets/icons/icon/map.png';
	import mapPinIcon from '$lib/assets/icons/icon/map-pin.png';
	import targetIcon from '$lib/assets/icons/icon/target.png';
	import chartIcon from '$lib/assets/icons/icon/line-chart.png';
	import cursorIcon from '$lib/assets/icons/icon/navigation-cursor.png';

	const buttons = [
		{ label: 'Resource Library', href: '/resources', icon: flagIcon },
		{ label: 'Regional Activity Map', href: '/regional-activity', icon: mapIcon },
		...Object.entries(maps).map(([id, map]) => {
			const icons = {
				'natural-treasures': mapPinIcon,
				'community-prosperity': targetIcon,
				'responsible-growth': chartIcon,
				'transportation-infrastructure': cursorIcon
			};
			return { label: map.title, href: `/maps/${id}`, icon: icons[id] };
		})
	];
</script>

<main class="landing">
	<h1>Welcome Thrive Regional Data Hub</h1>
	<p>This page is created to test and demo the ESRI to front end connections. Not the final product.</p>
	<p>Lorem ipsum dolor sit, amet consectetur adipisicing elit. Labore possimus asperiores distinctio numquam eum, in ipsum, magnam quo neque, repudiandae inventore iste quis nobis. Praesentium at itaque velit culpa debitis.</p>
	
	<p>Please select a section to view.</p>

	<div class="buttons">
		{#each buttons as { label, href, icon }}
			<a class="button" href={href}>
				<img src={icon} alt="" class="button-icon" style="filter: invert(1);" />
				{label}
			</a>
		{/each}
	</div>
</main>

<style>
	.landing {
		padding: 1.5rem;
	}
	.buttons {
		display: flex;
		flex-direction: row;
		flex-wrap: wrap;
		gap: 1rem;
		margin-bottom: 1rem;
	}
	.button {
		padding: 0.5rem 1rem;
		border-radius: 0.5rem;
		color: #fff;
		background-color: #32c8db;
		font-family: 'Arial', sans-serif;
		display: inline-flex;
		align-items: center;
		gap: 0.5rem;
	}

	.button-icon {
		width: 20px;
		height: 20px;
		flex-shrink: 0;
	}
</style>
