<script>
	import { mapLayers, mapLegend, mapLoading, setMapLayerVisibility } from '$lib/mapStore';
	import LegendAccordion from '$lib/components/LegendAccordion.svelte';
	import Spinner from '$lib/components/Spinner.svelte';
</script>

<section class="panel">
	<h2>Layers</h2>

	{#if $mapLoading}
		<div class="empty"><Spinner label="Loading map layers" /></div>
	{:else if $mapLayers.length === 0}
		<p class="empty">No layers found for this map.</p>
	{:else}
		<!-- Map layers are ready, build the layer list -->
		<ul class="layer-list">
			{#each $mapLayers as layer (layer.id)}
				{@const legendEntry = $mapLegend.find((entry) => entry.layerId === layer.id)}
				<li
					class="layer"
					class:selected={layer.visible}
					style:padding-left="{layer.depth * 1.25}rem"
				>
					<button
						type="button"
						class="layer-row"
						class:on={layer.visible}
						aria-pressed={layer.visible}
						aria-label="{layer.visible ? 'Hide' : 'Show'} {layer.title}"
						onclick={() => setMapLayerVisibility(layer.id, !layer.visible)}
					>
						<span class="circle"></span>
						<span class="layer-title">{layer.title}</span>
					</button>

					{#if layer.visible}
						<div class="layer-body">
							<LegendAccordion
								items={legendEntry?.items ?? []}
								layerId={layer.id}
								layerUrl={layer.url}
							/>
						</div>
					{/if}
				</li>
			{/each}
		</ul>
	{/if}
</section>

<style>
	.panel {
		box-sizing: border-box;
		height: 100%;
		width: var(--panel-width, 31.75rem);
		flex-shrink: 0;
		min-width: 0;
		overflow-x: hidden;
		overflow-y: auto;
		padding: 1rem;
		background: #f7f7f7;
		border-right: 1px solid #000;
	}

	h2 {
		margin: 0 0 1rem;
		font-size: 1.1rem;
	}

	.empty {
		color: #666;
		font-size: 0.9rem;
	}

	.layer-list {
		list-style: none;
		margin: 0;
		padding: 0;
		display: flex;
		flex-direction: column;
		gap: 0.5rem;
	}

	.layer {
		border-bottom: 1px solid #e4e4e4;
		padding-bottom: 0.5rem;
	}

	.layer-row {
		display: flex;
		align-items: center;
		gap: 0.6rem;
		width: 100%;
		padding: 0.15rem 0;
		border: none;
		background: none;
		font: inherit;
		text-align: left;
		cursor: pointer;
	}

	.circle {
		flex-shrink: 0;
		width: 0.875rem;
		height: 0.875rem;
		border: 1.5px solid #333;
		border-radius: 50%;
		position: relative;
	}

	.layer-row.on .circle::after {
		content: '';
		position: absolute;
		top: 50%;
		left: 50%;
		width: 0.375rem;
		height: 0.375rem;
		border-radius: 50%;
		background: #000;
		transform: translate(-50%, -50%);
	}

	.layer-title {
		flex: 1;
		font-size: 0.9rem;
		font-weight: 600;
		color: #222;
	}

	.layer.selected .layer-title {
		color: #000;
	}

	.layer-body {
		margin-top: 0.25rem;
		min-width: 0;
	}
</style>
