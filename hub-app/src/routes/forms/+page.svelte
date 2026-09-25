<script>
	import { forms } from '$lib/forms';

	const list = Object.entries(forms).map(([slug, form]) => ({ slug, ...form }));
</script>

<svelte:head>
	<title>Data entry forms · Thrive Data Portal</title>
	<meta name="robots" content="noindex" />
</svelte:head>

<main class="forms-index">
	<h1>Data entry forms</h1>
	<p class="intro">Internal tools for reviewing and editing ArcGIS survey responses.</p>

	<ul>
		{#each list as form (form.slug)}
			<li>
				<a href={`/forms/${form.slug}`}>{form.title}</a>
				{#if form.description}
					<p>{form.description}</p>
				{/if}
			</li>
		{/each}
	</ul>
</main>

<style>
	.forms-index {
		max-width: 56.25rem;
		margin: 0 auto;
		padding: 3rem 1.5rem 5rem;
	}

	h1 {
		margin: 0 0 0.5rem;
		font-size: 2rem;
	}

	.intro {
		margin: 0 0 2rem;
		color: #656364;
	}

	ul {
		display: grid;
		gap: 1rem;
		margin: 0;
		padding: 0;
		list-style: none;
	}

	li {
		padding: 1.25rem 1.5rem;
		border: 1px solid #d6d6ce;
		border-radius: 0.625rem;
	}

	a {
		font-size: 1.25rem;
		font-weight: 600;
		color: #3064b2;
	}

	p {
		margin: 0.5rem 0 0;
		color: #656364;
	}
</style>
