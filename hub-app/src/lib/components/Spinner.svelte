<script>
	let { size = 44, color = '#008fa8', label = 'Loading…', overlay = false } = $props();
</script>

<div
	class="wrap"
	class:overlay
	role="status"
	aria-live="polite"
	aria-label={label}
	style:--size="{size}px"
	style:--color={color}
>
	<div class="spinner"></div>
</div>

<style>
	.wrap {
		display: flex;
		align-items: center;
		justify-content: center;
		pointer-events: none;
	}

	.overlay {
		position: absolute;
		inset: 0;
		z-index: 5;
		background: rgba(224, 224, 217, 0.65);
	}

	.spinner {
		width: var(--size);
		height: var(--size);
		border-radius: 50%;
		border: calc(var(--size) / 11) solid color-mix(in srgb, var(--color) 18%, transparent);
		border-top-color: var(--color);
		animation: spin 0.8s linear infinite;
	}

	@keyframes spin {
		to {
			transform: rotate(360deg);
		}
	}

	@media (prefers-reduced-motion: reduce) {
		.spinner {
			animation: pulse 1.4s ease-in-out infinite;
		}

		@keyframes pulse {
			0%,
			100% {
				opacity: 1;
			}
			50% {
				opacity: 0.4;
			}
		}
	}
</style>
