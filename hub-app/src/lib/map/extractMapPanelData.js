import LayerListViewModel from '@arcgis/core/widgets/LayerList/LayerListViewModel.js';
import LegendViewModel from '@arcgis/core/widgets/Legend/LegendViewModel.js';
import * as symbolUtils from '@arcgis/core/symbols/support/symbolUtils.js';
import * as reactiveUtils from '@arcgis/core/core/reactiveUtils.js';
import identityManager from '@arcgis/core/identity/IdentityManager.js';

identityManager.dialog = null;

/** @param {import('@arcgis/core/views/MapView').default} view */
export async function extractMapPanelData(view) {
	if (!view?.map) return { layers: [], legend: [] };
	await view.when();
	const layers = await extractLayers(view);
	return { layers, legend: [] };
}

/** Fast layer-only extraction, no legend */
export async function extractLayers(view) {
	if (!view?.map) return [];
	await view.when();

	let layers = [];

	try {
		const layerListVM = new LayerListViewModel({ view });
		await waitForItems(() => toArray(layerListVM.operationalItems), 2000);
		const fromList = flattenOperationalItems(layerListVM.operationalItems);
		layers = fromList.length > 0 ? fromList : safeWalkMapLayers(view);
	} catch (error) {
		console.warn('Layer extraction failed, falling back to map layers:', error);
		layers = safeWalkMapLayers(view);
	}

	return layers;
}

/** Deferred legend extraction — call after map is visible */
export async function extractLegendLazy(view) {
	if (!view?.map) return [];
	await view.when();

	let legend = [];
	try {
		const legendVM = new LegendViewModel({ view, respectLayerVisibility: false });
		legend = await extractLegend(legendVM, view);
	} catch (error) {
		console.warn('Legend extraction failed:', error);
	}
	return legend;
}

function safeWalkMapLayers(view) {
	try {
		return walkMapLayers(view.map.layers.toArray());
	} catch (e) {
		console.warn('safeWalkMapLayers failed:', e);
		return [];
	}
}

/** @param {import('@arcgis/core/widgets/Legend/LegendViewModel').default} legendVM @param {import('@arcgis/core/views/MapView').default} view */
async function extractLegend(legendVM, view) {
	await waitForItems(() => toArray(legendVM.activeLayerInfos));

	try {
		await Promise.race([
			reactiveUtils.whenOnce(() => {
				const infos = flattenTree(legendVM.activeLayerInfos);
				return infos.length > 0 && infos.every((info) => info.ready);
			}),
			new Promise((_, reject) => setTimeout(() => reject(new Error('legend timeout')), 5000))
		]);
	} catch {
		// use whatever legend data is available
	}

	const legend = [];

	for (const info of flattenTree(legendVM.activeLayerInfos)) {
		try {
			const layerId = info.layer?.id ?? null;
			let items = await legendFromElements(toArray(info.legendElements));

			if (items.length === 0 && info.layer) {
				items = await legendFromRenderer(info.layer);
			}

			if (items.length === 0) continue;

			legend.push({ layerId, title: info.title, items });
		} catch (e) {
			console.warn('Legend entry skipped:', e);
		}
	}

	// Layers missing from LegendViewModel (e.g. some hidden sublayers)
	for (const layer of walkMapLayers(view.map.layers.toArray())) {
		if (legend.some((entry) => entry.layerId === layer.id)) continue;

		try {
			const arcLayer = view.map.findLayerById(layer.id);
			if (!arcLayer) continue;
			const items = await legendFromRenderer(arcLayer);
			if (items.length > 0) {
				legend.push({ layerId: layer.id, title: layer.title, items });
			}
		} catch (e) {
			console.warn('Missing legend entry skipped:', e);
		}
	}

	return legend;
}

/** @param {import('@arcgis/core/layers/Layer').default | null | undefined} layer */
async function legendFromRenderer(layer) {
	if (!layer?.renderer) {
		try {
			await layer?.load?.();
		} catch {
			return [];
		}
	}

	const renderer = layer?.renderer;
	if (!renderer) return [];

	const items = [];

	if (renderer.type === 'simple' && renderer.symbol) {
		items.push({
			label: renderer.label ?? layer.title ?? '',
			type: 'symbol',
			previewHtml: await symbolToHtml(renderer.symbol)
		});
	}

	for (const info of toArray(
		renderer.type === 'unique-value'
			? renderer.uniqueValueInfos
			: renderer.type === 'class-breaks'
				? renderer.classBreakInfos
				: []
	)) {
		items.push({
			label:
				info.label ??
				(info.value != null ? String(info.value) : `${info.minValue} – ${info.maxValue}`),
			type: 'symbol',
			previewHtml: info.symbol ? await symbolToHtml(info.symbol) : null
		});
	}

	if (renderer.type === 'heatmap') {
		items.push({ label: 'Heatmap', type: 'heatmap', previewHtml: null });
	}

	return items;
}

