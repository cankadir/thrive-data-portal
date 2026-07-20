<script>
	let { title, open = false, children } = $props();

	let isOpen = $state(open);
</script>

<div class="accordion">
	<button class="accordion-header" onclick={() => (isOpen = !isOpen)}>
		<span class="chevron">{isOpen ? '▼' : '▶'}</span>
		<span>{title}</span>
	</button>

	{#if isOpen}
		<div class="accordion-body">
			{@render children()}
		</div>
	{/if}
</div>

<style>
	.accordion {
		border-top: 1px solid #ddd;
	}

	.accordion-header {
		display: flex;
		align-items: center;
		gap: 0.5rem;
		width: 100%;
		padding: 0.75rem 1rem;
		border: none;
		background: none;
		font: inherit;
		font-size: 1rem;
		font-weight: 700;
		text-align: left;
		cursor: pointer;
		color: #222;
	}

	.chevron {
		font-size: 0.7rem;
		flex-shrink: 0;
	}

	.accordion-body {
		padding: 0 0 0.5rem;
	}
</style>
