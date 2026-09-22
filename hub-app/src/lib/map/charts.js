import { defineCustomElements } from '@arcgis/charts-components/dist/loader';

let registered = false;

/** Register the `<arcgis-chart>` custom elements once, client-side only. */
export function registerCharts() {
	if (registered || typeof window === 'undefined') return;
	registered = true;
	defineCustomElements();
}
