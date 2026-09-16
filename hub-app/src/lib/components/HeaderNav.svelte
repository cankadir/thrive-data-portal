<script>
	import { page } from '$app/state';
	import thriveLogo from '$lib/assets/thrive-logo.svg';
	import { maps } from '$lib/store';
	import { sectorById } from '$lib/sectors';

	const isLanding = $derived(page.route.id === '/');
	const sectorId = $derived(page.route.id === '/maps/[id]' ? page.params.id : null);

	const sectorOrder = [
		'responsible-growth',
		'transportation-infrastructure',
		'community-prosperity',
		'natural-treasures'
	];

	const sectors = sectorOrder.map((id) => ({ ...sectorById[id], title: maps[id].title }));

	const defaultSectorId = sectors[0].id;
	const activeSector = $derived(sectors.find((sector) => sector.id === sectorId) ?? null);
	const sectorColor = $derived(activeSector?.color ?? 'transparent');
	const toggleLabel = $derived(isLanding ? 'Sector Maps' : (activeSector ?? sectors[0]).title);
</script>

<nav class="nav">
	<div class="nav-logo">
		<a
			href="https://www.thriveregionalpartnership.org/"
			target="_blank"
			rel="noopener noreferrer"
			class="logo-link"
		>
			<img src={thriveLogo} alt="Thrive" class="logo" />
		</a>
	</div>

	<div class="nav-menu">
		<div class="nav-items">
			<a
				class="nav-item"
				class:active={page.route.id === '/regional-activity'}
				href="/regional-activity">Regional Activity Map</a
			>

			<div class="nav-item nav-sector">
				<a
					class="sector-toggle"
					href="/maps/{sectorId ?? defaultSectorId}"
					style="background-color: {sectorColor}"
				>
					{toggleLabel}
				</a>
				<div class="sector-dropdown">
					{#each sectors as sector (sector.id)}
						<a
							class="dropdown-item"
							href="/maps/{sector.id}"
							style="background-color: {sector.color}"
						>
							{sector.title}
						</a>
					{/each}
				</div>
			</div>

			<a class="nav-item" class:active={page.route.id === '/resources'} href="/resources"
				>Resource Library</a
			>

			<a class="nav-item" href="/data-access" onclick={(e) => e.preventDefault()}>Data Access</a>
		</div>

		{#if !isLanding}
			<div class="nav-home">
				<a href="/" class="home-link" aria-label="Home">
					<svg viewBox="0 0 39 39" width="38" height="38" fill="none" aria-hidden="true">
						<path
							d="M19.5 1.29167C29.5383 1.29167 37.7083 9.46167 37.7083 19.5C37.7083 29.5383 29.5383 37.7083 19.5 37.7083C9.46167 37.7083 1.29167 29.5383 1.29167 19.5C1.29167 9.46167 9.46167 1.29167 19.5 1.29167ZM19.5 0.5C9.01042 0.5 0.5 9.01042 0.5 19.5C0.5 29.9896 9.01042 38.5 19.5 38.5C29.9896 38.5 38.5 29.9896 38.5 19.5C38.5 9.01042 29.9896 0.5 19.5 0.5ZM28.07 29.5467H23.3675C22.845 29.5467 22.4175 29.1192 22.4096 28.6046L22.3225 22.2317H17.4142V28.5888C17.4142 29.1192 16.9867 29.5467 16.4563 29.5467H11.3579C10.8275 29.5467 10.4 29.1192 10.4 28.5888V17.7429H9.39459C8.99875 17.7429 8.63458 17.4896 8.5 17.1254C8.3575 16.7533 8.46833 16.3258 8.76916 16.0646L19.1083 7C19.4646 6.69125 20.0029 6.68333 20.3671 7L30.9042 16.0646C31.205 16.3258 31.3158 16.7533 31.1812 17.1254C31.0467 17.4975 30.6825 17.7508 30.2787 17.7508H29.0279V28.5967C29.0279 29.1271 28.6004 29.5546 28.07 29.5546V29.5467ZM17.0183 21.44H22.7104C22.9242 21.44 23.1062 21.6142 23.1062 21.8279L23.2013 28.5888C23.2013 28.6758 23.2804 28.755 23.3675 28.755H28.07C28.165 28.755 28.2363 28.6838 28.2363 28.5888V17.3471C28.2363 17.1254 28.4104 16.9513 28.6321 16.9513H30.2787C30.35 16.9513 30.4133 16.9038 30.4371 16.8404C30.4608 16.7771 30.4371 16.6979 30.3896 16.6583L19.8525 7.59375C19.7892 7.53833 19.6942 7.53833 19.6308 7.59375L9.29167 16.6583C9.23625 16.7058 9.22042 16.7771 9.24417 16.8404C9.26792 16.9038 9.33125 16.9513 9.4025 16.9513H10.8038C11.0254 16.9513 11.1996 17.1254 11.1996 17.3471V28.5888C11.1996 28.6838 11.2708 28.755 11.3658 28.755H16.4642C16.5592 28.755 16.6304 28.6838 16.6304 28.5888V21.8358C16.6304 21.6142 16.8046 21.44 17.0263 21.44H17.0183Z"
							fill="#000"
						/>
					</svg>
				</a>
			</div>
		{/if}
	</div>
</nav>

<style>
	.nav {
		display: flex;
		align-items: stretch;
		height: 60px;
		background: #ecece8;
		border: 1px solid #000;
	}

	.nav-logo {
		flex: 0 1 clamp(250px, 32%, 50%);
		min-width: 250px;
		display: flex;
		align-items: center;
		padding: 0 16px;
		border-right: 1px solid #000;
	}

	.logo-link {
		display: flex;
		align-items: center;
	}

	.logo {
		height: 40px;
		width: auto;
	}

	.nav-menu {
		flex: 1 1 0;
		display: flex;
		align-items: stretch;
		justify-content: space-between;
		min-width: 0;
	}

	.nav-items {
		flex: 1 1 0;
		display: flex;
		align-items: stretch;
		height: 100%;
		min-width: 0;
		padding: 0 8px;
	}

	.nav-item {
		flex: 0 1 255.75px;
		display: flex;
		align-items: center;
		justify-content: center;
		text-decoration: none;
		font-family: 'Source Sans 3', sans-serif;
		font-weight: 600;
		font-size: 18px;
		line-height: 23px;
		color: #000;
		text-align: center;
		min-width: 0;
		transition: background 0.15s;
	}

	.nav-item:hover {
		background: #dedcd4;
	}

	.nav-item.active {
		background: #33a5b9;
	}

	.nav-sector {
		position: relative;
		flex-direction: column;
		align-items: stretch;
		padding: 0;
	}

	.sector-toggle {
		display: flex;
		align-items: center;
		justify-content: center;
		flex: 1;
		padding: 1px 8px;
		text-decoration: none;
		font-weight: 600;
		font-size: 18px;
		line-height: 23px;
		color: #000;
		text-align: center;
		white-space: normal;
		overflow-wrap: break-word;
		transition: filter 0.15s;
	}

	.nav-sector:hover .sector-toggle {
		filter: brightness(0.96);
	}

	.sector-dropdown {
		position: absolute;
		top: 100%;
		left: 0;
		right: 0;
		z-index: 50;
		display: none;
		flex-direction: column;
	}

	.nav-sector:hover .sector-dropdown {
		display: flex;
	}

	.dropdown-item {
		display: flex;
		align-items: center;
		justify-content: center;
		min-height: 60px;
		border: 1px solid #000;
		border-top: none;
		text-decoration: none;
		font-family: 'Source Sans 3', sans-serif;
		font-weight: 900;
		font-size: 18px;
		line-height: 20px;
		color: #000;
		text-align: center;
		white-space: normal;
		overflow-wrap: break-word;
		padding: 6px 8px;
		transition: filter 0.15s;
	}

	.dropdown-item:hover {
		filter: brightness(1.08);
	}

	.nav-home {
		flex: 0 0 auto;
		display: flex;
		align-items: center;
		justify-content: flex-end;
		padding: 0 16px;
	}

	.home-link {
		display: flex;
		align-items: center;
		justify-content: center;
	}

	@media (max-width: 900px) {
		.nav-item,
		.sector-toggle,
		.dropdown-item {
			font-size: 14px;
			line-height: 18px;
		}
	}
</style>
