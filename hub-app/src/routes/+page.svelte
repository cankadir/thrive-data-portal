<script>
	import { maps } from '$lib/store';
	import thriveLogo from '$lib/assets/thrive-logo-color.svg';
	import goToIcon from '$lib/assets/icons/go-to.svg';
	import responsibleGrowthIcon from '$lib/assets/icons/sector/responsible-growth.svg';
	import naturalTreasuresIcon from '$lib/assets/icons/sector/natural-treasures.svg';
	import transportationIcon from '$lib/assets/icons/sector/transportation-infrastructure.svg';
	import communityProsperityIcon from '$lib/assets/icons/sector/community-prosperity.svg';

	const sectors = [
		{ id: 'responsible-growth', color: '#f68a46', button: '#f8a16b', icon: responsibleGrowthIcon },
		{ id: 'natural-treasures', color: '#a9b54d', button: '#bec77a', icon: naturalTreasuresIcon },
		{
			id: 'transportation-infrastructure',
			color: '#33a5b9',
			button: '#66bccb',
			icon: transportationIcon
		},
		{
			id: 'community-prosperity',
			color: '#81749a',
			button: '#a197b3',
			icon: communityProsperityIcon
		}
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
					<p class="step-head">① Understand the state of the region across 4 sectors</p>
					<div class="sector-card">
						<p class="sector-head">Sector Profile Maps</p>
						{#each sectors as sector (sector.id)}
							<a class="sector-row" href="/maps/{sector.id}">
								<img class="sector-icon" src={sector.icon} alt="" />
								<span class="sector-label">{maps[sector.id].title}</span>
								<span class="go-btn" style="background-color: {sector.button}">
									<img src={goToIcon} alt="" />
								</span>
							</a>
						{/each}
					</div>
				</div>

				<div class="step">
					<p class="step-head">② See the work that's happening across the region</p>
					<a class="card" href="/regional-activity">
						<h2>Regional Activity Map</h2>
						<hr />
						<p>See what, where + how work is getting done across the region.</p>
						<p>
							Participate:<br />
							add your projects to the map: <span class="link">www.link.com</span>
						</p>
						<span class="go-btn card-cta"><img src={goToIcon} alt="" /></span>
					</a>
				</div>

				<div class="step">
					<p class="step-head">③ Go deep into data and more analysis</p>
					<a class="card" href="/resources">
						<h2>Resource library</h2>
						<hr />
						<p>
							Find interactive maps and apps, tools, storymaps and more that provide deep dives into
							the topics data and analysis
						</p>
						<span class="go-btn card-cta"><img src={goToIcon} alt="" /></span>
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
		width: min(1144px, calc(100% - 64px));
		margin: 0 auto;
	}

	/* Hero */
	.hero {
		padding: 200px 0 64px;
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
		padding: 32px 0 64px;
	}

	.steps-grid {
		display: grid;
		grid-template-columns: repeat(3, minmax(0, 1fr));
		gap: 32px;
		align-items: stretch;
	}

	.step {
		display: flex;
		flex-direction: column;
		min-width: 0;
	}

	.step-head {
		display: flex;
		align-items: flex-start;
		min-height: 77px;
		margin: 0 0 8px;
		font-size: 22px;
		font-weight: 900;
		line-height: 26px;
		color: #444;
	}

	/* Sector Profile Maps card */
	.sector-card {
		display: flex;
		flex-direction: column;
		flex: 1;
		min-width: 0;
	}

	.sector-head {
		display: flex;
		align-items: center;
		margin: 0;
		padding: 4px 12px;
		min-height: 56px;
		background: #ffc425;
		border: 1px solid #000;
		border-radius: 16px 16px 0 0;
		font-size: 20px;
		font-weight: 900;
		line-height: 22px;
	}

	.sector-row {
		display: flex;
		align-items: center;
		gap: 8px;
		flex: 1;
		padding: 4px 12px;
		border: 1px solid #000;
		border-top: none;
		text-decoration: none;
		color: #000;
	}

	.sector-row:last-child {
		border-radius: 0 0 16px 16px;
	}

	.sector-icon {
		width: 30px;
		height: 30px;
		flex-shrink: 0;
		object-fit: contain;
	}

	.sector-label {
		flex: 1;
		min-width: 0;
		font-size: 20px;
		font-weight: 900;
		line-height: 22px;
	}

	/* Yellow cards */
	.card {
		display: flex;
		flex-direction: column;
		gap: 16px;
		flex: 1;
		min-width: 0;
		padding: 14px 16px 16px;
		background: #ffc425;
		border: 1px solid #000;
		border-radius: 16px;
		text-decoration: none;
		color: #000;
	}

	.card h2 {
		margin: 8px 0 0;
		font-size: 22px;
		font-weight: 900;
		line-height: 32px;
	}

	.card hr {
		margin: 0;
		width: 314px;
		max-width: 100%;
		border: none;
		border-top: 1px solid #000;
	}

	.card p {
		margin: 0;
		font-size: 20px;
		font-weight: 400;
		line-height: 26px;
	}

	.link {
		text-decoration: underline;
	}

	/* Go-to arrow button */
	.go-btn {
		display: flex;
		align-items: center;
		justify-content: center;
		width: 32px;
		height: 32px;
		flex-shrink: 0;
		background: #ffdc7c;
		border: 1px solid #000;
		border-radius: 8px;
	}

	.go-btn img {
		width: 20px;
		height: 20px;
	}

	.card-cta {
		margin-top: auto;
		align-self: flex-end;
	}

	.card:hover .go-btn,
	.sector-row:hover .go-btn {
		filter: brightness(0.94);
	}

	.steps-foot {
		margin: 24px 0 0;
		font-size: 22px;
		font-weight: 900;
		line-height: 26px;
		color: #444;
	}

	/* About (full-width yellow band) */
	.about {
		background: #ffc425;
		border-top: 1px solid #000;
		border-bottom: 1px solid #000;
		padding: 48px 0 96px;
	}

	.about-grid {
		display: grid;
		grid-template-columns: 1fr 360px;
		gap: 32px;
		align-items: start;
	}

	.about-text h2 {
		margin: 0 0 32px;
		font-size: 36px;
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
		margin: 24px 0 16px;
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
		background: #ffd051;
		box-shadow: 8px 8px 4px 0 rgba(0, 0, 0, 0.25);
	}

	/* Tagline */
	.tagline {
		padding: 48px 0 96px;
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
		padding: 32px;
	}

	.footer hr {
		margin: 0 0 32px;
		border: none;
		border-top: 1px solid #000;
	}

	.footer img {
		height: 101px;
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
