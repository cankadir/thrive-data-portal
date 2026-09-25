<script>
	import { maps } from '$lib/store';
	import { sectors } from '$lib/sectors';
	import thriveLogo from '$lib/assets/thrive-logo.svg';
	import goToIcon from '$lib/assets/icons/go-to.svg';
	import hoverArrowIcon from '$lib/assets/icons/arrow-down-right.svg';
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
							<a
								class="sector-row"
								href="/maps/{sector.id}"
								style="--row-bg: {sector.color}; --row-hover: {sector.rowHover}"
							>
								<img class="sector-icon" src={sector.icon} alt="" />
								<span class="sector-label">{maps[sector.id].title}</span>
								<span class="go-btn" style="background-color: {sector.button}">
									<img class="go-arrow go-arrow-rest" src={goToIcon} alt="" />
									<img class="go-arrow go-arrow-hover" src={hoverArrowIcon} alt="" />
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
						<span class="go-btn card-cta">
							<img class="go-arrow go-arrow-rest" src={goToIcon} alt="" />
							<img class="go-arrow go-arrow-hover" src={hoverArrowIcon} alt="" />
						</span>
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
						<span class="go-btn card-cta">
							<img class="go-arrow go-arrow-rest" src={goToIcon} alt="" />
							<img class="go-arrow go-arrow-hover" src={hoverArrowIcon} alt="" />
						</span>
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
		width: min(71.5rem, calc(100% - 4rem));
		margin: 0 auto;
	}

	/* Hero */
	.hero {
		padding: 12.5rem 0 4rem;
	}

	.hero h1 {
		margin: 0;
		font-size: clamp(3rem, 6vw, 4.75rem);
		font-weight: 700;
		line-height: 1.05;
		color: #008fa8;
	}

	/* 1-2-3 cards */
	.steps {
		padding: 2rem 0 4rem;
	}

	.steps-grid {
		display: grid;
		grid-template-columns: repeat(3, minmax(0, 1fr));
		gap: 2rem;
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
		min-height: 4.8125rem;
		margin: 0 0 0.5rem;
		font-size: 1.375rem;
		font-weight: 700;
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
		padding: 0.25rem 0.75rem;
		min-height: 3.5rem;
		background: #ffc425;
		border: 1px solid #000;
		border-radius: 1rem 1rem 0 0;
		font-size: 1.25rem;
		font-weight: 700;
		line-height: 22px;
	}

	.sector-row {
		display: flex;
		align-items: center;
		gap: 0.5rem;
		flex: 1;
		padding: 0.25rem 0.75rem;
		background: var(--row-bg);
		border: 1px solid #000;
		border-top: none;
		text-decoration: none;
		color: #000;
		transition: background-color var(--anim-duration) var(--anim-ease);
	}

	.sector-row:hover {
		background: var(--row-hover);
	}

	.sector-row:last-child {
		border-radius: 0 0 1rem 1rem;
	}

	.sector-icon {
		width: 1.875rem;
		height: 1.875rem;
		flex-shrink: 0;
		object-fit: contain;
	}

	.sector-label {
		flex: 1;
		min-width: 0;
		font-size: 1.25rem;
		font-weight: 700;
		line-height: 22px;
	}

	/* Yellow cards */
	.card {
		display: flex;
		flex-direction: column;
		gap: 1rem;
		flex: 1;
		min-width: 0;
		padding: 0.875rem 1rem 1rem;
		background: #ffc425;
		border: 1px solid #000;
		border-radius: 1rem;
		text-decoration: none;
		color: #000;
	}

	.card h2 {
		margin: 0.5rem 0 0;
		font-size: 1.375rem;
		font-weight: 700;
		line-height: 32px;
	}

	.card hr {
		margin: 0;
		width: 19.625rem;
		max-width: 100%;
		border: none;
		border-top: 1px solid #000;
	}

	.card p {
		margin: 0;
		font-size: 1.25rem;
		font-weight: 400;
		line-height: 26px;
	}

	.link {
		text-decoration: underline;
	}

	/* Go-to arrow button */
	.go-btn {
		position: relative;
		display: flex;
		align-items: center;
		justify-content: center;
		width: 2rem;
		height: 2rem;
		flex-shrink: 0;
		background: #ffdc7c;
		border: 1px solid #000;
		border-radius: 0.5rem;
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
		width: 1.25rem;
		height: 0.72rem;
		transform: translate(-50%, -50%);
	}

	.go-arrow-hover {
		width: 1.25rem;
		height: 1.25rem;
		opacity: 0;
		transform: translate(-50%, -50%) rotate(0deg);
	}

	.card-cta {
		margin-top: auto;
		align-self: flex-end;
	}

	.card:hover .go-arrow-rest,
	.sector-row:hover .go-arrow-rest {
		opacity: 0;
	}

	.card:hover .go-arrow-hover,
	.sector-row:hover .go-arrow-hover {
		opacity: 1;
		transform: translate(-50%, -50%) rotate(-90deg);
	}

	@media (prefers-reduced-motion: reduce) {
		.sector-row,
		.go-arrow {
			transition: none;
		}
	}

	.steps-foot {
		margin: 1.5rem 0 0;
		font-size: 1.375rem;
		font-weight: 700;
		line-height: 26px;
		color: #444;
	}

	/* About (full-width yellow band) */
	.about {
		background: #ffc425;
		border-top: 1px solid #000;
		border-bottom: 1px solid #000;
		padding: 3rem 0 6rem;
	}

	.about-grid {
		display: grid;
		grid-template-columns: 1fr 22.5rem;
		gap: 2rem;
		align-items: start;
	}

	.about-text h2 {
		margin: 0 0 2rem;
		font-size: 2.25rem;
		font-weight: 700;
		line-height: 48px;
	}

	.about-lead {
		margin: 0 0 0.5rem;
		font-size: 1.375rem;
		font-weight: 600;
		line-height: 28px;
	}

	.about-text ul {
		margin: 0;
		padding-left: 1.2em;
		font-size: 1.25rem;
		line-height: 28px;
	}

	.about-text hr {
		margin: 1.5rem 0 1rem;
		border: none;
		border-top: 1px solid #000;
	}

	.about-text p:not(.about-lead) {
		margin: 0;
		font-size: 1.25rem;
		line-height: 28px;
	}

	.about-placeholder {
		height: 22.4375rem;
		border-radius: 1rem;
		background: #ffd051;
		box-shadow: 8px 8px 4px 0 rgba(0, 0, 0, 0.25);
	}

	/* Tagline */
	.tagline {
		padding: 3rem 0 6rem;
		text-align: right;
	}

	.tagline h2 {
		margin: 0 0 0.75rem;
		font-size: clamp(2.25rem, 5vw, 3.625rem);
		font-weight: 700;
		line-height: 1.05;
		color: #625181;
	}

	.tagline p {
		margin: 0 0 0 auto;
		max-width: 53.625rem;
		font-size: 1.25rem;
		line-height: 28px;
	}

	/* Footer */
	.footer {
		padding: 2rem;
	}

	.footer hr {
		margin: 0 0 2rem;
		border: none;
		border-top: 1px solid #000;
	}

	.footer img {
		height: 6.3125rem;
		width: auto;
	}

	@media (max-width: 900px) {
		.hero {
			padding: 4rem 0 2.5rem;
		}

		.steps-grid,
		.about-grid {
			grid-template-columns: 1fr;
		}

		.about-placeholder {
			height: 12.5rem;
		}
	}
</style>
