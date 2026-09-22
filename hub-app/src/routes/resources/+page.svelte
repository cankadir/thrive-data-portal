<script>
	import { page } from '$app/state';
	import ResourceCard from '$lib/components/ResourceCard.svelte';
	import ThinkingIndicator from '$lib/components/ThinkingIndicator.svelte';
	import thriveLogo from '$lib/assets/thrive-logo.svg';

	const PROMPTS = [
		'Where are freight bottlenecks?',
		"I'm working on health care access.",
		"I'm looking for demographic data.",
		'Where is population growing the fastest?',
		'Does everyone in the region have access to broadband?',
		'Where are utility costs rising?',
		'Are senior services meeting needs in my area?',
		'What areas are most important to conserve for biodiversity?',
		'Where are at risk species?',
		'Where are invasive species a problem?',
		'Where are there gaps in health insurance and access to health care?'
	];

	let query = $state('');
	let submitted = $state('');
	let rankedIds = $state(null);
	let reasoning = $state('');
	let loading = $state(false);
	let error = $state('');
	let outOfContext = $state(false);

	let typed = $state('');
	let focused = $state(false);

	const approvedTools = $derived(page.data.approvedTools ?? []);

	const toolsById = $derived.by(() => {
		const map = {};
		for (const tool of approvedTools) {
			map[tool.attributes.globalid] = tool;
		}
		return map;
	});

	const visibleTools = $derived.by(() => {
		if (!rankedIds || rankedIds.length === 0) return approvedTools;
		return rankedIds.map((id) => toolsById[id]).filter(Boolean);
	});

	$effect(() => {
		if (query || focused) return;

		if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
			typed = PROMPTS[0];
			return;
		}

		let promptIndex = 0;
		let charIndex = 0;
		let deleting = false;
		let timer;

		const tick = () => {
			const full = PROMPTS[promptIndex];

			if (deleting) {
				charIndex -= 1;
				typed = full.slice(0, charIndex);
				if (charIndex === 0) {
					deleting = false;
					promptIndex = (promptIndex + 1) % PROMPTS.length;
					timer = setTimeout(tick, 400);
				} else {
					timer = setTimeout(tick, 25);
				}
				return;
			}

			charIndex += 1;
			typed = full.slice(0, charIndex);
			if (charIndex === full.length) {
				deleting = true;
				timer = setTimeout(tick, 1800);
			} else {
				timer = setTimeout(tick, 55);
			}
		};

		tick();
		return () => clearTimeout(timer);
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
		} catch {
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
	<section class="headline">
		<div class="wrap">
			<h1>Resource Library</h1>
			<p class="lead">What are you working on today?</p>

			<form
				class="search"
				onsubmit={(e) => {
					e.preventDefault();
					submit();
				}}
			>
				<div class="search-box">
					<input
						type="search"
						aria-label="Search resources"
						bind:value={query}
						onfocus={() => (focused = true)}
						onblur={() => (focused = false)}
					/>
					{#if !query && !focused}
						<span class="typewriter" aria-hidden="true">{typed}<span class="caret"></span></span>
					{/if}
				</div>
			</form>

			{#if submitted}
				<div class="search-return">
					{#if loading}
						<ThinkingIndicator />
					{:else if error}
						<p class="search-error">{error}</p>
					{:else if outOfContext}
						<p>
							<span class="return-label">Search return:</span>
							Query out of Context. Try a query about regional planning or the resources in this library.
						</p>
					{:else if reasoning}
						<p><span class="return-label">Search return:</span> {reasoning}</p>
					{/if}

					<p class="results-meta">
						{visibleTools.length} results for "{submitted}"
						<button class="clear" type="button" onclick={clearSearch}>Clear</button>
					</p>
				</div>
			{/if}
		</div>
	</section>

	<section class="cards">
		{#if visibleTools.length > 0}
			<div class="grid">
				{#each visibleTools as tool (tool.attributes.globalid)}
					<ResourceCard {tool} />
				{/each}
			</div>
		{/if}
	</section>

	<section class="tagline">
		<div class="wrap">
			<h2>more info about resource library</h2>
			<p>
				Provide links back to other parts of resource hub here as well as link to data only page
				where users can filter, search for, and download data
			</p>
		</div>
	</section>

	<footer class="footer">
		<img src={thriveLogo} alt="Thrive Regional Partnership" />
	</footer>
</div>

<style>
	.hub {
		background: #e0e0d9;
		min-height: 100vh;
		color: #000;
	}

	.wrap {
		width: min(1144px, calc(100% - 64px));
		margin: 0 auto;
	}

	/* Headline */
	.headline {
		padding: 42px 0 0;
	}

	.headline .wrap {
		display: flex;
		flex-direction: column;
		gap: 26px;
	}

	.headline h1 {
		margin: 0;
		font-size: clamp(44px, 5vw, 64px);
		font-weight: 900;
		line-height: 1.05;
	}

	.lead {
		margin: 0;
		font-size: 20px;
		font-weight: 900;
		line-height: 28px;
	}

	/* Search */
	.search-box {
		position: relative;
		--search-font: clamp(22px, 1.4vw + 10px, 32px);
	}

	.search-box input {
		width: 100%;
		padding: 0.375em 0.625em;
		font-family: inherit;
		font-size: var(--search-font);
		font-weight: 900;
		line-height: 1.1;
		color: #000;
		background: #fff;
		border: none;
		border-radius: 0.78em;
		outline: none;
	}

	.search-box input:focus {
		box-shadow: 0 0 0 2px #3064b2;
	}

	.typewriter {
		position: absolute;
		top: 50%;
		left: 0.625em;
		transform: translateY(-50%);
		overflow: hidden;
		max-width: calc(100% - 1.25em);
		font-size: var(--search-font);
		font-weight: 600;
		line-height: 1.1;
		color: #b6b3a7;
		white-space: nowrap;
		pointer-events: none;
	}

	.caret {
		display: inline-block;
		width: 2px;
		height: 1em;
		margin-left: 2px;
		background: currentColor;
		vertical-align: -0.12em;
		animation: blink 1s steps(1) infinite;
	}

	@keyframes blink {
		50% {
			opacity: 0;
		}
	}

	/* Search return */
	.search-return {
		display: flex;
		flex-direction: column;
		gap: 12px;
		font-size: 20px;
		line-height: 28px;
	}

	.search-return p {
		margin: 0;
	}

	.return-label {
		font-weight: 600;
	}

	.search-error {
		padding: 12px 18px;
		background: #ffeae6;
		border-radius: 12px;
		color: #f05133;
		font-weight: 600;
	}

	.results-meta {
		font-size: 16px;
		color: #656364;
	}

	.clear {
		margin-left: 8px;
		padding: 2px 12px;
		font-family: inherit;
		font-size: 14px;
		font-weight: 600;
		color: #3064b2;
		background: none;
		border: 2px solid #3064b2;
		border-radius: 999px;
		cursor: pointer;
	}

	/* Cards */
	.cards {
		padding: 32px 0 0;
	}

	.grid {
		display: grid;
		grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
		gap: 24px;
		width: min(1512px, calc(100% - 88px));
		margin: 0 auto;
	}

	/* Tagline */
	.tagline {
		padding: 48px 0 96px;
	}

	.tagline .wrap {
		display: flex;
		flex-direction: column;
		gap: 36px;
		align-items: flex-end;
		padding: 48px 24px;
		text-align: right;
	}

	.tagline h2 {
		margin: 0;
		font-size: clamp(32px, 4vw, 48px);
		font-weight: 900;
		line-height: 48px;
	}

	.tagline p {
		margin: 0;
		max-width: 858px;
		font-size: 20px;
		line-height: 28px;
	}

	/* Footer */
	.footer {
		padding: 35px 47px 36px;
	}

	.footer img {
		width: 269px;
		height: auto;
	}

	@media (max-width: 900px) {
		.tagline .wrap {
			align-items: flex-start;
			text-align: left;
		}
	}
</style>
