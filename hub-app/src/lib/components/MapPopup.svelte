<script>
	import { onMount } from 'svelte';
	import Feature from '@arcgis/core/widgets/Feature.js';
	import * as reactiveUtils from '@arcgis/core/core/reactiveUtils.js';
	import { mapView, mapPopup } from '$lib/mapStore';

	let { color = '#a9b54d' } = $props();

	let title = $state('');
	let shown = $state(false);
	let pos = $state({ x: 0, y: 0, below: false });
	let shellEl = null;
	let contentEl = null;

	function close() {
		mapPopup.set(null);
	}

	onMount(() => {
		/** @type {import('@arcgis/core/views/MapView').default | null} */
		let view = null;
		/** @type {import('@arcgis/core/widgets/Feature').default | null} */
		let widget = null;
		let current = null;
		/** @type {{ x: number, y: number } | null} */
		let lastDrag = null;
		/** @type {{ remove: () => void }[]} */
		let handles = [];

		/**
		 * During a pan the map is moved by a CSS transform, so `view.toScreen`
		 * is stale — shift the popup by the same pointer delta so it tracks the
		 * map, then snap to the true screen position when the drag ends.
		 * @param {any} event
		 */
		function onDrag(event) {
			if (event.action === 'start') {
				lastDrag = { x: event.x, y: event.y };
				return;
			}
			if (event.action === 'update' && lastDrag) {
				pos = {
					...pos,
					x: pos.x + (event.x - lastDrag.x),
					y: pos.y + (event.y - lastDrag.y)
				};
				lastDrag = { x: event.x, y: event.y };
				return;
			}
			if (event.action === 'end') {
				lastDrag = null;
				requestAnimationFrame(reposition);
			}
		}

		function reposition() {
			if (!view || !current?.location || !shellEl) return;
			const point = view.toScreen(current.location);
			if (!point) {
				shown = false;
				return;
			}
			const half = shellEl.offsetWidth / 2;
			const height = shellEl.offsetHeight;
			const below = point.y - height - 18 < 0;
			const x = Math.min(Math.max(point.x, half + 8), view.width - half - 8);
			pos = { x, y: point.y, below };
		}

		function apply() {
			if (!view || !contentEl) return;

			// Create the Feature widget once per view and re-use it. Destroying
			// and recreating it on each popup left the next popup's content blank
			// (only the title came through).
			if (!widget) {
				// Esri's Feature widget renders the graphic's popupTemplate —
				// Arcade expressions and field formats included. We hide its own
				// title and draw ours (styled) above the content instead.
				widget = new Feature({
					view,
					container: contentEl,
					visibleElements: { title: false }
				});
				handles.push(
					reactiveUtils.watch(
						() => widget?.title,
						(value) => {
							title = value ?? '';
							requestAnimationFrame(reposition);
						}
					)
				);
			}

			if (!current?.feature) {
				widget.graphic = null;
				widget.visible = false;
				shown = false;
				title = '';
				return;
			}

			widget.graphic = current.feature;
			widget.visible = true;
			shown = true;
			requestAnimationFrame(reposition);
		}

		const unsubView = mapView.subscribe((v) => {
			if (v === view) return;
			view = v;
			handles.forEach((handle) => handle.remove());
			handles = [];
			widget?.destroy();
			widget = null;

			if (view) {
				handles.push(
					reactiveUtils.watch(
						// Watch `center` too so the popup tracks a programmatic pan
						// (e.g. the click-to-centre animation).
						() => [
							view.stationary,
							view.zoom,
							view.size,
							view.rotation,
							view.center?.x,
							view.center?.y
						],
						reposition
					)
				);
				handles.push(view.on('drag', onDrag));
			}
			apply();
		});

		const unsubPopup = mapPopup.subscribe((value) => {
			current = value;
			apply();
		});

		return () => {
			unsubView();
			unsubPopup();
			handles.forEach((handle) => handle.remove());
			widget?.destroy();
		};
	});
</script>

<div
	class="popup"
	class:visible={shown}
	class:below={pos.below}
	style:--popup-color={color}
	style:left="{pos.x}px"
	style:top="{pos.y}px"
	role="dialog"
	aria-label="Feature information"
	{@attach (element) => {
		shellEl = element;
	}}
>
	<button class="close" onclick={close} aria-label="Close popup">×</button>
	{#if title}
		<p class="popup-title">{title}</p>
	{/if}
	<div
		class="popup-content"
		{@attach (element) => {
			contentEl = element;
		}}
	></div>
</div>

<style>
	.popup {
		position: absolute;
		z-index: 10;
		display: flex;
		flex-direction: column;
		transform: translate(-50%, -100%);
		width: max-content;
		min-width: var(--popup-min-width, 12rem);
		max-width: var(--popup-max-width, 22rem);
		max-height: var(--popup-max-height, 250px);
		padding: 0.875rem 1rem 1rem;
		background: #fff;
		border: 2px solid var(--popup-color);
		border-radius: 0.75rem;
		box-shadow: 0 2px 10px rgba(0, 0, 0, 0.25);
		color: #000;
		visibility: hidden;
		opacity: 0;
		pointer-events: none;
	}

	.popup.visible {
		visibility: visible;
		opacity: 1;
		pointer-events: auto;
	}

	.popup.below {
		transform: translate(-50%, 0);
	}

	/* Tail: a rotated square with only the two outward edges stroked, so the
	   outline stays continuous with the box. Its top half tucks under the box
	   (white fill hides the box's bottom border there). */
	.popup::after {
		content: '';
		position: absolute;
		left: 50%;
		bottom: -0.5rem;
		width: 1rem;
		height: 1rem;
		background: #fff;
		border-right: 2px solid var(--popup-color);
		border-bottom: 2px solid var(--popup-color);
		transform: translateX(-50%) rotate(45deg);
	}

	.popup.below::after {
		top: -0.5rem;
		bottom: auto;
		border-right: none;
		border-bottom: none;
		border-top: 2px solid var(--popup-color);
		border-left: 2px solid var(--popup-color);
	}

	.popup-title {
		margin: 0 0 0.5rem;
		padding-right: 1.25rem;
		font-size: 1rem;
		font-weight: 600;
		line-height: 1.3;
	}

	.close {
		position: absolute;
		top: 0.4rem;
		right: 0.4rem;
		width: 1.5rem;
		height: 1.5rem;
		padding: 0;
		border: none;
		background: none;
		color: #000;
		font-size: 1.25rem;
		line-height: 1;
		cursor: pointer;
	}

	/* The Esri Feature widget makes this element its `.esri-widget` root, so the
	   resets have to land on `.popup-content` itself, not just descendants. */
	.popup-content {
		flex: 1;
		min-height: 0;
		overflow-y: auto;
		background-color: transparent !important;
		--esri-widget-padding-x: 0;
		--esri-widget-padding-y: 0;
		padding: 0 0.5rem 0 0.25rem !important;
		font-family: 'Montserrat', sans-serif;
		font-size: 1rem;
		line-height: 1.35;
	}

	.popup-content :global(.esri-widget) {
		background-color: transparent !important;
		box-shadow: none !important;
		font-family: 'Montserrat', sans-serif;
		--esri-widget-padding-x: 0;
		--esri-widget-padding-y: 0;
		padding: 0 !important;
	}

	.popup-content :global(.esri-feature__content-element) {
		padding: 0;
	}

	.popup-content :global(.esri-attachments__item-button) {
		padding: 0 !important;
		border: none !important;
	}
</style>
