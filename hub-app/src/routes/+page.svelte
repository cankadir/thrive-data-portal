<script>
	import { maps } from '$lib/store';
	import thriveLogo from '$lib/assets/thrive-logo.png';
	import mapPinIcon from '$lib/assets/icons/icon/map-pin.png';
	import targetIcon from '$lib/assets/icons/icon/target.png';
	import chartIcon from '$lib/assets/icons/icon/line-chart.png';
	import cursorIcon from '$lib/assets/icons/icon/navigation-cursor.png';

	const sectors = [
		{ id: 'responsible-growth', color: '#f68a46', icon: chartIcon },
		{ id: 'natural-treasures', color: '#a9b54d', icon: mapPinIcon },
		{ id: 'transportation-infrastructure', color: '#33a5b9', icon: cursorIcon },
		{ id: 'community-prosperity', color: '#81749a', icon: targetIcon }
	];
</script>

<main class="landing">
	<section class="hero">
		<div class="wrap">
			<h1>Thrive Resource Hub</h1>
		</div>
	</section>

	<section class="steps">
		<div class="wrap">
			<div class="steps-grid">
				<div class="step">
					<p class="step-head">① See the work that's happening across the region</p>
					<a class="card card-yellow" href="/regional-activity">
						<h2>Regional Activity Map</h2>
						<ul>
							<li>What, where + how work is getting done</li>
							<li>
								Participate, add your projects to the map: <span class="link">www.link.com</span>
							</li>
						</ul>
					</a>
				</div>

				<div class="step">
					<p class="step-head">② Understand the state of the region across 4 sectors</p>
					<div class="sector-card">
						{#each sectors as sector (sector.id)}
							<a
								class="sector-row"
								href="/maps/{sector.id}"
								style="background-color: {sector.color}"
							>
								<img src={sector.icon} alt="" />
								<span>{maps[sector.id].title}</span>
							</a>
						{/each}
					</div>
				</div>

				<div class="step">
					<p class="step-head">③ Go deep into data and more analysis</p>
					<a class="card card-yellow" href="/resources">
						<h2>Resource library</h2>
						<p>
							Find interactive maps and apps, tools, storymaps and more that provide deep dives into
							the topics data and analysis
						</p>
					</a>
				</div>
			</div>

			<p class="steps-foot">Start here or jump in wherever you want</p>
		</div>
	</section>

	<section class="about">
		<div class="wrap about-grid">
			<div class="about-text">
				<h2>About the Resource Hub</h2>

				<p class="about-lead">Find everything you need in one place</p>
				<ul>
					<li>Curated data that is harmonized across the 3 states and 16 counties in our region</li>
					<li>updated annually</li>
					<li>transparent, see our methods and sources</li>
				</ul>

				<hr />

				<p class="about-lead">Other information</p>
				<p>
					Nam pulvinar blandit velit, id condimentum diam faucibus at. Aliquam lacus nisi,
					sollicitudin at nisi nec, fermentum congue felis. Quisque mauris dolor, fringilla sed
					tincidunt ac, finibus non odio.
				</p>
			</div>

			<div class="about-placeholder"></div>
		</div>
	</section>

	<section class="tagline">
		<div class="wrap">
			<h2>Tag line for resource hub</h2>
			<p>
				Find the data you need. A curated selection of datasets is available to download in multiple
				formats for use in projects. Download at this page with an easy to use interface that allows
				you to search and customize your downloads.
			</p>
		</div>
	</section>

	<footer class="footer">
		<hr />
		<img src={thriveLogo} alt="Thrive Regional Partnership" />
	</footer>
</main>

<style>
	.landing {
		background: #e0e0d9;
		min-height: 100vh;
		color: #000;
	}

	.wrap {
		max-width: 1144px;
		margin: 0 auto;
		padding: 0 32px;
	}

	/* Hero */
	.hero {
		padding: 120px 0 64px;
	}

	.hero h1 {
		margin: 0;
		font-size: clamp(48px, 6vw, 76px);
		font-weight: 900;
		line-height: 1.05;
		color: #008fa8;
	}

	/* 1-2-3 cards */
	.steps {
		padding-bottom: 32px;
	}

	.steps-grid {
		display: grid;
		grid-template-columns: repeat(3, 1fr);
		gap: 32px;
	}

	.step {
		display: flex;
		flex-direction: column;
	}

	.step-head {
		margin: 0 0 12px;
		font-size: 22px;
		font-weight: 900;
		line-height: 26px;
		color: #444;
	}

	.card {
		display: block;
		border: 1px solid #000;
		border-radius: 16px;
		padding: 14px 16px;
		text-decoration: none;
		color: #000;
		transition:
			box-shadow 0.15s ease,
			transform 0.15s ease;
	}

	.card:hover,
	.card:focus-visible {
		box-shadow: 0 8px 16px rgba(0, 0, 0, 0.35);
		transform: translateY(-2px);
	}

	.card-yellow {
		background: #ffc425;
	}

	.card h2 {
		margin: 0 0 12px;
		font-size: 22px;
		font-weight: 900;
		line-height: 32px;
	}

	.card p,
	.card ul {
		margin: 0;
		font-size: 20px;
		font-weight: 400;
		line-height: 26px;
	}

	.card ul {
		padding-left: 1.2em;
	}

	.card li {
		margin-bottom: 4px;
	}

	.link {
		text-decoration: underline;
	}

	/* Sector card */
	.sector-card {
		display: flex;
		flex-direction: column;
	}

	.sector-row {
		position: relative;
		display: flex;
		align-items: center;
		gap: 8px;
		padding: 8px 16px;
		border: 1px solid #000;
		text-decoration: none;
		color: #000;
		font-size: 22px;
		font-weight: 900;
		line-height: 24px;
		transition:
			box-shadow 0.15s ease,
			filter 0.15s ease;
	}

	.sector-row:hover,
	.sector-row:focus-visible {
		box-shadow: 0 8px 16px rgba(0, 0, 0, 0.35);
		filter: brightness(1.05);
		z-index: 1;
	}

	.sector-row + .sector-row {
		border-top: none;
	}

	.sector-row:first-child {
		border-radius: 16px 16px 0 0;
	}

	.sector-row:last-child {
		border-radius: 0 0 16px 16px;
	}

	.sector-row img {
		width: 30px;
		height: 30px;
		flex-shrink: 0;
		object-fit: contain;
	}

	.steps-foot {
		margin: 24px 0 0;
		font-size: 22px;
		font-weight: 900;
		line-height: 26px;
		color: #444;
	}

	/* About */
	.about {
		padding: 64px 0;
	}

	.about-grid {
		display: grid;
		grid-template-columns: 1fr 360px;
		gap: 32px;
		align-items: start;
	}

	.about-text h2 {
		margin: 0 0 24px;
		font-size: 32px;
		font-weight: 900;
		line-height: 48px;
	}

	.about-lead {
		margin: 0 0 8px;
		font-size: 22px;
		font-weight: 600;
		line-height: 28px;
	}

	.about-text ul {
		margin: 0;
		padding-left: 1.2em;
		font-size: 20px;
		line-height: 28px;
	}

	.about-text hr {
		margin: 24px 0;
		border: none;
		border-top: 1px solid #000;
	}

	.about-text p:not(.about-lead) {
		margin: 0;
		font-size: 20px;
		line-height: 28px;
	}

	.about-placeholder {
		height: 359px;
		border-radius: 16px;
		background: #f0f0f0;
		box-shadow: 8px 8px 4px 0 rgba(0, 0, 0, 0.25);
		opacity: 0.6;
	}

	/* Tagline */
	.tagline {
		padding: 32px 0 64px;
		text-align: right;
	}

	.tagline h2 {
		margin: 0 0 12px;
		font-size: clamp(36px, 5vw, 58px);
		font-weight: 900;
		line-height: 1.05;
		color: #625181;
	}

	.tagline p {
		margin: 0 0 0 auto;
		max-width: 858px;
		font-size: 20px;
		line-height: 28px;
	}

	/* Footer */
	.footer {
		padding: 32px 12px 48px;
	}

	.footer hr {
		margin: 0 0 24px;
		border: none;
		border-top: 1px solid #000;
	}

	.footer img {
		height: 72px;
		width: auto;
	}

	@media (max-width: 900px) {
		.hero {
			padding: 64px 0 40px;
		}

		.steps-grid,
		.about-grid {
			grid-template-columns: 1fr;
		}

		.about-placeholder {
			height: 200px;
		}
	}
</style>
