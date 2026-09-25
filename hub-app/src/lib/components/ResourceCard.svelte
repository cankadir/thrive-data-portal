<script>
	import goToIcon from '$lib/assets/icons/go-to.svg';
	import hoverArrowIcon from '$lib/assets/icons/arrow-down-right.svg';
	import datasetIcon from '$lib/assets/icons/sector/dataset.svg';
	import { sectorById } from '$lib/sectors';

	let { tool } = $props();

	const NEUTRAL = { color: '#c0c0b9', hover: '#a5a5a5', button: '#d6d6ce', icon: datasetIcon };

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
			hover: style.hover,
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
	style="--card: {d.color}; --card-hover: {d.hover}; --card-button: {d.button}"
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
		<span class="go-btn" aria-hidden="true">
			<img class="go-arrow go-arrow-rest" src={goToIcon} alt="" />
			<img class="go-arrow go-arrow-hover" src={hoverArrowIcon} alt="" />
		</span>
	{/if}
</a>

<style>
	.card {
		position: relative;
		display: flex;
		flex-direction: column;
		min-height: 18.75rem;
		padding: 1.25rem 1.25rem 3.625rem;
		background-color: var(--card);
		border-radius: 1.25rem;
		box-shadow: 8px 8px 4px rgba(0, 0, 0, 0.25);
		color: #000;
		text-decoration: none;
		transition:
			background-color var(--anim-duration) var(--anim-ease),
			transform var(--anim-duration) var(--anim-ease),
			box-shadow var(--anim-duration) var(--anim-ease);
	}

	.card:hover {
		background-color: var(--card-hover);
		transform: translate(-2px, -2px);
		box-shadow: 10px 10px 6px rgba(0, 0, 0, 0.25);
	}

	.card-head {
		display: flex;
		align-items: center;
		gap: 0.75rem;
		margin-bottom: 0.5rem;
	}

	.card-icon {
		width: 1.875rem;
		height: 1.875rem;
		flex-shrink: 0;
		object-fit: contain;
	}

	.card-type {
		font-size: 1.125rem;
		font-weight: 600;
		line-height: 1;
		letter-spacing: 1.26px;
		text-transform: uppercase;
	}

	.card-title {
		margin: 0 0 0.5rem;
		font-size: 1.5rem;
		font-weight: 900;
		line-height: 26px;
	}

	.card-desc {
		margin: 0 0 0.5rem;
		font-size: 1rem;
		line-height: 22px;
	}

	.card-meta {
		margin: 0;
		font-size: 1rem;
		line-height: 22px;
	}

	.meta-label {
		font-weight: 600;
	}

	.go-btn {
		position: absolute;
		right: 0.875rem;
		bottom: 1rem;
		display: flex;
		align-items: center;
		justify-content: center;
		width: 3.125rem;
		height: 1.9375rem;
		background: var(--card-button);
		border: 1px solid #000;
		border-radius: 0.625rem;
	}

	.go-arrow {
		position: absolute;
		top: 50%;
		left: 50%;
		transition:
			opacity var(--anim-duration) var(--anim-ease),
			transform var(--anim-duration) var(--anim-ease);
	}

	.go-arrow-rest {
		width: 2.171875rem;
		height: 1.25rem;
		transform: translate(-50%, -50%);
	}

	.go-arrow-hover {
		width: 1.25rem;
		height: 1.25rem;
		opacity: 0;
		transform: translate(-50%, -50%) rotate(0deg);
	}

	.card:hover .go-arrow-rest {
		opacity: 0;
	}

	.card:hover .go-arrow-hover {
		opacity: 1;
		transform: translate(-50%, -50%) rotate(-90deg);
	}

	@media (prefers-reduced-motion: reduce) {
		.card,
		.go-arrow {
			transition: none;
		}
	}
</style>