/** @param {unknown[]} elements */
async function legendFromElements(elements) {
	const items = [];

	for (const element of elements) {
		if (!element || typeof element !== 'object') continue;

		if (element.type === 'symbol-table') {
			for (const info of toArray(element.infos)) {
				items.push({
					label: info.label ?? '',
					type: 'symbol',
					previewHtml: info.symbol ? await symbolToHtml(info.symbol) : null
				});
			}
			continue;
		}

		items.push(await rampItem(element));
	}

	return items;
}

/** @param {Record<string, unknown>} element */
async function rampItem(element) {
	const label = element.title ?? element.type ?? 'Legend item';
	const type = String(element.type ?? 'ramp');

	try {
		let preview = null;

		if (element.type === 'color-ramp') {
			preview = symbolUtils.renderColorRampPreviewHTML(element);
		} else if (element.type === 'relationship-ramp') {
			preview = await symbolUtils.renderRelationshipRampPreviewHTML(element);
		} else if (element.type === 'pie-chart-ramp') {
			preview = symbolUtils.renderPieChartPreviewHTML(element);
		}

		return { label, type, previewHtml: preview?.outerHTML ?? null };
	} catch {
		return { label, type, previewHtml: null };
	}
}

/** @param {unknown} symbol */
async function symbolToHtml(symbol) {
	try {
		const element = await symbolUtils.renderPreviewHTML(symbol, { size: 16 });
		return element?.outerHTML ?? null;
	} catch {
		return null;
	}
}

/** @param {unknown} items @param {number} [depth] @param {boolean} [ancestorVisible] */
function flattenOperationalItems(items, depth = 0, ancestorVisible = true) {
	const layers = [];

	for (const item of toArray(items)) {
		const layer = item.layer;
		const effectiveVisible = Boolean(item.visible && ancestorVisible);

		if (layer?.id && layer.loadStatus !== 'failed') {
			layers.push({
				id: layer.id,
				title: item.title || layer.title || layer.id,
				visible: effectiveVisible,
				url: layer.url ?? null,
				depth
			});
		}

		if (item.children?.length) {
			layers.push(...flattenOperationalItems(item.children, depth + 1, effectiveVisible));
		}
	}

	return layers;
}

/** @param {import('@arcgis/core/layers/Layer').default[]} layers @param {number} [depth] @param {boolean} [ancestorVisible] */
function walkMapLayers(layers, depth = 0, ancestorVisible = true) {
	const result = [];

	for (const layer of layers) {
		try {
			if (!layer?.id) continue;
			if (layer.loadStatus === 'failed') continue;

			const effectiveVisible = Boolean(layer.visible && ancestorVisible);

			result.push({
				id: layer.id,
				title: layer.title || layer.id,
				visible: effectiveVisible,
				url: layer.url ?? null,
				depth
			});

			if (layer.type === 'group' && layer.layers?.length) {
				result.push(...walkMapLayers(layer.layers.toArray(), depth + 1, effectiveVisible));
			}
		} catch (e) {
			console.warn('walkMapLayers skipped layer:', e);
		}
	}

	return result;
}

/** @param {unknown} root */
function flattenTree(root) {
	const nodes = [];

	for (const node of toArray(root)) {
		nodes.push(node);
		if (node.children?.length) {
			nodes.push(...flattenTree(node.children));
		}
	}

	return nodes;
}

/** @param {() => unknown[]} getItems @param {number} [timeoutMs] */
function waitForItems(getItems, timeoutMs = 5000) {
	try {
		if (getItems().length > 0) return Promise.resolve();
	} catch (e) {
		console.warn('waitForItems initial check failed:', e);
		return Promise.resolve();
	}

	return Promise.race([
		reactiveUtils.whenOnce(() => {
			try {
				return getItems().length > 0;
			} catch {
				return true;
			}
		}),
		new Promise((resolve) => setTimeout(resolve, timeoutMs))
	]);
}

/** @param {unknown} collection */
function toArray(collection) {
	if (!collection) return [];
	try {
		if (typeof collection.toArray === 'function') return collection.toArray();
		if (Array.isArray(collection)) return collection;
	} catch (e) {
		console.warn('toArray failed:', e);
	}
	return [];
}

/** @param {import('@arcgis/core/views/MapView').default} view @param {() => Promise<unknown>} refresh */
export function watchMapLayerChanges(view, refresh) {
	return reactiveUtils.watch(
		() => {
			try {
				return walkMapLayers(view.map.layers.toArray()).map((layer) => ({
					id: layer.id,
					visible: layer.visible
				}));
			} catch (e) {
				console.warn('watchMapLayerChanges failed:', e);
				return [];
			}
		},
		() => {
			refresh().catch((error) => console.error('Failed to refresh map panel data:', error));
		}
	);
}
