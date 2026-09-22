<script>
	import { mapView } from '$lib/mapStore';
	import { registerCharts } from '$lib/map/charts';

	let { layerId, chartIndex = 0 } = $props();

	/** @param {HTMLElement & { layer?: unknown, model?: unknown, autoDisposeChart?: boolean }} el */
	function chartAttachment(el) {
		registerCharts();

		return mapView.subscribe((view) => {
			const layer = view?.map?.findLayerById(layerId);
			const config = layer?.charts?.[chartIndex];
			if (!layer || !config) return;

			el.autoDisposeChart = true;
			el.layer = layer;
			el.model = config;
		});
	}
</script>

<arcgis-chart {@attach chartAttachment} class="chart"></arcgis-chart>

<style>
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
