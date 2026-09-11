<script>
	import { page } from '$app/state';
	import ResourceCard from '$lib/components/ResourceCard.svelte';
	import ThinkingIndicator from '$lib/components/ThinkingIndicator.svelte';

	let query = $state('');
	let submitted = $state('');
	let rankedIds = $state(null);
	let reasoning = $state('');
	let loading = $state(false);
	let error = $state('');
	let outOfContext = $state(false);

	const approvedTools = $derived(page.data.approvedTools ?? []);

	const toolsById = $derived.by(() => {
		const map = new Map();
		for (const tool of approvedTools) {
			map.set(tool.attributes.globalid || tool.attributes.objectid, tool);
		}
		return map;
	});

	const visibleTools = $derived.by(() => {
		if (!rankedIds || rankedIds.length === 0) return approvedTools;
		return rankedIds.map((id) => toolsById.get(id)).filter(Boolean);
	});

	async function submit() {
		const q = query.trim();
		error = '';
		reasoning = '';
		rankedIds = null;
		outOfContext = false;

		if (!q) {
			submitted = '';
			return;
		}

		submitted = q;
		loading = true;
		try {
			const res = await fetch('/api/search-resources', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ query: q, tools: approvedTools })
			});
			const data = await res.json();
			if (!res.ok) {
				error = data.error || `Request failed (${res.status})`;
			} else if (data.outOfContext) {
				outOfContext = true;
			} else {
				rankedIds = data.ids;
				reasoning = data.reasoning;
			}
		} catch (e) {
			error = 'Could not reach the search service.';
		} finally {
			loading = false;
		}
	}

	function clearSearch() {
		query = '';
		submitted = '';
		rankedIds = null;
		reasoning = '';
		error = '';
		outOfContext = false;
	}
</script>

<div class="hub">
	<div class="hero">
		<div class="hero-text">
			<h1 class="hero-title">Thrive Resource Hub</h1>
			<p class="hero-lead">
				Eget feugiat sapien diam nec nisl. Aenean gravida turpis nisi, consequat dictum risus
				dapibus.
			</p>
			<p class="hero-body">
				Duis felis ante, varius in neque eu, tempor suscipit sem. Maecenas ullamcorper gravida sem
				sit amet cursus. Etiam pulvinar purus vitae justo pharetra consequat. Mauris id mi ut arcu
				feugiat maximus. Mauris consequat tellus id tempus aliquet. Nam pulvinar blandit velit, id
				condimentum diam faucibus at.
			</p>
			<p class="hero-body">
				Proin vitae facilisis nisi, ac posuere leo. Quisque mauris dolor, fringilla sed. Aliquam
				lacus nisi, sollicitudin at nisi nec, fermentum congue felis.
			</p>
		</div>
	</div>

	<form
		class="search"
		onsubmit={(e) => {
			e.preventDefault();
			submit();
		}}
	>
		<input
			type="search"
			placeholder="Search resources..."
			aria-label="Search resources"
			bind:value={query}
		/>
		<button type="submit" class="search-btn" disabled={loading}>
			{loading ? 'Searching...' : 'Search'}
		</button>
	</form>

	{#if submitted}
		<div class="results-info">
			{#if loading}
				<ThinkingIndicator />
			{/if}
			{#if outOfContext}
				<p class="ooc">Query out of Context</p>
			{/if}
			{#if reasoning}
				<p class="reasoning"><span class="reasoning-label">Why these results:</span> {reasoning}</p>
			{/if}
			{#if error}
				<p class="error">{error}</p>
			{/if}
		</div>
	{/if}

	<p class="hub-count">
		{outOfContext
			? `Try a query about regional planning or the resources in this library.`
			: submitted
				? `${visibleTools.length} results for "${submitted}"`
				: `${approvedTools.length} approved tools in the resource library.`}
		{#if submitted}
			<button class="reset" type="button" onclick={clearSearch}>Clear</button>
		{/if}
	</p>

	{#if visibleTools.length > 0}
		<div class="card-grid">
			{#each visibleTools as tool (tool.attributes.globalid || tool.attributes.objectid)}
				<ResourceCard {tool} />
			{/each}
		</div>
	{/if}
</div>

<style>
	.hub {
		background: #d6d6ce;
		padding: 3rem 3rem 4rem;
	}

	.hero {
		display: flex;
		max-width: 1500px;
		margin: 0 auto 2.5rem;
	}

	.hero-text {
		max-width: 900px;
	}

	.hero-title {
		margin: 0 0 1.5rem;
		font-size: 4rem;
		line-height: 1.1;
	}

	.hero-lead {
		margin: 0 0 1rem;
		font-size: 1.25rem;
		font-weight: 900;
		line-height: 1.4;
	}

	.hero-body {
		margin: 0 0 0.75rem;
		font-size: 1.25rem;
		font-weight: 300;
		line-height: 1.4;
	}

	.search {
		display: flex;
		gap: 0.75rem;
		max-width: 760px;
		margin: 0 auto 0.75rem;
	}

	.search input {
		flex: 1;
		padding: 0.75rem 1.25rem;
		font-family: 'Source Sans 3', sans-serif;
		font-size: 1.1rem;
		border: 2px solid #656364;
		border-radius: 999px;
		background: #fff;
	}

	.search-btn {
		padding: 0.75rem 1.5rem;
		font-family: 'Source Sans 3', sans-serif;
		font-size: 1.1rem;
		font-weight: 900;
		color: #fff;
		background: #3064b2;
		border: none;
		border-radius: 999px;
		cursor: pointer;
	}

	.search-btn:disabled {
		opacity: 0.6;
		cursor: default;
	}

	.results-info {
		max-width: 760px;
		margin: 0 auto 1rem;
	}

	.reasoning {
		margin: 0;
		padding: 0.75rem 1.25rem;
		background: #ececec;
		border-radius: 12px;
		font-size: 0.95rem;
		line-height: 1.4;
	}

	.reasoning-label {
		font-weight: 900;
	}

	.ooc {
		margin: 0;
		padding: 0.75rem 1.25rem;
		background: #fff6dd;
		color: #8a6d00;
		border-radius: 12px;
		font-size: 1.05rem;
		font-weight: 900;
		text-align: center;
	}

	.error {
		margin: 0;
		padding: 0.75rem 1.25rem;
		background: #ffeae6;
		color: #f05133;
		border-radius: 12px;
		font-weight: 700;
	}

	.hub-count {
		max-width: 1500px;
		margin: 0 auto 1.5rem;
		color: #656364;
	}

	.reset {
		margin-left: 0.75rem;
		padding: 2px 10px;
		font-family: inherit;
		font-weight: 900;
		color: #3064b2;
		background: none;
		border: 2px solid #3064b2;
		border-radius: 999px;
		cursor: pointer;
	}

	.card-grid {
		display: grid;
		grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
		gap: 1.75rem;
		max-width: 1500px;
		margin: 0 auto;
	}
</style>
