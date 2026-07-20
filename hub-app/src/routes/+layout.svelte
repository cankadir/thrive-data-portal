<script>
	import { page } from '$app/state';
	import favicon from '$lib/assets/favicon.svg';
	import thriveLogo from '$lib/assets/thrive-logo.png';
	import { approvedTools, sectorDefaults } from '$lib/store';

	let { children, data } = $props();

	approvedTools.set(data.approvedTools);

	const sectorId = $derived(page.route.id === '/maps/[id]' ? page.params.id : null);
	const currentSector = $derived(sectorId ? sectorDefaults[sectorId] : null);
	const sectorColor = $derived(currentSector?.color ?? '#9e9e9e');
	const sectorName = $derived(currentSector?.name ?? 'Sector Profile Maps');
</script>

<svelte:head>
	<link rel="icon" href={favicon} />
</svelte:head>

<nav class="nav">
	<div class="nav-logo">
		<div class="logo-wrap">
			<img src={thriveLogo} alt="Thrive" class="logo" />
		</div>
	</div>
	<a href="/maps/responsible-growth" class="nav-item">Responsible Growth</a>
	<a href="/regional-activity" class="nav-item">Regional Activity Map</a>
	<div class="nav-item nav-sector" style="background-color: {sectorColor}">
		{sectorName}
	</div>
	<a href="/resources" class="nav-item">Resource Library</a>
	<a href="/glossary" class="nav-item nav-disabled" onclick={(e) => e.preventDefault()}>Glossary</a>
	<div class="home-btn">
		<a href="/" class="home-link" aria-label="Home">
			<svg viewBox="0 0 44 44" width="44" height="44" fill="none">
				<circle cx="22" cy="22" r="20" stroke="#fff" stroke-width="1.5" />
				<path d="M14 24V32a1 1 0 0 0 1 1h4v-6h6v6h4a1 1 0 0 0 1-1V24" stroke="#fff" stroke-width="1.5" />
				<path d="M12 22L22 13l10 9" stroke="#fff" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" />
			</svg>
		</a>
	</div>
</nav>

{@render children()}

<style>
	:global(html),
	:global(body) {
		margin: 0;
		padding: 0;
		font-family: 'Noto Sans', sans-serif;
	}

	:global(h1, h2, h3, h4, h5, h6) {
		font-family: 'Source Sans 3', 'Noto Sans', sans-serif;
		font-weight: 900;
	}

	.nav {
		display: flex;
		align-items: stretch;
		height: 59px;
		background: #9e9e9e;
	}

	.nav-logo {
		display: flex;
		align-items: center;
		justify-content: flex-start;
		width: 508px;
		flex-shrink: 0;
		padding: 0 16px;
		border-right: 1px solid #000;
	}

	.logo-wrap {
		display: flex;
		align-items: center;
		background: #9d9d9d;
		height: 44px;
		padding: 0 12px;
	}

	.logo {
		height: 1.1rem;
		width: auto;
	}

	.nav-item {
		flex: 1;
		display: flex;
		align-items: center;
		justify-content: center;
		text-decoration: none;
		font-family: 'Source Sans 3', 'Noto Sans', sans-serif;
		font-weight: 900;
		font-size: 16px;
		color: #fff;
		border-right: 1px solid #000;
		padding: 0 12px;
		text-align: center;
		transition: background 0.15s;
	}

	.nav-item:hover {
		background: #b0b0b0;
	}

	.nav-sector {
		border-left: 1px solid #000;
	}

	.nav-sector:hover {
		background: inherit;
		filter: brightness(1.1);
	}

	.nav-disabled {
		cursor: default;
		opacity: 0.6;
	}

	.nav-disabled:hover {
		background: inherit;
		filter: none;
	}

	.home-btn {
		display: flex;
		align-items: center;
		padding: 8px;
		border-left: 1px solid #000;
		background: #9e9e9e;
	}

	.home-link {
		display: flex;
		align-items: center;
		justify-content: center;
		width: 44px;
		height: 44px;
		text-decoration: none;
	}
</style>
