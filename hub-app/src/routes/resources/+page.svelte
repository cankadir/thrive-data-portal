<script>
    import { approvedTools, sectorColors } from '$lib/store';
</script>

<main class="hub">
	{#if $approvedTools.length > 0}
		<h1>Approved Tools</h1>
		<p>Total approved tools: {$approvedTools.length}</p>
		<div class="approved-tools">
			{#each $approvedTools as tool}
				<div class="approved-tool" style="background-color: {$sectorColors[tool.attributes.sector_tags]}">
					<h2>{tool.attributes.title}</h2>
					<p>{tool.attributes.field_9}</p>
					<p><span class="label">Author:</span>{tool.attributes.author}</p>
					<p><span class="label">Sector:</span> {tool.attributes.sector_tags}</p>
				</div>
			{/each}
		</div>
	{/if}
</main>

<style>
	.hub {
		padding: 1.5rem;
	}
	.approved-tools {
		display: flex;
		flex-direction: column;
		gap: 1rem;
	}

	.approved-tool {
		border: 1px solid #ccc;
		padding: 1rem;
		border-radius: 0.5rem;
	}

	.label {
		font-weight: bold;
	}
</style>