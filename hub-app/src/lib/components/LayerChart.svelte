<script>
	import { mapView } from '$lib/mapStore';
	import { registerCharts } from '$lib/map/charts';

	let { layerId, chartIndex = 0 } = $props();

	let chartTitle = $state('');

	/** @param {HTMLElement & { layer?: unknown, model?: unknown, autoDisposeChart?: boolean }} el */
	function chartAttachment(el) {
		registerCharts();

		return mapView.subscribe((view) => {
			const layer = view?.map?.findLayerById(layerId);
			const config = layer?.charts?.[chartIndex];
			if (!layer || !config) return;

			const title = (config.title?.content?.text ?? '').trim();
			const footer = (config.footer?.content?.text ?? '').trim();
			chartTitle = title;

			el.autoDisposeChart = true;
			el.layer = layer;
			// The chart draws its own title (and often repeats it as a footer
			// caption). Render the title as HTML instead, so hide the in-chart
			// copies to avoid showing the same text twice.
			el.model = {
				...config,
				title: config.title ? { ...config.title, visible: false } : config.title,
				footer:
					config.footer && footer && footer === title
						? { ...config.footer, visible: false }
						: config.footer
			};
		});
	}
</script>

{#if chartTitle}
	<p class="chart-title">{chartTitle}</p>
{/if}

<arcgis-chart {@attach chartAttachment} class="chart"></arcgis-chart>

<style>
	.chart-title {
		margin: 0 0 0.5rem;
		font-size: 1.125rem;
		font-weight: 600;
		color: #000;
	}

	/* `display: flex` is required: the component's own `:host` is a flex row and
	   that is what stretches its internal `.chart-wrapper` to the host height.
	   Overriding it with `display: block` collapses the chart to ~154px. */
	.chart {
		display: flex;
		width: 100%;
		height: auto;
		aspect-ratio: 4 / 3;
	}
</style>
