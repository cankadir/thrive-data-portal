<script>
	import { invalidateAll } from '$app/navigation';

	let { data } = $props();

	const columns = $derived(data.columns);

	// Refresh when the user returns from the Survey123 tab (record links open in a new tab).
	let lastRefresh = 0;
	function refresh() {
		const now = Date.now();
		if (now - lastRefresh < 2000) return; // visibility + focus both fire on return
		lastRefresh = now;
		invalidateAll();
	}

	$effect(() => {
		const onVisible = () => {
			if (document.visibilityState === 'visible') refresh();
		};
		document.addEventListener('visibilitychange', onVisible);
		window.addEventListener('focus', refresh);
		return () => {
			document.removeEventListener('visibilitychange', onVisible);
			window.removeEventListener('focus', refresh);
		};
	});

	const template = $derived(
		[
			'minmax(13.75rem, 2fr)',
			...columns.map((column) => (column.truncate ? 'minmax(0, 1.5fr)' : 'minmax(0, 1fr)')),
			'1.5rem'
		].join(' ')
	);

	function statusFor(columnName, value) {
		const config = data.statusConfig[columnName];
		if (!config) return null;
		if (value === null || value === undefined || value === '') return config.empty;
		return config.styles[value] ?? null;
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

		<div class="add-data">
			<a class="add-btn" href={data.surveyUrl} target="_blank" rel="noopener noreferrer">
				<span class="add-plus" aria-hidden="true">+</span> Add new data
			</a>
			{#if data.hasAttachments}
				<p class="add-hint">
					Please add photos after you submit the data using the
					<span class="photos-word">Photos</span> button below!
				</p>
			{/if}
		</div>
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
							{@const status = statusFor(columns[index].name, value)}
							<span class="value" class:truncate={columns[index].truncate} title={value}>
								{#if status}
									<span class="tag {status.tone}">{status.label}</span>
								{:else}
									{value}
								{/if}
							</span>
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
		margin: 0 0 1rem;
		font-weight: 600;
	}

	.add-data {
		display: flex;
		align-items: center;
		flex-wrap: wrap;
		gap: 1rem;
		margin: 0 0 2rem;
	}

	.add-btn {
		display: inline-flex;
		align-items: center;
		gap: 0.4rem;
		padding: 0.55rem 1.1rem;
		border-radius: 0.5rem;
		background: #588c02;
		color: #fff;
		font-size: 1rem;
		font-weight: 600;
		text-decoration: none;
		white-space: nowrap;
		cursor: pointer;
	}

	.add-btn:hover,
	.add-btn:focus-visible {
		background: #4a7501;
	}

	.add-plus {
		font-size: 1.35em;
		font-weight: 700;
		line-height: 1;
	}

	.add-hint {
		margin: 0;
		color: #656364;
	}

	.photos-word {
		color: #3064b2;
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
		/* Fixed so the header and record rows compute the same 1fr track width. */
		grid-template-columns: minmax(0, 1fr) 7rem;
	}

	.row {
		display: grid;
		gap: 1rem;
		align-items: start;
		padding: 0.75rem 1rem;
	}

	.head-action {
		align-self: center;
		justify-self: end;
		padding-right: 1rem;
		font-weight: 600;
		color: #656364;
	}

	.photos-link {
		align-self: center;
		justify-self: end;
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

	.value.truncate {
		display: -webkit-box;
		-webkit-box-orient: vertical;
		-webkit-line-clamp: 2;
		line-clamp: 2;
		overflow: hidden;
		overflow-wrap: anywhere;
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
