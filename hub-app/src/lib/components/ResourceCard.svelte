<script>
	import goToIcon from '$lib/assets/icons/go-to.svg';
	import datasetIcon from '$lib/assets/icons/sector/dataset.svg';
	import { sectorById } from '$lib/sectors';

	let { tool } = $props();

	const NEUTRAL = { color: '#c0c0b9', button: '#d6d6ce', icon: datasetIcon };

	function clean(value) {
		if (value === null || value === undefined) return '';
		const s = String(value).trim();
		if (!s || /^(none|n\/a|null)$/i.test(s)) return '';
		return s;
	}

	function sectorId(token) {
		const t = token.toLowerCase().replace(/[^a-z]+/g, '');
		if (t.includes('natural')) return 'natural-treasures';
		if (t.includes('community')) return 'community-prosperity';
		if (t.includes('responsible') || t.includes('growth')) return 'responsible-growth';
		if (t.includes('transport')) return 'transportation-infrastructure';
		return null;
	}

	function fmtDate(ms) {
		if (!ms) return '';
		return new Date(ms).toLocaleDateString(undefined, {
			year: 'numeric',
			month: 'long'
		});
	}

	const d = $derived.by(() => {
		const a = tool.attributes;

		const tags = clean(a.sector_tags);
		const sectorIds = tags
			? [
					...new Set(
						tags
							.split(',')
							.map((t) => sectorId(t))
							.filter(Boolean)
					)
				]
			: [];
		const sectors = sectorIds.map((id) => sectorById[id]).filter(Boolean);

		const style = sectors[0] ?? NEUTRAL;
		const meta = [
			{ label: 'Date', value: fmtDate(a.tool_creation_date) },
			{ label: 'Last updated', value: fmtDate(a.EditDate) },
			{ label: 'Sector', value: sectors.map((s) => s.label).join(' + ') },
			{ label: 'Author', value: clean(a.author) }
		].filter((row) => row.value);

		return {
			color: style.color,
			button: style.button,
			icon: style.icon,
			typeLabel: clean(a.tool_type) || 'Resource',
			title: clean(a.title),
			description: clean(a.summary) || clean(a.field_9),
			meta,
			url: clean(a.rest_api_url)
		};
	});
</script>

<a
	class="card"
	style="--card: {d.color}; --card-button: {d.button}"
	href={d.url || undefined}
	target={d.url ? '_blank' : undefined}
	rel={d.url ? 'noopener noreferrer' : undefined}
>
	<div class="card-head">
		<img class="card-icon" src={d.icon} alt="" />
		<span class="card-type">{d.typeLabel}</span>
	</div>

	{#if d.title}
		<h3 class="card-title">{d.title}</h3>
	{/if}

	{#if d.description}
		<p class="card-desc">{d.description}</p>
	{/if}

	{#each d.meta as row (row.label)}
		<p class="card-meta"><span class="meta-label">{row.label}:</span> {row.value}</p>
	{/each}

	{#if d.url}
		<span class="go-btn" aria-hidden="true"><img src={goToIcon} alt="" /></span>
	{/if}
</a>

<style>
	.card {
		position: relative;
		display: flex;
		flex-direction: column;
		min-height: 300px;
		padding: 20px 20px 58px;
		background: var(--card);
		border-radius: 20px;
		box-shadow: 8px 8px 4px rgba(0, 0, 0, 0.25);
		color: #000;
		text-decoration: none;
		transition:
			transform 0.12s ease,
			box-shadow 0.12s ease;
	}

	.card:hover {
		transform: translate(-2px, -2px);
		box-shadow: 10px 10px 6px rgba(0, 0, 0, 0.25);
	}

	.card-head {
		display: flex;
		align-items: center;
		gap: 12px;
		margin-bottom: 8px;
	}

	.card-icon {
		width: 30px;
		height: 30px;
		flex-shrink: 0;
		object-fit: contain;
	}

	.card-type {
		font-size: 18px;
		font-weight: 600;
		line-height: 1;
		letter-spacing: 1.26px;
		text-transform: uppercase;
	}

	.card-title {
		margin: 0 0 8px;
		font-size: 24px;
		font-weight: 900;
		line-height: 26px;
	}

	.card-desc {
		margin: 0 0 8px;
		font-size: 16px;
		line-height: 22px;
	}

	.card-meta {
		margin: 0;
		font-size: 16px;
		line-height: 22px;
	}

	.meta-label {
		font-weight: 600;
	}

	.go-btn {
		position: absolute;
		right: 14px;
		bottom: 16px;
		display: flex;
		align-items: center;
		justify-content: center;
		width: 50px;
		height: 31px;
		background: var(--card-button);
		border: 1px solid #000;
		border-radius: 10px;
	}

	.go-btn img {
		width: 34.75px;
		height: 20px;
	}

	.card:hover .go-btn {
		filter: brightness(0.95);
	}
</style>
