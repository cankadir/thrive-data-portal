<script>
	import { slide } from 'svelte/transition';
	import { SvelteSet } from 'svelte/reactivity';
	import { mapLayers, mapLegend, mapLoading, setMapLayerVisibility } from '$lib/mapStore';
	import { fetchLayerMetadata, fetchLayerVisualFieldAlias } from '$lib/map/fetchSublayerMetadata';
	import LayerChart from '$lib/components/LayerChart.svelte';
	import Spinner from '$lib/components/Spinner.svelte';
	import mapPin from '$lib/assets/icons/icon/map-pin.png';
	import accordionOpen from '$lib/assets/icons/accordion-open.svg';

	let {
		sectorName = 'Sector',
		sectorColor = '#a9b54d',
		sectorButton = '#bec77a',
		sectorTint = '#d0d88d',
		question = '',
		description = 'Rorem ipsum dolor sit amet, consectetur adipiscing elit. Etiam eu turpis molestie, dictum est a, mattis tellus.'
	} = $props();

	let layerMetadata = $state({});
	let layerAlias = $state({});
	let loadingMeta = $state({});
	// Plain Set (not $state) so reading it inside the mapLayers effect doesn't
	// create a reactive dependency — otherwise setting loadingMeta triggers the
	// effect again and it loops forever.
	const inFlight = new Set();
	let layers = $state([]);
	let legend = $state([]);
	let isLoading = $state(true);
	let openGroups = new SvelteSet();

	async function loadLayerInfo(layer, force = false) {
		if ((!layer.visible && !force) || inFlight.has(layer.id)) return;

		inFlight.add(layer.id);
		loadingMeta[layer.id] = true;

		try {
			const [meta, alias] = await Promise.all([
				fetchLayerMetadata(layer.id, { layerUrl: layer.url }),
				fetchLayerVisualFieldAlias(layer.id, { layerUrl: layer.url })
			]);

			layerMetadata[layer.id] = meta;
			if (alias) layerAlias[layer.id] = alias;
		} finally {
			loadingMeta[layer.id] = false;
			inFlight.delete(layer.id);
		}
	}

	$effect(() => {
		const u1 = mapLayers.subscribe((v) => {
			layers = v;
			for (const l of v) {
				if (l.visible && l.depth > 0) {
					loadLayerInfo(l);
				}
			}
		});
		const u2 = mapLegend.subscribe((v) => (legend = v));
		const u3 = mapLoading.subscribe((v) => (isLoading = v));
		return () => {
			u1();
			u2();
			u3();
		};
	});

	const groups = $derived(buildGroups(layers));

	function buildGroups(lyrs) {
		const groups = [];

		for (let i = 0; i < lyrs.length; i++) {
			const layer = lyrs[i];
			if (layer.depth !== 0) continue;

			const children = [];
			let j = i + 1;
			while (j < lyrs.length && lyrs[j].depth > 0) {
				children.push(lyrs[j]);
				j++;
			}

			if (children.length > 0) {
				groups.push({ group: layer, children });
			}
		}

		return groups;
	}

	function isCrossSector(title) {
		return /cross.?sector/i.test(title);
	}

	function toggleGroup(group) {
		if (openGroups.has(group.id)) {
			openGroups.delete(group.id);
		} else {
			openGroups.add(group.id);
			// Group layers can carry a summary (portal item snippet); load it the
			// first time the accordion is opened. Most groups won't have one.
			loadLayerInfo(group, true);
		}
	}

	function toggleLayer(layerId, visible) {
		setMapLayerVisibility(layerId, visible);
		layers = layers.map((l) => (l.id === layerId ? { ...l, visible } : l));

		if (visible) {
			const layer = layers.find((l) => l.id === layerId);
			if (layer) loadLayerInfo(layer);
		}
	}

	function legendFor(layerId) {
		return legend.find((entry) => entry.layerId === layerId);
	}
</script>

