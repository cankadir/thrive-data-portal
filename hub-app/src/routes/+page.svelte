<script>
	import { maps } from '$lib/store';
	import { sectors } from '$lib/sectors';
	import thriveLogo from '$lib/assets/thrive-logo.svg';
	import aboutMap from '$lib/assets/about-map.jpg';
	import goToIcon from '$lib/assets/icons/go-to.svg';
	import hoverArrowIcon from '$lib/assets/icons/arrow-down-right.svg';
</script>

<main class="landing">
	<section class="hero">
		<div class="wrap">
			<h1>Thrive Resource Hub</h1>
			<p class="hero-subtitle">Explore the <span style="font-style: italic">beta version</span> of the Resource Hub</p>
		</div>
	</section>

	<section class="steps">
		<div class="wrap">
			<div class="steps-grid">
				<div class="step">
					<p class="step-head">
						<span class="step-num">1</span>
						<span>Understand the state of the region across 4 sectors</span>
					</p>
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
					<p class="step-head">
						<span class="step-num">2</span>
						<span>See the work that's happening across the region</span>
					</p>
					<a class="card" href="/regional-activity">
						<h2>Regional Activity Map</h2>
						<div class="card-body">
							<p>See what, where + how work is getting done across the region.</p>
							<span class="go-btn card-cta">
								<img class="go-arrow go-arrow-rest" src={goToIcon} alt="" />
								<img class="go-arrow go-arrow-hover" src={hoverArrowIcon} alt="" />
							</span>
						</div>
					</a>
				</div>

				<div class="step">
					<p class="step-head">
						<span class="step-num">3</span>
						<span>Go deep into data and more analysis</span>
					</p>
					<a class="card" href="/resources">
						<h2>Resource library</h2>
						<div class="card-body">
							<p>
								Find interactive maps and apps, tools, storymaps and more that provide deep dives
								into the topics data and analysis
							</p>
							<span class="go-btn card-cta">
								<img class="go-arrow go-arrow-rest" src={goToIcon} alt="" />
								<img class="go-arrow go-arrow-hover" src={hoverArrowIcon} alt="" />
							</span>
						</div>
					</a>
				</div>
			</div>

			<p class="steps-foot">
				<a href="/maps/natural-treasures">Start here</a> or jump in wherever you want
			</p>
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

				<p class="about-subhead">How to use the hub</p>
				<p class="about-body">The region is considered at 3 different extents,</p>
				<ol>
					<li>The 16 core counties of the Thrive region</li>
					<li>
						The watershed boundaries are used to define areas of environmental and ecological
						concern
					</li>
					<li>the greater Thrive region includes the counties adjacent to the core area</li>
					<li>
						Find topic sections in the sidebar navigation in each section. Opening those will make
						it possible to turn data layers on and off.
					</li>
				</ol>
			</div>

			<img class="about-image" src={aboutMap} alt="Map of the Thrive region" />
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

	.hero-subtitle {
		font-size: 1.5rem;
		font-weight: 700;
		line-height: 1.625rem;
		color: #444;
	}

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
		padding: 10.5rem 0 4rem;
	}

	.hero h1 {
		margin: 0;
		font-size: clamp(3rem, 6vw, 4.75rem);
		font-weight: 700;
		line-height: 1;
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
		gap: 0.8rem;
		min-height: 4.8125rem;
		margin: 0 0 1rem;
		font-size: 1.375rem;
		font-weight: 700;
		line-height: 1.625rem;
		color: #444;
	}

	/* Step number: twice the head size, no line-height box. */
	.step-num {
		flex-shrink: 0;
		font-size: 2em;
		line-height: 1;
	}

	/* Sector Profile Maps card */
	.sector-card {
		display: flex;
		flex-direction: column;
		flex: 1;
		min-width: 0;
	}

	.sector-head,
	.card h2 {
		display: flex;
		align-items: center;
		margin: 0;
		padding: 0.25rem 0.75rem;
		min-height: 3.5rem;
		font-size: 1.25rem;
		font-weight: 700;
		line-height: 1.375rem;
	}

	.sector-head {
		background: #ffc425;
		border: 1px solid #000;
		border-radius: 1rem 1rem 0 0;
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
		line-height: 1.375rem;
	}

	/* Yellow cards */
	.card {
		display: flex;
		flex-direction: column;
		flex: 1;
		min-width: 0;
		background: #ffc425;
		border: 1px solid #000;
		border-radius: 1rem;
		text-decoration: none;
		color: #000;
	}

	.card h2 {
		position: relative;
	}

	.card h2::after {
		content: '';
		position: absolute;
		right: 1rem;
		bottom: 0;
		left: 1rem;
		border-bottom: 1px solid #000;
	}

	.card-body {
		display: flex;
		flex-direction: column;
		gap: 1rem;
		flex: 1;
		padding: 1rem 0.75rem;
	}

	.card p {
		margin: 0;
		font-size: 1.25rem;
		font-weight: 400;
		line-height: 1.625rem;
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
		line-height: 1.625rem;
		color: #444;
	}

	.steps-foot a {
		color: inherit;
		text-decoration: underline;
	}

	/* About (full-width yellow band) */
	.about {
		background: #ffc425;
		border-top: 1px solid #000;
		border-bottom: 1px solid #000;
		padding: 3rem 0;
	}

	.about-grid {
		display: grid;
		grid-template-columns: minmax(0, 35.875rem) 1fr;
		gap: 2rem;
		align-items: start;
	}

	.about-text h2 {
		margin: 0 0 2rem;
		font-size: 2.25rem;
		font-weight: 700;
		line-height: 3rem;
	}

	.about-lead {
		margin: 0 0 0.5rem;
		font-size: 1.375rem;
		font-weight: 500;
		line-height: 1.75rem;
	}

	.about-text ul {
		margin: 0;
		padding-left: 1.2em;
		font-size: 1.25rem;
		line-height: 1.75rem;
	}

	.about-subhead {
		margin: 1.5rem 0 0.25rem;
		font-size: 1.5rem;
		font-weight: 700;
		line-height: 2rem;
	}

	.about-body,
	.about-text ol {
		margin: 0;
		font-size: 1.125rem;
		line-height: 1.75rem;
	}

	.about-text ol {
		padding-left: 1.2em;
	}

	.about-text li {
		line-height: 1.75rem;
	}

	.about-image {
		width: 100%;
		height: 30.75rem;
		border-radius: 0.75rem;
		object-fit: cover;
		box-shadow: 0 4px 2px 0 rgba(0, 0, 0, 0.25);
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
		line-height: 1.75rem;
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

		.about-grid {
			grid-template-columns: 1fr;
		}

		.about-image {
			height: 18rem;
		}
	}

	@media (max-width: 700px) {
		.steps-grid {
			grid-template-columns: 1fr;
		}
	}
</style>
