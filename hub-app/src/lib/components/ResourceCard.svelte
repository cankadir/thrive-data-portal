<script>
	let { tool } = $props();

	const SECTOR_INFO = {
		natural: { label: 'Natural Treasures', color: '#588c02' },
		community: { label: 'Community Prosperity', color: '#625181' },
		growth: { label: 'Responsible Growth', color: '#3064b2' },
		transportation: { label: 'Transportation + Infrastructure', color: '#f68a46' }
	};

	function clean(value) {
		if (value === null || value === undefined) return '';
		const s = String(value).trim();
		if (!s || /^(none|n\/a|null)$/i.test(s)) return '';
		return s;
	}

	function sectorId(token) {
		const t = token.toLowerCase().replace(/[^a-z]+/g, '');
		if (t.includes('natural')) return 'natural';
		if (t.includes('community')) return 'community';
		if (t.includes('responsible') || t.includes('growth')) return 'growth';
		if (t.includes('transport')) return 'transportation';
		return null;
	}

	function isLight(hex) {
		const n = parseInt(hex.slice(1), 16);
		const r = (n >> 16) & 255;
		const g = (n >> 8) & 255;
		const b = n & 255;
		return (r * 299 + g * 587 + b * 114) / 1000 > 150;
	}

	function fmtDate(ms) {
		if (!ms) return '';
		return new Date(ms).toLocaleDateString(undefined, {
			year: 'numeric',
			month: 'short',
			day: 'numeric'
		});
	}

	const d = $derived.by(() => {
		const a = tool.attributes;

		const sectorTags = clean(a.sector_tags);
		const sectorIds = sectorTags
			? [
					...new Set(
						sectorTags
							.split(',')
							.map((t) => sectorId(t))
							.filter(Boolean)
					)
				]
			: [];
		const sectors = sectorIds.map((id) => SECTOR_INFO[id]).filter(Boolean);

		const singleSector = sectors.length === 1 ? sectors[0] : null;
		const neutral = sectors.length !== 1;
		const accent = neutral ? '#ffffff' : singleSector.color;
		const topTextColor = neutral ? '#000000' : isLight(accent) ? '#000000' : '#ffffff';

		const metaRows = [
			{ label: 'Author', value: clean(a.author) },
			{ label: 'Type', value: clean(a.tool_type) },
			{ label: 'Contact', value: clean(a.contact_perseon) },
			{ label: 'Project', value: clean(a.project) },
			{ label: 'Other - Project', value: clean(a.project_other) },
			{ label: 'Created', value: fmtDate(a.tool_creation_date) },
			{ label: 'Sunset', value: fmtDate(a.tool_sunset_date) }
		];

		return {
			sectors,
			neutral,
			accent,
			title: clean(a.title),
			summary: clean(a.summary),
			details: clean(a.field_9),
			url: clean(a.rest_api_url),
			topTextColor,
			metaRows
		};
	});
</script>

<a
	class="card {d.neutral ? 'card-neutral' : ''}"
	style="--accent: {d.accent}"
	href={d.url}
	target="_blank"
	rel="noopener noreferrer"
>
	<div class="card-top" style="color: {d.topTextColor}">
		{#if d.title}
			<h3 class="title">{d.title}</h3>
		{/if}

		{#if d.summary}
			<p class="summary">{d.summary}</p>
		{/if}
	</div>

	<div class="card-bottom">
		{#if d.neutral && d.sectors.length > 0}
			<p class="sectors">
				{#each d.sectors as sector (sector.label)}
					<span class="sector" style="--chip: {sector.color}">{sector.label}</span>
				{/each}
			</p>
		{/if}

		{#if d.details}
			<p class="details">{d.details}</p>
		{/if}

		{#each d.metaRows as row (row.label)}
			{#if row.value}
				<p class="meta"><span class="meta-label">{row.label}:</span> {row.value}</p>
			{/if}
		{/each}

		{#if d.url}
			<p class="open">Open resource &#8599;</p>
		{/if}
	</div>
</a>

<style>
	.card {
		display: flex;
		flex-direction: column;
		text-decoration: none;
		border-radius: 18px;
		overflow: hidden;
		background: #ececec;
		color: #000;
		box-shadow: 6px 6px 4px rgba(0, 0, 0, 0.25);
		transition:
			transform 0.12s ease,
			box-shadow 0.12s ease;
		height: 100%;
	}

	.card:hover {
		transform: translate(-2px, -2px);
		box-shadow: 8px 8px 6px rgba(0, 0, 0, 0.25);
	}

	.card-top {
		background: var(--accent);
		padding: 20px 20px 16px;
	}

	.card-neutral .card-top {
		background: #ffffff;
		border-bottom: 1px solid #e0e0d8;
	}

	.title {
		margin: 0 0 8px;
		font-family: 'Source Sans 3', sans-serif;
		font-size: 22px;
		line-height: 1.2;
		font-weight: 900;
		color: inherit;
	}

	.summary {
		margin: 0;
		font-size: 15px;
		line-height: 1.35;
		color: inherit;
	}

	.card-bottom {
		flex: 1;
		display: flex;
		flex-direction: column;
		gap: 6px;
		padding: 14px 20px 18px;
	}

	.sectors {
		display: flex;
		flex-wrap: wrap;
		gap: 6px;
		margin: 0 0 4px;
	}

	.sector {
		background: var(--chip);
		color: #fff;
		font-size: 12px;
		font-weight: 900;
		padding: 2px 8px;
		border-radius: 999px;
	}

	.details {
		margin: 0 0 4px;
		font-size: 14px;
		line-height: 1.4;
	}

	.meta {
		margin: 0;
		font-size: 14px;
		line-height: 1.35;
	}

	.meta-label {
		font-weight: 900;
	}

	.open {
		margin: auto 0 0;
		padding-top: 10px;
		font-size: 15px;
		font-weight: 900;
		text-decoration: underline;
	}
</style>
