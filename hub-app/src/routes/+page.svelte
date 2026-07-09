<script>
	import { maps } from '$lib/store';

	const mapButtons = Object.entries(maps).map(([id, map]) => ({
		label: map.title,
		href: `/maps/${id}`
	}));
</script>

<main class="landing">
	<h1>Welcome Thrive Regional Data Hub</h1>
	<p>This page is created to test and demo the ESRI to front end connections. Not the final product.</p>
	<p>Lorem ipsum dolor sit, amet consectetur adipisicing elit. Labore possimus asperiores distinctio numquam eum, in ipsum, magnam quo neque, repudiandae inventore iste quis nobis. Praesentium at itaque velit culpa debitis.</p>
	
	<p>Please select a section to view.</p>

	<div class="buttons">
		<a class="button" href="/resources">Resource Library</a>

		<!-- buttons from maps in store.js -->
		{#each mapButtons as button}
			<a class="button" href={button.href}>{button.label}</a>
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
	}
</style>
