<script>
	import { fetchLayerMetadata } from '$lib/map/fetchSublayerMetadata';

	let {
		title = 'Legend',
		items = [],
		layerId = null,
		layerUrl = null,
		embedded = false
	} = $props();

	let open = $state(false);
	let metadataLoading = $state(false);
	let metadataLoaded = $state(false);
	let description = $state(null);
	let copyright = $state(null);

	const hasLegendItems = $derived(items.length > 0);
	const hasContent = $derived(hasLegendItems || !!layerId);
	const isOpen = $derived(embedded || open);

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

	async function toggleOpen() {
		if (embedded) return;

		if (open) {
			open = false;
			return;
		}

		open = true;
		await loadMetadata();
	}

	$effect(() => {
		if (embedded && layerId) {
			loadMetadata();
		}
	});
</script>

{#if hasContent}
	<div class="accordion" class:embedded>
		{#if !embedded}
			<button type="button" class="accordion-header" onclick={toggleOpen}>
				<span class="chevron">{isOpen ? '▼' : '▶'}</span>
				<span>{title}</span>
			</button>
		{/if}

		{#if isOpen}
			<div class="content">
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
						{#each items as item, index (`${title}-${index}`)}
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
	</div>
{/if}

<style>
	.accordion {
		margin-top: 0.35rem;
		margin-left: 1.5rem;
		min-width: 0;
		max-width: 100%;
	}

	.accordion.embedded {
		margin-top: 0.5rem;
		margin-left: 1.25rem;
	}

	.accordion-header {
		display: flex;
		align-items: center;
		gap: 0.35rem;
		padding: 0;
		border: none;
		background: none;
		font: inherit;
		font-size: 0.85rem;
		color: #555;
		cursor: pointer;
	}

	.chevron {
		font-size: 0.65rem;
	}

	.content {
		margin-top: 0.35rem;
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
		max-width: 16px;
		max-height: 16px;
	}
</style>
