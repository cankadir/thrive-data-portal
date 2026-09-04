<script>
	import { page } from '$app/state';
	import thriveLogo from '$lib/assets/thrive-logo.png';
	import { maps, sectorDefaults } from '$lib/store';

	const sectorId = $derived(page.route.id === '/maps/[id]' ? page.params.id : null);
	const currentSector = $derived(sectorId ? sectorDefaults[sectorId] : null);
	const sectorColor = $derived(currentSector?.color ?? '#9e9e9e');
	const sectorName = $derived(currentSector?.name ?? 'Sector Profile Maps');

	const sectorLinks = $derived(Object.entries(maps).map(([id, map]) => ({ id, title: map.title })));
	const defaultSectorId = $derived(Object.keys(maps)[0]);
</script>

<nav class="nav">
	<div id="logo" class="nav-logo">
		<img src={thriveLogo} alt="Thrive" class="logo" />
	</div>

	<a href="/maps/responsible-growth" class="nav-item">Responsible Growth</a>

	<a href="/regional-activity" class="nav-item">Regional Activity Map</a>

	<div class="nav-item nav-sector-wrapper">
		<a
			href="/maps/{sectorId ?? defaultSectorId}"
			class="nav-sector-link"
			style="background-color: {sectorColor}"
		>
			<span class="sector-text">{sectorName}</span>
			<span class="sector-chevron">▾</span>
		</a>
		<div class="sector-dropdown">
			{#each sectorLinks as map (map.id)}
				<a
					href="/maps/{map.id}"
					class="dropdown-item"
					style="color: {sectorDefaults[map.id].color}"
				>
					{map.title}
				</a>
			{/each}
		</div>
	</div>

	<a href="/resources" class="nav-item">Resource Library</a>

	<a href="/glossary" class="nav-item nav-disabled" onclick={(e) => e.preventDefault()}>Glossary</a>

	<div class="nav-home">
		<a href="/" class="home-link" aria-label="Home">
			<svg viewBox="0 0 44 44" width="44" height="44" fill="none">
				<circle cx="22" cy="22" r="20" stroke="#fff" stroke-width="1.5" />
				<path
					d="M14 24V32a1 1 0 0 0 1 1h4v-6h6v6h4a1 1 0 0 0 1-1V24"
					stroke="#fff"
					stroke-width="1.5"
				/>
				<path
					d="M12 22L22 13l10 9"
					stroke="#fff"
					stroke-width="1.5"
					stroke-linecap="round"
					stroke-linejoin="round"
				/>
			</svg>
		</a>
	</div>
</nav>

<style>
	.nav {
		display: flex;
		align-items: stretch;
		height: 59px;
		background: #9e9e9e;
	}

	.nav-logo {
		flex: 0 0 508px;
		display: flex;
		align-items: center;
		padding: 0 16px;
		border-right: 1px solid #ffffff;
	}

	.logo {
		height: 2rem;
		width: auto;
	}

	.nav-item {
		flex: 1 1 0;
		display: flex;
		align-items: center;
		justify-content: center;
		text-decoration: none;
		font-family: 'Source Sans 3', sans-serif;
		font-weight: 900;
		font-size: 14px;
		color: #fff;
		border-right: 1px solid #fff;
		padding: 0 12px;
		text-align: center;
		transition: background 0.15s;
	}

	.nav-item:hover {
		background: #b0b0b0;
	}

	.nav-disabled {
		cursor: default;
		opacity: 0.6;
	}

	.nav-disabled:hover {
		background: inherit;
		filter: none;
	}

	.nav-sector-wrapper {
		position: relative;
		display: flex;
		flex-direction: column;
		align-items: stretch;
		padding: 0;
	}

	.nav-sector-link {
		display: flex;
		align-items: center;
		justify-content: center;
		flex: 1;
		text-decoration: none;
		font-weight: 900;
		font-size: 14px;
		color: #fff;
		gap: 6px;
		padding: 0 12px;
		transition: filter 0.15s;
	}

	.nav-sector-link:hover {
		filter: brightness(1.1);
	}

	.sector-text {
		text-align: center;
		white-space: nowrap;
	}

	.sector-chevron {
		font-size: 12px;
		line-height: 1;
		opacity: 0.9;
	}

	.sector-dropdown {
		position: absolute;
		top: 100%;
		left: 0;
		right: 0;
		background: #fff;
		border: 1px solid #000;
		border-top: none;
		box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
		z-index: 50;
		display: none;
	}

	.nav-sector-wrapper:hover .sector-dropdown {
		display: block;
	}

	.nav-sector-wrapper:hover {
		background: transparent;
	}

	.dropdown-item {
		display: block;
		padding: 10px 16px;
		font-family: 'Source Sans 3', sans-serif;
		font-weight: 900;
		font-size: 16px;
		text-decoration: none;
		text-align: center;
		transition: background 0.1s;
	}

	.dropdown-item:hover {
		background: #f0f0f0;
	}

	.nav-home {
		flex: 0 0 auto;
		display: flex;
		align-items: center;
		padding: 8px;
		border-left: 1px solid #fff;
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
