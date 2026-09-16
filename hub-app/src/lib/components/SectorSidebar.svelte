<script>
	import { slide } from 'svelte/transition';
	import { SvelteSet } from 'svelte/reactivity';
	import { mapLayers, mapLegend, mapLoading, setMapLayerVisibility } from '$lib/mapStore';
	import { fetchLayerMetadata, fetchLayerVisualFieldAlias } from '$lib/map/fetchSublayerMetadata';
	import mapPin from '$lib/assets/icons/icon/map-pin.png';

	let {
		sectorName = 'Sector',
		sectorColor = '#a9b54d',
		description = 'Rorem ipsum dolor sit amet, consectetur adipiscing elit. Etiam eu turpis molestie, dictum est a, mattis tellus.'
	} = $props();

	let layerMetadata = $state({});
	let layerAlias = $state({});
	let loadingMeta = $state({});
	let layers = $state([]);
	let legend = $state([]);
	let isLoading = $state(true);
	let openGroups = new SvelteSet();

	async function loadLayerInfo(layer) {
		if (!layer.visible || loadingMeta[layer.id]) return;

		loadingMeta[layer.id] = true;

		const [meta, alias] = await Promise.all([
			fetchLayerMetadata(layer.id, { layerUrl: layer.url }),
			fetchLayerVisualFieldAlias(layer.id, { layerUrl: layer.url })
		]);

		layerMetadata[layer.id] = meta;
		if (alias) layerAlias[layer.id] = alias;
		loadingMeta[layer.id] = false;
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

	function groupBg(id, title) {
		if (!openGroups.has(id)) return 'transparent';
		if (isCrossSector(title)) return '#f68a46';
		const num = parseInt(sectorColor.replace('#', ''), 16);
		const r = Math.min(255, ((num >> 16) & 0xff) + Math.round(255 * 0.8));
		const g = Math.min(255, ((num >> 8) & 0xff) + Math.round(255 * 0.8));
		const b = Math.min(255, (num & 0xff) + Math.round(255 * 0.8));
		return `rgb(${r}, ${g}, ${b})`;
	}

	function toggleGroup(id) {
		if (openGroups.has(id)) {
			openGroups.delete(id);
		} else {
			openGroups.add(id);
		}
	}

	async function toggleLayer(layerId, visible, layerUrl) {
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

<aside class="sidebar">
	<header class="sidebar-header" style:background-color={sectorColor}>
		<h2 class="sidebar-title">
			<img src={mapPin} alt="" class="title-icon" style="filter:invert(1);" />
			{sectorName} Sector Map
		</h2>
		<p class="sidebar-desc">{description}</p>
	</header>

	<div class="sidebar-body">
		{#if isLoading}
			<p class="empty">Loading map layers…</p>
		{:else if groups.length === 0}
			<p class="empty">No layer groups available for this map.</p>
		{:else}
			{#each groups as { group, children } (group.id)}
				<div class="group">
					<button
						class="group-header"
						style="background-color: {groupBg(group.id, group.title)};"
						onclick={() => toggleGroup(group.id)}
					>
						<span class="group-title">{group.title}</span>
						<span class="toggle-icon">{openGroups.has(group.id) ? '−' : '+'}</span>
					</button>

					{#if openGroups.has(group.id)}
						<div class="layer-list" transition:slide={{ duration: 200 }}>
							{#each children as layer (layer.id)}
								<div class="layer-item">
									<button
										class="layer-toggle"
										onclick={() => toggleLayer(layer.id, !layer.visible, layer.url)}
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
												<p class="legend-heading">{layerAlias[layer.id] ?? 'Legend'}</p>
												<ul class="legend-list">
													{#each legendFor(layer.id).items as item (item.label || item.type || i)}
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
		background: #faf9f9;
		border-right: 1px solid #ddd;
		width: 508px;
		flex-shrink: 0;
	}

	.sidebar-header {
		padding: 1rem;
		border-bottom: 1px solid #ddd;
		color: #fff;
	}

	.sidebar-header .sidebar-desc {
		color: rgba(255, 255, 255, 0.85);
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
		width: 24px;
		height: 24px;
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
		height: 50px;
		padding: 6px 16px;
		border: 1px solid #000;
		border-bottom: none;
		font: inherit;
		cursor: pointer;
	}

	.group-title {
		font-family: 'Source Sans 3', sans-serif;
		font-weight: 900;
		font-size: 20px;
		color: #080808;
		line-height: 1.27;
	}

	.toggle-icon {
		font-size: 24px;
		font-weight: 300;
		line-height: 1;
		color: #080808;
		width: 20px;
		height: 20px;
		display: flex;
		align-items: center;
		justify-content: center;
		flex-shrink: 0;
	}

	.layer-list {
		margin: 0;
		padding: 0;
	}

	.layer-item {
		padding: 0 16px;
		border-top: 1px solid #ccc;
	}

	.layer-toggle {
		display: flex;
		align-items: center;
		gap: 8px;
		width: 100%;
		padding: 8px 0;
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
		width: 18px;
		height: 18px;
		border-radius: 50%;
		border: 1px solid #000;
		background: transparent;
		display: flex;
		align-items: center;
		justify-content: center;
	}

	.radio-dot {
		width: 10px;
		height: 10px;
		border-radius: 50%;
		background: #c7c7c7;
	}

	.layer-name {
		font-family: 'Source Sans 3', sans-serif;
		font-weight: 300;
		font-size: 20px;
		color: #000;
		line-height: 1.2;
	}

	.layer-detail {
		padding: 0 0 0.5rem 2rem;
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
		max-width: 16px;
		max-height: 16px;
		display: block;
	}

	.layer-copyright {
		margin: 0;
		font-size: 0.72rem;
		color: #888;
		font-style: italic;
	}
</style>
