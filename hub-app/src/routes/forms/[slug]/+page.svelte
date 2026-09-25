<script>
	let { data } = $props();

	const columns = $derived(
		data.columns.map((name) => ({ name, label: name.replaceAll('_', ' ') }))
	);

	const template = $derived(
		['minmax(13.75rem, 2fr)', ...columns.map(() => 'minmax(0, 1fr)'), 'auto'].join(' ')
	);

	function statusFor(value) {
		if (value === null || value === undefined || value === '') return data.emptyStatus;
		return data.statusStyles[value] ?? null;
	}
</script>

<svelte:head>
	<title>{data.title} · Thrive Data Portal</title>
	<meta name="robots" content="noindex" />
</svelte:head>

<main class="form-page">
	<header>
		<h1>{data.title}</h1>
		{#if data.description}
			<p class="description">{data.description}</p>
		{/if}
		<p class="hint">
			Click on a record to edit the data in Survey123. A new browser tab will open with the
			available information filled in.
		</p>
		<p class="count">{data.rows.length} records are available in the dataset</p>
	</header>

	{#if data.rows.length === 0}
		<p>No records found.</p>
	{:else}
		<div class="table">
			<div class="row-group" class:with-action={data.hasAttachments}>
				<div class="row head" style="grid-template-columns: {template}">
					<span>Record</span>
					{#each columns as column (column.name)}
						<span>{column.label}</span>
					{/each}
					<span></span>
				</div>
				{#if data.hasAttachments}<span class="head-action">Photos</span>{/if}
			</div>

			{#each data.rows as row (row.globalId)}
				<div class="row-group" class:with-action={data.hasAttachments}>
					<a
						class="row record"
						href={row.editUrl}
						target="_blank"
						rel="noopener noreferrer"
						style="grid-template-columns: {template}"
					>
						<span class="label">
							{row.label}
							<code>{row.globalId}</code>
						</span>
						{#each row.values as value, index (columns[index].name)}
							{#if columns[index].name === data.statusField}
								{@const status = statusFor(value)}
								<span class="value">
									{#if status}
										<span class="tag {status.tone}">{status.label}</span>
									{:else}
										{value}
									{/if}
								</span>
							{:else}
								<span class="value">{value}</span>
							{/if}
						{/each}
						<span class="arrow" aria-hidden="true">&rarr;</span>
					</a>
					{#if row.photosUrl}
						<a class="photos-link" href={row.photosUrl}>Photos</a>
					{/if}
				</div>
			{/each}
		</div>
	{/if}
</main>

<style>
	.form-page {
		max-width: 75rem;
		margin: 0 auto;
		padding: 3rem 1.5rem 5rem;
	}

	h1 {
		margin: 0 0 0.5rem;
		font-size: 2rem;
	}

	.description {
		margin: 0 0 0.5rem;
		color: #656364;
	}

	.hint {
		margin: 0 0 0.5rem;
		color: #656364;
	}

	.count {
		margin: 0 0 2rem;
		font-weight: 600;
	}

	.table {
		border-top: 1px solid #d6d6ce;
	}

	.row-group {
		display: grid;
		grid-template-columns: minmax(0, 1fr);
		border-bottom: 1px solid #d6d6ce;
	}

	.row-group.with-action {
		grid-template-columns: minmax(0, 1fr) auto;
	}

	.row {
		display: grid;
		gap: 1rem;
		align-items: start;
		padding: 0.75rem 1rem;
	}

	.head-action {
		align-self: center;
		padding-right: 1rem;
		font-weight: 600;
		color: #656364;
	}

	.photos-link {
		align-self: center;
		margin-right: 1rem;
		padding: 0.4rem 0.9rem;
		border: 1px solid #3064b2;
		border-radius: 0.375rem;
		color: #3064b2;
		font-weight: 600;
		white-space: nowrap;
		text-decoration: none;
	}

	.photos-link:hover,
	.photos-link:focus-visible {
		background: #3064b2;
		color: #fff;
	}

	.head {
		font-weight: 600;
		color: #656364;
	}

	.head span {
		text-transform: capitalize;
	}

	.record {
		color: inherit;
		text-decoration: none;
		transition: background-color 120ms ease;
	}

	.record:hover,
	.record:focus-visible {
		background: #f0f0f0;
	}

	.record:hover .arrow {
		transform: translateX(4px);
	}

	.record:focus-visible {
		outline: 2px solid #3064b2;
		outline-offset: -2px;
	}

	.label {
		display: flex;
		flex-direction: column;
		gap: 0.25rem;
		font-weight: 600;
	}

	code {
		font-size: 0.7rem;
		font-weight: 400;
		color: #99968d;
		word-break: break-all;
	}

	.value {
		color: #656364;
	}

	.tag {
		display: inline-block;
		padding: 0.125rem 0.6rem;
		font-size: 0.8rem;
		font-weight: 600;
		border: 1px solid;
		border-radius: 999px;
		white-space: nowrap;
	}

	.tag.green {
		color: #588c02;
		background: #f4f6e6;
		border-color: #d0d88d;
	}

	.tag.red {
		color: #d9542b;
		background: #ffeae6;
		border-color: #ffb6a8;
	}

	.tag.blue {
		color: #008fa8;
		background: #cce9ee;
		border-color: #99d2dc;
	}

	.tag.grey {
		color: #656364;
		background: #f0f0f0;
		border-color: #dfdfdf;
	}

	.arrow {
		color: #3064b2;
		font-weight: 600;
		transition: transform 120ms ease;
	}
</style>