<aside class="sidebar" style:--sector-button={sectorButton} style:--sector-tint={sectorTint}>
	<header class="sidebar-header" style:background-color={sectorColor}>
		<h2 class="sidebar-title">
			<img src={mapPin} alt="" class="title-icon" />
			{sectorName} Sector Map
		</h2>
		{#if question}
			<p class="sidebar-question">{question}</p>
		{/if}
		<p class="sidebar-desc">{description}</p>
	</header>

	<div class="sidebar-body">
		{#if isLoading}
			<div class="empty"><Spinner label="Loading map layers" /></div>
		{:else if groups.length === 0}
			<p class="empty">No layer groups available for this map.</p>
		{:else}
			{#each groups as { group, children } (group.id)}
				<div class="group">
					<button
						class="group-header"
						class:open={openGroups.has(group.id)}
						class:cross={isCrossSector(group.title)}
						onclick={() => toggleGroup(group)}
					>
						<span class="group-title">{group.title}</span>
						<img
							class="toggle-icon"
							class:open={openGroups.has(group.id)}
							src={accordionOpen}
							alt=""
						/>
					</button>

					{#if openGroups.has(group.id)}
						{#if layerMetadata[group.id]?.summary || layerMetadata[group.id]?.description}
							<div class="group-detail">
								{#if layerMetadata[group.id].summary}
									<p class="group-summary">{layerMetadata[group.id].summary}</p>
								{/if}
								{#if layerMetadata[group.id].description}
									<p class="group-description">{layerMetadata[group.id].description}</p>
								{/if}
							</div>
						{/if}
						<div class="layer-list" transition:slide={{ duration: 200 }}>
							{#each children as layer (layer.id)}
								<div class="layer-item">
									<button
										class="layer-toggle"
										onclick={() => toggleLayer(layer.id, !layer.visible)}
									>
										<span class="radio" class:active={layer.visible}>
											{#if layer.visible}
												<span class="radio-dot"></span>
											{/if}
										</span>
										<span class="layer-name">{layer.title}</span>
									</button>

									{#if layer.visible}
										<div class="layer-detail" transition:slide={{ duration: 150 }}>
											{#if loadingMeta[layer.id]}
												<p class="meta-loading">Loading…</p>
											{:else}
												{#if layerMetadata[layer.id]?.summary}
													<p class="layer-summary">{layerMetadata[layer.id].summary}</p>
												{/if}
												{#if layerMetadata[layer.id]?.description}
													<p class="layer-description">{layerMetadata[layer.id].description}</p>
												{/if}
											{/if}

											{#if (legendFor(layer.id)?.items ?? []).length > 0}
												{#if layerAlias[layer.id]}
													<p class="legend-heading">{layerAlias[layer.id]}</p>
												{/if}
												<ul class="legend-list">
													{#each legendFor(layer.id).items as item, i (i)}
														<li class="legend-item">
															{#if item.previewHtml}
																<span class="legend-symbol">{@html item.previewHtml}</span>
															{/if}
															<span>{item.label}</span>
														</li>
													{/each}
												</ul>
											{/if}

											{#if layerMetadata[layer.id]?.copyright}
												<p class="layer-copyright">{layerMetadata[layer.id].copyright}</p>
											{/if}
										</div>
									{/if}

									{#if layer.visible && layer.chartCount > 0}
										<div class="layer-charts">
											{#each Array.from({ length: layer.chartCount }, (_, i) => i) as index (index)}
												<LayerChart layerId={layer.id} chartIndex={index} />
											{/each}
										</div>
									{/if}
								</div>
							{/each}
						</div>
					{/if}
				</div>
			{/each}
		{/if}
	</div>
</aside>

<style>
	.sidebar {
		height: 100%;
		display: flex;
		flex-direction: column;
		overflow: hidden;
		background: #fff;
		border-right: 1px solid #000;
		width: var(--panel-width, 31.75rem);
		flex-shrink: 0;
	}

	.sidebar-header {
		padding: 1rem;
		border-bottom: 1px solid #c4c4c4;
		color: #000;
	}

	.sidebar-header .sidebar-desc {
		color: #222;
	}

	.sidebar-question {
		margin: 0 0 0.5rem;
		font-size: 1.05rem;
		font-weight: 900;
		line-height: 1.3;
	}

	.sidebar-title {
		margin: 0 0 0.5rem;
		font-size: 1.25rem;
		font-weight: 900;
		display: flex;
		align-items: center;
		gap: 0.5rem;
	}

	.title-icon {
		width: 1.5rem;
		height: 1.5rem;
		flex-shrink: 0;
	}

	.sidebar-desc {
		margin: 0;
		font-size: 0.9rem;
		color: #555;
		line-height: 1.5;
	}

	.sidebar-body {
		flex: 1;
		overflow-y: auto;
	}

	.empty {
		padding: 1rem;
		color: #888;
		font-style: italic;
	}

	.group-header {
		display: flex;
		align-items: center;
		justify-content: space-between;
		width: 100%;
		min-height: 3.25rem;
		padding: 0.5rem 1rem;
		background: #fff;
		border: 1px solid #000;
		border-bottom: none;
		border-right: none;
		font: inherit;
		cursor: pointer;
	}

	.group-header.open {
		background: #d6d6ce;
	}

	.group-header.open.cross {
		background: #f68a46;
	}

	.group-header:hover {
		background: var(--sector-tint);
	}

	.group-title {
		font-family: 'Montserrat', sans-serif;
		font-weight: 900;
		font-size: 1.375rem;
		color: #080808;
		line-height: 1.27;
	}

	.toggle-icon {
		width: 1.3125rem;
		height: 1.3125rem;
		flex-shrink: 0;
		display: block;
		transition: transform var(--anim-duration) var(--anim-ease);
	}

	/* The `+` becomes an `×` when opened. */
	.toggle-icon.open {
		transform: rotate(45deg);
	}

	@media (prefers-reduced-motion: reduce) {
		.toggle-icon {
			transition: none;
		}
	}

	.group-detail {
		padding: 0.25rem 1rem;
		border-bottom: 1px solid #c4c4c4;
	}

	.group-summary {
		margin: 0;
		font-size: 0.85rem;
		color: #222;
	}

	.group-description {
		margin: 0.3rem 0 0;
		font-size: 0.82rem;
		color: #555;
	}

	.layer-list {
		margin: 0;
		padding: 0;
	}

	.layer-item {
		padding: 0 1rem;
		border-top: 1px solid #c4c4c4;
	}

	.layer-toggle {
		display: flex;
		align-items: center;
		gap: 0.5rem;
		width: 100%;
		padding: 0.5rem 0;
		border: none;
		background: none;
		font: inherit;
		text-align: left;
		cursor: pointer;
	}

	.layer-toggle:hover {
		background: #f0f0f0;
	}

	.radio {
		flex-shrink: 0;
		width: 1.5rem;
		height: 1.5rem;
		border-radius: 50%;
		border: 1px solid #000;
		background: #fff;
		display: flex;
		align-items: center;
		justify-content: center;
	}

	.radio-dot {
		width: 0.75rem;
		height: 0.75rem;
		border-radius: 50%;
		background: #c7c7c7;
	}

	.radio.active {
		background: var(--sector-button);
	}

	.radio.active .radio-dot {
		background: #000;
	}

	.layer-toggle:hover .radio:not(.active) {
		background: var(--sector-tint);
	}

	.layer-name {
		font-family: 'Montserrat', sans-serif;
		font-weight: 300;
		font-size: 1.25rem;
		color: #000;
		line-height: 1.2;
	}

	.layer-detail {
		padding: 0 0 0.5rem 2rem;
	}

	.layer-charts {
		padding: 0.25rem 0 0.75rem;
	}

	.meta-loading {
		margin: 0 0 0.25rem;
		font-size: 0.8rem;
		color: #999;
		font-style: italic;
	}

	.layer-description {
		margin: 0 0 0.4rem;
		font-size: 0.82rem;
		color: #555;
		line-height: 1.5;
	}

	.layer-summary {
		margin: 0 0 0.3rem;
		font-size: 0.85rem;
		font-weight: 600;
		color: #222;
		line-height: 1.5;
	}

	.legend-heading {
		margin: 0.25rem 0 0.15rem;
		font-size: 0.75rem;
		font-weight: 700;
		color: #666;
		text-transform: uppercase;
		letter-spacing: 0.05em;
	}

	.legend-list {
		list-style: none;
		margin: 0 0 0.4rem;
		padding: 0;
	}

	.legend-item {
		display: flex;
		align-items: center;
		gap: 0.5rem;
		font-size: 0.82rem;
		color: #444;
		padding: 0.12rem 0;
	}

	.legend-symbol :global(svg),
	.legend-symbol :global(img) {
		max-width: 1rem;
		max-height: 1rem;
		display: block;
	}

	.layer-copyright {
		margin: 0;
		font-size: 0.72rem;
		color: #888;
		font-style: italic;
	}
</style>
