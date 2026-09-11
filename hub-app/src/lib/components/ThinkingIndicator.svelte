<script>
	let { label = 'Thinking' } = $props();
</script>

<p class="thinking" role="status" aria-live="polite">
	{label}<span class="dot">.</span><span class="dot">.</span><span class="dot">.</span>
</p>

<style>
	.thinking {
		margin: 0;
		padding: 0.75rem 1.25rem;
		background: #ececec;
		border-radius: 12px;
		font-size: 1rem;
		font-weight: 700;
		color: #656364;
		text-align: center;
	}

	.dot {
		display: inline-block;
		animation: blink 1.4s infinite;
	}

	.dot:nth-child(2) {
		animation-delay: 0.2s;
	}

	.dot:nth-child(3) {
		animation-delay: 0.4s;
	}

	@keyframes blink {
		0%,
		20% {
			opacity: 1;
		}
		100% {
			opacity: 0;
		}
	}
</style>
