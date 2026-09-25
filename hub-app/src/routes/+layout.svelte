<script>
	import favicon from '$lib/assets/favicon.svg';
	import HeaderNav from '$lib/components/HeaderNav.svelte';

	let { children } = $props();
</script>

<svelte:head>
	<link rel="icon" href={favicon} />
</svelte:head>

<HeaderNav />

{@render children()}

<style>
	:global(*),
	:global(*)::before,
	:global(*)::after {
		box-sizing: border-box;
	}

	:global(:root) {
		/* Side panel width — shared by the map sidebars and the nav logo column. */
		--panel-width: 31.75rem;

		/* Interaction animation timing (edit freely). */
		--anim-duration: 150ms;
		--anim-ease: ease;
	}

	:global(html) {
		/* Root size drives all rem type + spacing. Step it down on smaller
		   viewports so the 1600px design scales proportionally instead of
		   looking oversized. Tune these two values to change the ramp. */
		font-size: 16px;
	}

	@media (max-width: 1200px) {
		:global(html) {
			font-size: 12px;
		}
	}

	@media (max-width: 900px) {
		:global(html) {
			font-size: 11px;
		}
	}

	:global(html),
	:global(body) {
		margin: 0;
		padding: 0;
		font-family: 'Montserrat', sans-serif;
		-webkit-tap-highlight-color: transparent;
	}

	/* Kill the browser's default blue focus ring. Mouse/touch get nothing;
	   keyboard users still get a neutral ring via :focus-visible. */
	:global(:focus) {
		outline: none;
	}

	:global(:focus-visible) {
		outline: 2px solid #000;
		outline-offset: 2px;
	}

	:global(h1, h2, h3, h4, h5, h6) {
		font-family: 'Montserrat', sans-serif;
		font-weight: 900;
	}
</style>
