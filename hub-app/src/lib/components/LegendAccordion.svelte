<script>
	import { fetchLayerMetadata } from '$lib/map/fetchSublayerMetadata';

	let { items = [], layerId = null, layerUrl = null } = $props();

	let metadataLoading = $state(false);
	let metadataLoaded = $state(false);
	let description = $state(null);
	let copyright = $state(null);

	const hasLegendItems = $derived(items.length > 0);
	const hasContent = $derived(hasLegendItems || !!layerId);

	async function loadMetadata() {
		if (!layerId || metadataLoaded || metadataLoading) return;

		metadataLoading = true;
		description = null;
		copyright = null;

		try {
			const data = await fetchLayerMetadata(layerId, { layerUrl });
			description = data.description;
			copyright = data.copyright;
			metadataLoaded = true;
		} finally {
			metadataLoading = false;
		}
	}

	$effect(() => {
		if (layerId) {
			loadMetadata();
		}
	});
</script>

{#if hasContent}
	<div class="accordion">
		{#if layerId}
			<dl class="metadata">
				<div class="meta-row">
					<dt>Description</dt>
					<dd class="description">
						{#if metadataLoading}
							<span class="loading">Loading layer info…</span>
						{:else if description}
							{@html description}
						{:else}
							None
						{/if}
					</dd>
				</div>
				<div class="meta-row">
					<dt>Copyright</dt>
					<dd>
						{#if metadataLoading}
							<span class="loading">Loading layer info…</span>
						{:else}
							{copyright || 'None'}
						{/if}
					</dd>
				</div>
			</dl>
		{/if}

		{#if hasLegendItems}
			<ul class="legend" class:with-divider={!!layerId}>
				{#each items as item, index (`${layerId}-${index}`)}
					<li class="legend-item">
						{#if item.previewHtml}
							<span class="legend-symbol">{@html item.previewHtml}</span>
						{/if}
						<span>{item.label || item.type}</span>
					</li>
				{/each}
			</ul>
		{/if}
	</div>
{/if}

<style>
	.accordion {
		margin-top: 0.5rem;
		margin-left: 1.25rem;
		min-width: 0;
		max-width: 100%;
	}

	.metadata {
		margin: 0 0 0.5rem;
	}

	.meta-row {
		margin-bottom: 0.5rem;
	}

	.meta-row dt {
		font-size: 0.75rem;
		font-weight: 600;
		color: #666;
	}

	.meta-row dd {
		margin: 0.15rem 0 0;
		font-size: 0.85rem;
		color: #444;
		overflow-wrap: anywhere;
		word-wrap: break-word;
	}

	.description {
		overflow-wrap: anywhere;
		word-wrap: break-word;
	}

	.description :global(a) {
		overflow-wrap: anywhere;
		word-wrap: break-word;
	}

	.description :global(p) {
		margin: 0 0 0.35rem;
	}

	.description :global(p:last-child) {
		margin-bottom: 0;
	}

	.loading {
		color: #888;
		font-style: italic;
	}

	.legend {
		list-style: none;
		margin: 0;
		padding: 0;
	}

	.legend.with-divider {
		margin-top: 0.5rem;
		border-top: 1px solid #ddd;
		padding-top: 0.5rem;
	}

	.legend-item {
		display: flex;
		align-items: center;
		gap: 0.5rem;
		font-size: 0.85rem;
		color: #444;
		padding: 0.15rem 0;
	}

	.legend-symbol :global(svg),
	.legend-symbol :global(img),
	.legend-symbol :global(div) {
		max-width: 1rem;
		max-height: 1rem;
	}
</style>
