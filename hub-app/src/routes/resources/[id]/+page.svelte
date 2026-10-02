<script>
	import { page } from '$app/state';

	const tool = $derived(
		page.data.approvedTools.find((t) => t.attributes.globalid === page.params.id)
	);
	const title = $derived(tool?.attributes?.title?.trim() ?? 'Resource');
	const url = $derived(tool?.attributes?.rest_api_url?.trim() ?? '');

	/**
	 * Some hosts refuse framing. Google Drive/Docs serve an X-Frame-Options
	 * `SAMEORIGIN` on the normal view but an embeddable `/preview` form.
	 * @param {string} value
	 */
	function embedUrl(value) {
		const drive = value.match(/drive\.google\.com\/file\/d\/([^/?#]+)/);
		if (drive) return `https://drive.google.com/file/d/${drive[1]}/preview`;

		const docs = value.match(
			/docs\.google\.com\/(document|spreadsheets|presentation)\/d\/([^/?#]+)/
		);
		if (docs) return `https://docs.google.com/${docs[1]}/d/${docs[2]}/preview`;

		return value;
	}

	const embedSrc = $derived(embedUrl(url));
</script>

<svelte:head>
	<title>{title}</title>
</svelte:head>

<div class="viewer">
	{#if url}
		<div class="bar">
			<span class="bar-title">{title}</span>
			<a class="open" href={url} target="_blank" rel="noopener noreferrer">Open in new tab ↗</a>
		</div>
		<iframe src={embedSrc} {title} allowfullscreen></iframe>
	{:else}
		<p class="missing">This resource has no link to display.</p>
	{/if}
</div>

<style>
	/* Nav is 3.75rem tall, so the viewer fills everything below it. */
	.viewer {
		height: calc(100vh - 3.75rem);
		display: flex;
		flex-direction: column;
	}

	/* Fallback for resources that refuse to be framed (X-Frame-Options/CSP). */
	.bar {
		display: flex;
		align-items: center;
		justify-content: space-between;
		gap: 1rem;
		padding: 0.5rem 1rem;
		background: #e0e0d9;
		border-bottom: 1px solid #000;
	}

	.bar-title {
		overflow: hidden;
		font-weight: 600;
		text-overflow: ellipsis;
		white-space: nowrap;
	}

	.open {
		flex-shrink: 0;
		color: #000;
		font-weight: 600;
	}

	.viewer iframe {
		flex: 1;
		width: 100%;
		min-height: 0;
		border: 0;
	}

	.missing {
		margin: 0;
		padding: 2rem;
	}
</style>
