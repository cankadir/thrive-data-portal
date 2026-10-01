# Session History

## 2026-07-20 — Initial setup + project-memory skill

- Created `~/.config/opencode/skills/project-memory/` skill for cross-session context retention
- Created `opencode-docs/AGENTS.md` with hub-app architecture overview
- Created `opencode-docs/history.md` for append-only session logs
- User wants to continue working on hub-app (Thrive Data Portal SvelteKit project)

## 2026-07-20 — Svelte code review + UI icons

- Loaded `svelte-code-writer`, `svelte-core-bestpractices`, and `concise-code` skills
- Reviewed all 11 Svelte files with autofixer
- Fixed `+layout.svelte`: removed unnecessary `$effect`, set store directly
- Fixed `SectorSidebar.svelte`: replaced `$storeName` with `get()` in script, simplified `$state` mutations (removed spread pattern)
- Fixed `resources/+page.svelte`: added each-block key
- Replaced Museo Sans with Source Sans 3 from Google Fonts (app.html + layout)
- Extracted UI icons from Figma frame 377:1566 (32 icons)
- Copied PNG icons to `src/lib/assets/icons/` with `icon/` and `open-close/` subdirs
- Added `map-pin` icon next to title in SectorSidebar sidebar header
- Added icons to landing page buttons (flag-triangle-right, map, map-pin, target, line-chart, navigation-cursor)

## 2026-07-22 — ArcGIS auth fix + map load perf + zoom to extent

- **Root cause**: `view.map.loadAll()` in `extractMapPanelData.js` triggered ArcGIS IdentityManager auth dialog when any webmap layer required credentials. All layers are public but the SDK's `loadAll()` fetches per-layer metadata which prompted auth.
- **Fix**: Set `identityManager.dialog = null` at module level in `extractMapPanelData.js`. Prevents auth popup; failed layers handled silently.
- **Perf**: Removed `await webmap.load()` — MapView now created with unloaded WebMap (saves network round-trip). Removed `loadAllLayers()` entirely — layers load naturally via MapView. Extracted `extractLegendLazy()` as fire-and-forget so legend rendering doesn't block initial render.
- **Zoom**: Added `zoomToExtent(view, layerTitle)` helper in `ArcGISMap.svelte` to zoom to "Thrive County Boundaries" reference layer on load.
- **Files changed**: `hub-app/src/lib/map/extractMapPanelData.js`, `hub-app/src/lib/components/ArcGISMap.svelte`

## 2026-08-31 — Layer visibility sync (effective visibility) + nav dropdown

- **Issue**: Natural Treasures map radios showed many layers ON that the map never drew. Only Regional Trails (+ reference layers) actually rendered. Root cause: the webmap has **group layers with `visibility: false` whose children are `visible: true`** (e.g. `Water Resources` off → Stream health/Brownfield/Superfund on; `Protected Lands` off → 2 children on). Esri cascades group visibility, so the map hides those children, but the app was reading only the raw per-layer flag → radio states did not match the map. Toggling a child inside an off group also did nothing visible because ancestors were never turned on.
- **Fix**: Effective layer visibility. `flattenOperationalItems`/`walkMapLayers` now report `visible = layer.visible && ancestorVisible` (all ancestors). `setMapLayerVisibility` turns on ancestor groups when enabling a layer. Radios now match the map, and toggling a layer on really shows it.
- **User preference (next step)**: Set all groups visible in ArcGIS and control visibility per leaf layer; groups are never user-toggleable in the UI. The effective-visibility code becomes a no-op in that world (kept as a safety net).
- **Nav**: "Sector Profile Maps" nav item is now always a hover dropdown listing all maps from `store.js` `maps` variable (was a plain link to `/maps`, which 404'd, whenever not on a `/maps/[id]` page). `HeaderNav.svelte` is a new (previously uncommitted) component.
- **Map loading state**: `ArcGISMap.svelte` previously set `mapLoading = false` synchronously right after constructing `MapView`, so sidebars flashed "No layer groups/layers available" while the map still loaded. Now `mapLoading` stays true until `view.when()` + layer/legend extraction resolve.
- **Files changed**: `hub-app/src/lib/map/extractMapPanelData.js`, `hub-app/src/lib/mapStore.js`, `hub-app/src/lib/components/ArcGISMap.svelte`, `hub-app/src/lib/components/HeaderNav.svelte`

## 2026-09-04 — Resources page redesign (cards + AI search) + sidebar legend alias

- **Resources page**: Built `ResourceCard.svelte` (Figma card language scaled down — rounded 18px, offset drop-shadow, colored sector top panel w/ auto text luminance, neutral bottom panel). Single sector → sector color top; multi-sector → white/grey top + per-sector chips. Fields all data-driven w/ `{#if}`; whole card = `<a href={rest_api_url}>`.
- **Page layout**: Reused Resource Hub landing hero (big title + filler text on grey `#d6d6ce` bg) + single non-autocomplete search bar (submit-on-Enter/button).
- **AI search endpoint** `api/search-resources`: calls DeepSeek (`deepseek-v4-flash` — `deepseek-chat` is deprecated, JSON mode) to rank catalog by relevance + return short reasoning.
  - **Key bug found**: `$env/dynamic/private` only exports an `env` object — `import { DEEPSEEK_API_KEY }` was always `undefined` (500 "not configured"). Fix: `env.DEEPSEEK_API_KEY`. Named imports only work with `$env/static/*`.
  - **Session context**: cookie-backed in-memory per-tab session (`thrive_search_session`); catalog loaded as system context on first call, follow-ups reuse thread ("only the natural ones"). Pruned to last 20 turns. No DB — memory-per-tab intentional.
  - **Out-of-context guard**: irrelevant queries → `{"ids":[],"reasoning":"Query out of Context","outOfContext":true}`; page shows banner and keeps default grid. Server appends any ids the model omitted so cards never disappear.
- **Sidebar legend alias**: `SectorSidebar` removed the "Summary" heading (kept description). Legend block now titled by the rendered field's alias (e.g. Protected Lands 2026 `Pub_Access` → "Public Access") via new `fetchLayerVisualFieldAlias()` in `fetchSublayerMetadata.js` (reads live layer renderer `field1`/`field`, resolves via `layer.fields`). Where future sidebar charts plug in.
- **Nav**: reduced nav text 16→14px; made sector-selector color full-bleed (`padding:0` on wrapper, `12px` padding on the link itself so text doesn't touch edges and matches sibling buttons).
- **Investigation (no code)**: Water Resources "toggle one brings up siblings" — diagnosed as the ArcGIS map's off-group/raw-TRUE children (issue 1) + nested group rendered as a toggleable radio instead of a collapsible header (issue 2). User's call: fix the nesting in ArcGIS, not the front end.
- **Files changed**: `hub-app/src/lib/components/ResourceCard.svelte` (new), `hub-app/src/lib/components/HeaderNav.svelte`, `hub-app/src/lib/components/SectorSidebar.svelte`, `hub-app/src/lib/map/fetchSublayerMetadata.js`, `hub-app/src/routes/resources/+page.svelte`, `hub-app/src/routes/api/search-resources/+server.js` (new), `hub-app/.env` (git-ignored; `DEEPSEEK_API_KEY`)

## 2026-09-11 — Landing page + navbar redesign + Vercel branch diagnosis

- **Figma MCP diagnosis**: Local Figma Dev Mode server (`http://127.0.0.1:3845/mcp`) was up and healthy (6 tools) but the running opencode process had no `figma_*` tools (stale connection from startup). `opencode mcp list` reported connected; the live TUI had no socket to `:3845`. Fix: restart opencode with Figma Desktop open + Dev Mode MCP enabled. The VS Code Figma MCP extension does **not** feed opencode (it reads its own config). The remote `https://mcp.figma.com/mcp` requires OAuth (`scope=mcp:connect`) and is not used.
- **Landing page** (`/`, Figma `landing-page-2` node `3799:122467`): rebuilt `+page.svelte` — bg `#e0e0d9`, 1144px column, teal hero `#008fa8`, 1‑2‑3 cards as links (Regional Activity Map → `/regional-activity`, sector rows → `/maps/[id]`, Resource library → `/resources`), About + tagline + footer. Card hover: drop-shadow + lift (`translateY(-2px)`); sector rows lift with `z-index`.
- **Color logo asset**: composed `hub-app/src/lib/assets/thrive-logo-color.svg` from the 4 Figma `multi-color-large` SVG groups at their inset positions in a 349×101 box; stripped `fill:color(display-p3 …)` (kept hex fallback). Color on landing; `thrive-logo.png` (greyscale) elsewhere.
- **HeaderNav redesign** (Figma `3836:102832`, "Variant2"): lighter bg `#ecece8`, 1px black outer border, divider only between logo and buttons; 4 items (Regional Activity Map, Sector Maps dropdown, Resource Library, Data Access placeholder); **fixed 255.75px** item widths (`flex: 0 1 255.75px`) so the text/gap ratio matches the design and doesn't drift when the home button is hidden on landing. Sector colors RG `#f68a46`, TI `#33a5b9`, CP `#81749a`, NT `#93a221` applied to the Sector Maps toggle on sector pages. Black `home_circle_line_black` icon hidden on `/`; logo links to `https://www.thriveregionalpartnership.org/` in a new tab. Verified by headless Chromium at 1600px (item centers within ~2px of Figma).
- **Landing footer**: full-bleed with a 12px side inset instead of the 1144px `.wrap` column.
- **Vercel failure diagnosed (no code)**: `UNLOADABLE_DEPENDENCY` for `$lib/store` / `MapPageLayout.svelte` was because Vercel builds `main`, and `main` has `hub-app/src/routes/**` but **no `hub-app/src/lib/**`** — all `$lib` code lives only on `web-style-transfer`. The error's line numbers matched `main`'s `maps/[id]/+page.svelte`. Fix: merge `web-style-transfer` → `main` (or change Vercel's Production Branch).
- **Files changed**: `hub-app/src/routes/+page.svelte`, `hub-app/src/lib/components/HeaderNav.svelte`, `hub-app/src/lib/assets/thrive-logo-color.svg` (new), `opencode-docs/AGENTS.md`

## 2026-09-11 (later) — Landing page rebuilt from the CORRECT frame + icon/store fixes

- **Wrong-frame root cause**: the landing page had been built from Figma `landing-page-2` node `3799:122467`, but that is an older duplicate — the current frame is `3820:96886`. Both frames share the name `landing-page-2`. Rebuilt `+page.svelte` from `3820:96886`. **Process fix**: frame names are not unique; resolve by the URL's node id and pull a screenshot of that exact node before implementing.
- **What the correct frame changed**: full-width yellow **About band** (`#ffc425`, black top/bottom borders); the first card is **Sector Profile Maps** (yellow header + 4 sector rows, each with a go-to arrow button); step-header order is sectors → activity → library; the three cards are equal height (273px); each yellow card has a title, divider and a bottom-right go-to arrow; footer uses the color logo; tagline right-aligned purple.
- **Sector icons**: replaced the old PNG icons with the design SVGs, saved to `hub-app/src/lib/assets/icons/sector/{responsible-growth,natural-treasures,transportation-infrastructure,community-prosperity}.svg`. Added `hub-app/src/lib/assets/icons/go-to.svg` for the arrow buttons.
- **Alignment fix**: `step-head` is now a fixed 77px row so the cards align even when the header text wraps to different line counts.
- **Nav dropdown folding**: `.dropdown-item` inherited `white-space: nowrap` from `.nav-item` (via the `.nav-sector` wrapper), so "Transportation + Infrastructure" overflowed. Fixed with `white-space: normal` + `overflow-wrap: break-word` + `min-height`.
- **Store refactor**: removed the `approvedTools` writable store (and the `writable` import); `resources/+page.svelte` now reads `page.data.approvedTools` via `$derived`. This also removed the layout's store-sync `$effect` and the `state_referenced_locally` warning at `+layout.svelte:9`.
- **Rendering note**: headless Chromium `--screenshot` started hanging in this env; `wkhtmltoimage` works as a fallback (no JS/hover, so limited fidelity).
- **Files changed**: `hub-app/src/routes/+page.svelte`, `hub-app/src/routes/resources/+page.svelte`, `hub-app/src/routes/+layout.svelte`, `hub-app/src/lib/components/HeaderNav.svelte`, `hub-app/src/lib/store.js`, `hub-app/src/lib/assets/icons/sector/*` (new), `hub-app/src/lib/assets/icons/go-to.svg` (new), `opencode-docs/AGENTS.md`

## 2026-09-16 — Resource Library restyle + search typewriter

- **Figma**: implemented `Resource Library-v2` node `3821:97956` (URL-provided node id). Pulled `get_design_context` for the page headline, the colored card variants (responsible-growth / cp / dataset) and the tagline, plus `get_variable_defs` for the palette. Card colors/icons come from the design tokens, not the old neutral-top + chips treatment.
- **Layout**: page bg `#e0e0d9`; headline column 1144px; card grid 1512px (4×360 + 24 gap, 44px margins). Right-aligned tagline + color-logo footer mirror the landing page.
- **`ResourceCard.svelte`**: rewritten to a full-colour sector block (radius 20, `8px 8px 4px` shadow, min-height 300) — sector icon + uppercased `tool_type`, 24/900 title, `summary || field_9` description, Date/Last updated/Sector/Author meta, bottom-right `go-to.svg` button in the sector's lighter shade. First recognised `sector_tags` entry picks the colour/icon; no sector → neutral grey + new `sector/dataset.svg` (curled straight from the Figma MCP asset server).
- **Search typewriter**: `$effect` types/deletes a rotating prompt list; pauses on focus/non-empty; respects `prefers-reduced-motion`; removed the native placeholder and the visible Search button (Enter submits). Overlay text is grey `#b6b3a7` weight 600 (user follow-up: "lighter and a bit more grey"); caret inherits `currentColor`.
- **Verified**: `vite build` clean; headless Chromium screenshots at 1600px and 760px match the design (cards, colors, tagline, footer).
- **Files changed**: `hub-app/src/routes/resources/+page.svelte`, `hub-app/src/lib/components/ResourceCard.svelte`, `hub-app/src/lib/assets/icons/sector/dataset.svg` (new), `opencode-docs/AGENTS.md`

## 2026-09-16 (later) — New Thrive logo (2 Figma pieces → one SVG)

- **User request**: replace the logo using two Figma nodes — mark `3793:120128` and wordmark `3793:120141` — combined into one piece preserving the original width/height.
- **Composed** `hub-app/src/lib/assets/thrive-logo.svg`: root `width=133.1607 height=39.0658` (`49.6944 + 83.4663` wide, max of mark height `39.0658` and wordmark bottom `7.0759 + 24.9140`). Mark at origin; wordmark at `translate(49.6944 7.0759)`. Downloaded both SVGs from the Figma MCP asset server and stripped `id`/`style` (incl. `fill:color(display-p3 …)`)/`clip-path`/`<defs>` in a small Python composition.
- **Wired up**: HeaderNav (was png + color-svg ternary), landing footer, resources footer all import `thrive-logo.svg`. Deleted `thrive-logo-color.svg` and `thrive-logo.png`.
- **Verified**: `vite build` clean; headless Chromium on the existing `:5173` dev server shows the one-piece logo at header (40px) and landing footer (101px).
- **Files changed**: `hub-app/src/lib/assets/thrive-logo.svg` (new), `hub-app/src/lib/components/HeaderNav.svelte`, `hub-app/src/routes/+page.svelte`, `hub-app/src/routes/resources/+page.svelte`, `opencode-docs/AGENTS.md`

## 2026-09-16 (later still) — Unified sector colours + search bar scaling

- **Sector colours (Figma `1861:34407` dropdown)**: created `src/lib/sectors.js` as the single source of truth (RG `#f68a46`/`#f8a16b`, NT `#a9b54d`/`#bec77a`, TI `#33a5b9`/`#66bccb`, CP `#81749a`/`#a197b3`). Replaced the divergent definitions in `HeaderNav` (NT was `#93a221`), `ResourceCard` (local map) and `store.js` `sectorDefaults` (was a shifted set where RG=blue/TI=orange and NT/CP were darker). Landing/`+page.svelte` consumes the shared list too. Verified `:5173/maps/natural-treasures` — sidebar header + nav "Sector Maps" toggle + resource cards all green `#a9b54d`.
- **Search bar sizing**: the `@media (max-width: 900px)` font override made the pill jump shorter with an unchanged `25px` radius. Replaced with `--search-font: clamp(22px, 1.4vw + 10px, 32px)` + `em`-based padding (`0.375em 0.625em`) and radius (`0.78em`), so height and corner radius scale smoothly together. Verified at 900px and 1600px.
- **Files changed**: `hub-app/src/lib/sectors.js` (new), `hub-app/src/lib/store.js`, `hub-app/src/lib/components/HeaderNav.svelte`, `hub-app/src/lib/components/ResourceCard.svelte`, `hub-app/src/lib/components/SectorSidebar.svelte`, `hub-app/src/routes/+page.svelte`, `hub-app/src/routes/resources/+page.svelte`, `opencode-docs/AGENTS.md`

## 2026-09-16 (map panel refinements) — Default zoom, hidden boundary group, legend/summary

- **Default zoom**: added `src/lib/map/secondaryBoundary.js` (`secondaryBoundaryExtent`, the `thrive_secondary_boundary` service full extent in Web Mercator). `ArcGISMap` now takes a `defaultExtent` prop and zooms to the `thrive_secondary_boundary` layer when the webmap has it, else to the constant. `maps/[id]/+page.svelte` passes it. Replaces the old `zoomToExtent(view, 'Thrive County Boundaries')`. (Could not verify in headless Chromium — ArcGIS needs WebGL2, unavailable in the sandbox.)
- **Hidden reference group**: `extractMapPanelData.js` skips `Thrive boundaries and mask layers` / `Thrive region masks` groups (and their children) in both `flattenOperationalItems` and the `walkMapLayers` fallback — they stay on the map but are no longer editable panel entries.
- **Legend fix**: `"Trucking Companies"` (simple renderer, one item) was hidden because `SectorSidebar` required `items.length > 1`; changed to `> 0`.
- **Summary fix**: the layer has no REST `description`; its text is the portal item `snippet`. `fetchLayerMetadata` now returns `summary` (portal item snippet) on every path and `SectorSidebar` renders it above the description.
- **Files changed**: `hub-app/src/lib/map/secondaryBoundary.js` (new), `hub-app/src/lib/components/ArcGISMap.svelte`, `hub-app/src/lib/map/extractMapPanelData.js`, `hub-app/src/lib/map/fetchSublayerMetadata.js`, `hub-app/src/lib/components/SectorSidebar.svelte`, `hub-app/src/routes/maps/[id]/+page.svelte`, `opencode-docs/AGENTS.md`

## 2026-09-16 (styling audit) — Nav active state + landing sector rows

- Audited the build against `header-v2` (`3830:100645`), landing (`3820:96886`) and Resource Library (`3821:97956`). Implemented the three the user approved; left the rest pending:
  - **Selector label**: nav's first item shows the active sector's title on sector pages (defaults to Responsible Growth on other non-landing pages) and "Sector Maps" on `/`.
  - **Active-page highlight**: `HeaderNav` `.nav-item.active` gets `#33a5b9` on `/regional-activity` and `/resources` (per the design's teal Resource Library item).
  - **Landing sector rows**: each row now has `background-color: sector.color`, matching `3820:96904`.
- **Not done (user did not approve)**: nav item reorder, landing hero subtitle "Understand the state of the region across 4 sectors", About-band arrow-in-circle icon.
- **Files changed**: `hub-app/src/lib/components/HeaderNav.svelte`, `hub-app/src/routes/+page.svelte`, `opencode-docs/AGENTS.md`

## 2026-09-16 (cleanup) — Dead/zombie code removed

- Audited the whole `hub-app/src` tree (cross-referencing every component, export, function and asset) and removed:
  - `lib/components/Accordion.svelte` — unused (only `LegendAccordion` is used).
  - `extractMapPanelData()` export — unused (`ArcGISMap` uses `extractLayers`/`extractLegendLazy`).
  - `LegendAccordion`'s non-embedded mode (header/toggle/`title` prop/`open` state) — its only caller `MapLayerPanel` always rendered it embedded; `MapLayerPanel` no longer passes `embedded`.
  - `SectorSidebar`: dead `--sector-color` custom property, empty `.group {}` rule, and the `groupColor()` indirection whose parameter was ignored.
  - `fetchLayerMetadata`: unused `source` field (was `none`/`missing-layer`/`sublayer-rest`/`source-json`/`portal-item`/`layer-props`); early guard also now returns `summary`.
  - 39 unreferenced `src/lib/assets/icons/**` files and the entire duplicated `static/icons/` directory (41 files) + empty `static/fonts/`. Kept `icon/map-pin.png`, `go-to.svg`, `sector/*`, `thrive-logo.svg`, `favicon.svg`.
- Verified no lingering references and a clean `vite build`.
- **Left pending (not dead, but dormant)**: empty `mapId` for responsible-growth / community-prosperity in `lib/store.js`, and the unlinked `regional-activity` map entry.
- **Files changed**: `hub-app/src/lib/components/{Accordion.svelte (deleted),LegendAccordion.svelte,MapLayerPanel.svelte,SectorSidebar.svelte}`, `hub-app/src/lib/map/{extractMapPanelData.js,fetchSublayerMetadata.js}`, deleted icon sets, `opencode-docs/AGENTS.md`

## 2026-09-21 — Internal /forms pages (ArcGIS → Survey123 edit links)

- **Request**: an internal (non-public-facing, visuals secondary) page that reads an ArcGIS FeatureServer layer and lists every feature as a clickable Survey123 edit link. Must scale to many future surveys, so the page was named/structured as a reusable registry.
- **Registry** `hub-app/src/lib/forms.js`: `forms` keyed by slug + `formBySlug()` + `surveyEditUrl(form, globalId)`. Entry describes `serviceUrl`, `layerId`, `globalIdField`, `objectIdField`, `labelField`, `columns`, `surveyUrl`. Adding a survey = one object.
- **Routes**: `/forms` index lists the registry; `/forms/[slug]` (`+page.server.js`) queries the layer server-side, reads `maxRecordCount` from layer metadata to paginate safely (`resultOffset` + `orderByFields=<objectIdField>`), requests only the needed fields with `returnGeometry=false`, builds `{surveyUrl}?mode=edit&globalId={GlobalID_2}`, and marks both pages `noindex`. Unknown slug → 404, ArcGIS error → 502.
- **Row UI (follow-up)**: first cut had the label and a separate "Edit" link both clickable; changed so the **entire row is one `<a>`** (CSS grid, hover/focus background + sliding arrow, no separate Edit link/Form column). Also trimmed `regional-activity-map` columns to `sector`, `organization`, `project_status` (`sector` first; `county_state` dropped as unimportant). Column labels are field names with `_` → space.
- **Empty status tag (follow-up)**: added optional `statusField` + `emptyStatusLabel` to the registry; an empty status cell renders a soft orange-red pill (`#d9542b` on `#ffeae6`, `#ffb6a8` border) reading "Not approved". Wired through `+page.server.js` → `+page.svelte`. `regional-activity-map` uses `statusField: 'project_status'` (its values are currently all null, so every row shows the tag).
- **Status vocabulary (follow-up)**: replaced `emptyStatusLabel` with `statusStyles` (raw value → `{ label, tone }`) + `emptyStatus`. Tones: green `yes`, red `no`, blue `in_review`, grey null ("Needs review"); unmapped values render as plain text. **Correction**: the status field is `review_status` (yes/no/in_review/null), not `project_status` — columns are now `sector`, `organization`, `review_status`. `review_status` is null for every feature (verified via distinct query), so all rows show grey "Needs review"; `project_status` (Complete/In progress/Ongoing) is no longer displayed.
- **Page copy (follow-up)**: added a fixed instruction line under the title ("Click on a record to edit the data in Survey123. A new browser tab will open with the available information filled in.") and changed the count to "<n> records are available in the dataset".
- **Live updates (discussion, no code)**: asked whether the page can react to Esri edits. The load already re-queries on every request (fresh on reload); auto-refresh without reload was deliberately deferred. Options noted: client `invalidateAll()` polling (simplest), SSE/WebSocket (needs a persistent host), ArcGIS webhooks (`supportsWebHooks: true`, needs a public receiver). Editor tracking is off, so there's no timestamp to diff.
- **First form** `regional-activity-map`: dataset `260919_RAM_Data_Polygons_Can_2` (41 features), `globalIdField: 'GlobalID_2'`, `labelField: 'project_name'`, survey share `e7199db2f8354ce7a2eecc55cafa6d5a`.
- **Field-name gotcha**: that layer's OID is `ObjectId` (not `OBJECTID`) and the survey key is `GlobalID_2` (the plain `GlobalID` is an unrelated string field).
- **Verified**: Svelte autofixer clean on both components; `npm run build` clean; temp dev server on `:5199` returned 41 records / 82 edit links (label + Edit per row) with correct `globalId`s, and 404 for an unknown slug. (Later edits — row-link rewrite, status tags, copy — were verified with autofixer + prettier only; build skipped to avoid clobbering a dev server the user was starting.)
- **Files changed**: `hub-app/src/lib/forms.js` (new), `hub-app/src/routes/forms/+page.svelte` (new), `hub-app/src/routes/forms/[slug]/+page.server.js` (new), `hub-app/src/routes/forms/[slug]/+page.svelte` (new), `opencode-docs/AGENTS.md`

## 2026-09-22 — Esri webmap charts in the sector sidebar (Route A)

- **Goal**: render the charts configured in ArcGIS Map Viewer inside the portal sidebar, tied to their layers, with Esri's own styling (chosen over reimplementing from the chart query).
- **Confirmed first (no code)**: the Natural Treasures webmap (`aba702c5420e4a36ac645f14a00ba8f1`) stores three charts on sublayer JSON — Protected Lands (2026) histogram, Superfund sites "Superfund Sites per County", Hiking Trails "Miles of trails by county". `@arcgis/core` `FeatureLayer` exposes them as `.charts` (read from webmap JSON), so discovery needs no hardcoded list or extra fetch.
- **Implementation**: new `src/lib/components/LayerChart.svelte` renders `<arcgis-chart>` and sets `.layer` (real FeatureLayer from the `mapView` store) + `.chartIndex` via an `{@attach}`; new `src/lib/map/charts.js` registers the custom elements once; `extractMapPanelData.js` adds `chartCount` via `chartCountOf(layer)` to flattened layer entries; `SectorSidebar` renders a `LayerChart` per chart inside each `.layer-item`, **gated on `layer.visible && layer.chartCount > 0`** (follow-up: hide the chart when the layer is off; unmounting also disposes AmCharts). Installed `@arcgis/charts-components@4.34.8` + peer `@esri/calcite-components`.
- **Build gotcha (important)**: initially added charts-components to `optimizeDeps.exclude` (mirroring `@arcgis/core`) — that serves the package source raw and its CJS dep `fast-memoize` fails ESM interop (`does not provide an export named 'default'`), so `<arcgis-chart>` never upgrades. Fix: leave it **prebundled** (only `@arcgis/core` excluded). `vite.config.js` ended unchanged.
- **Verification**: dev server had no WebGL2, so the map route itself couldn't render. Verified headlessly with Playwright/Chromium against `:5173`: (1) `new WebMap(...).load()` shows `charts` on exactly the three FeatureLayers with expected titles/ids, (2) a standalone `<arcgis-chart .model={config} .layer={featureLayer}>` rendered the Superfund bar chart (SVG + county labels + title).
- **Files changed**: `hub-app/src/lib/components/LayerChart.svelte` (new), `hub-app/src/lib/map/charts.js` (new), `hub-app/src/lib/components/SectorSidebar.svelte`, `hub-app/src/lib/map/extractMapPanelData.js`, `hub-app/package.json` (+lock), `opencode-docs/AGENTS.md`

## 2026-09-22 (later) — Chart polish questions + ArcGIS 5.x upgrade

- **Follow-up request**: gate charts on layer visibility (done: `SectorSidebar` now `{#if layer.visible && layer.chartCount > 0}`; unmount disposes AmCharts), then three visual asks + a version-warning question. Rendered the Superfund chart headlessly to inspect rather than guess.
- **Findings**: chart **background** and **title alignment** are chart-config properties (`background`, `title.content.horizontalAlignment`) — **user chose to set them in Esri Map Viewer**, not override in code (keeps the webmap the source of truth). The **x-axis left gutter** is the chart engine reserving space for category labels, not the hidden "County Name" axis title (removing that changed nothing) — not configurable. **Size** is host-driven (no size stored in the chart); left as full sidebar width × fixed height.
- **"Incompatible chart version 25.1.0"**: `25.1.0` is the ArcGIS chart-config **schema version** (ArcGIS 2025.1). `@arcgis/charts-components@4.34.8` only knew up to `24.4.0`, so it flagged 25.1.0 as Newer (non-fatal warning; chart still rendered). **User chose to upgrade the stack.** Installed `@arcgis/core@5.1.24`, `@arcgis/charts-components@5.1.24`, `@esri/calcite-components@5.1.2` (5.x knows 25.1.0). No `errorPolicy` hack needed.
- **Verified after upgrade**: `npm run build` clean; `WebMap.load()` still populates `layer.charts`; headless `<arcgis-chart>` renders 25.1.0 with `incompatible: false`. Checked 5.x still exposes what the app uses (`symbolUtils.renderPreviewHTML` etc., `reactiveUtils`, `identityManager.dialog`, `map.findLayerById`, theme CSS path, `WebMap`/`MapView`).
- **Dev-server gotcha**: the running `:5173` dev server kept stale optimized deps referencing 4.x `customElement-*` chunks, so the browser still showed the warning. Fixed by wiping `node_modules/.vite` + touching `vite.config.js` to force a Vite restart/re-optimize.
- **Files changed**: `hub-app/package.json` (+lock only), `opencode-docs/AGENTS.md`

## 2026-09-22 (charts 5.x fix) — chart blank after upgrade

- **Symptom**: after the 5.x upgrade the chart stopped rendering — `<arcgis-chart>` (and its wrapper/container) was in the DOM but empty. Also a Firefox console warning "unreachable code after return statement".
- **Root cause (charts-components 5.x breaking change)**: 5.x's `willUpdate` only handles `model` and `layer` — the `chartIndex` branch was removed, and `createModelFromLayer` is now only invoked from the `layerItemId` task (confirmed in `dist/components/arcgis-chart/customElement.js`). So `.layer` + `.chartIndex` upgraded the element but never built a model → blank. (It worked in 4.x, where `chartIndex` change triggered `createModelFromLayer`.)
- **Fix**: `LayerChart.svelte` now reads `layer.charts[chartIndex]` from the real layer and sets it as `.model` (plus `.layer`). Verified headlessly against the real webmap: `WebMap.load()` → `findLayerById` → set `.layer` + `.model` → SVG renders "Superfund Sites per County". `npm run build` clean.
- **Other notes**: the "unreachable code after return statement" warning does not appear in Chromium and is not from our code (checked the compiled `LayerChart`); it is a dependency warning (likely charts-components/calcite). A benign `Multiple versions of Lit loaded` warning appears on the maps route (5.x core bundles its own reactive-element); charts render, left as-is.
- **Files changed**: `hub-app/src/lib/components/LayerChart.svelte`, `opencode-docs/AGENTS.md`

## 2026-09-22 (chart box ratio) — `.chart-wrapper` had no height

- **Symptom**: after the 5.x fix the chart rendered but wasn't filling its box; devtools showed `.chart-wrapper` (inside the component's shadow DOM) had no height and the chart occupied only ~154px.
- **Root cause (ours)**: `LayerChart` set `.chart { display: block }`, overriding the component's own `:host { display: flex }`. That flex row is what stretches the shadow `.chart-wrapper` to the host height, so blocking it collapsed the chart to its natural height.
- **Fix**: `.chart { display: flex; width: 100%; height: auto; aspect-ratio: 4/3 }` — a full-width 4:3 box with the chart filling it (user follow-up: 1:1 was too tall; 3:4 height:width = 4:3 width:height). Verified headlessly: host 476×357 → `.chart-wrapper` 357 → SVG 357. `height: auto` is required so `aspect-ratio` (not `:host`'s `--chart-height` default) sets the height. `npm run build` clean.
- **Files changed**: `hub-app/src/lib/components/LayerChart.svelte`, `opencode-docs/AGENTS.md`

## 2026-09-22 (panel chrome + legend heading)

- **Legend heading**: `SectorSidebar` no longer falls back to the literal "Legend" — the heading renders only when a visualized-field alias exists. `fetchLayerVisualFieldAlias` → new `resolveRendererField()` handles unique-value (`field1`/`field2`/`field3`), class-breaks/heatmap (`field`), size/color `visualVariables[].field` and `normalizationField`. Verified against the NT webmap (Protected Lands → "Public Access", Stream health → "Is Assessed"; simple-renderer layers like Superfund/Brownfields/Hiking Trails return null → no heading).
- **Panel separation**: `SectorSidebar` and `MapLayerPanel` `border-right` changed `#ddd` → `1px solid #000`; `SectorSidebar` `.group-header` got `border-right: none` so the group bar doesn't double the panel edge. Both panels now share `width: var(--panel-width)`; `--panel-width: 508px` defined on `:root` in `+layout.svelte`.
- **Nav logo matches the panel**: `HeaderNav` adds `.on-map` on `/maps/[id]` and sizes `.nav-logo` to `calc(var(--panel-width) - 1px)` (the `-1px` compensates the nav's own left border). Verified headlessly at 1600px on `/maps/natural-treasures`: nav-logo right edge = 508 = sidebar right edge, both black dividers aligned.
- **Files changed**: `hub-app/src/lib/map/fetchSublayerMetadata.js`, `hub-app/src/lib/components/{SectorSidebar,MapLayerPanel,HeaderNav}.svelte`, `hub-app/src/routes/+layout.svelte`, `opencode-docs/AGENTS.md`

## 2026-09-22 (loading spinner)

- **Request**: Esri map load is slow — show a spinner until the map loads; keep the map component simple and make it a reusable component.
- **Added `Spinner.svelte`** (pure CSS, no deps): props `size`, `color` (default `#008fa8`), `label`, `overlay`. `overlay` = absolute fill of the positioned parent with a translucent `#e0e0d9` wash; hoisted as a component so `ArcGISMap` stays thin. `role="status"` + `aria-label`, `prefers-reduced-motion` swaps spin for a pulse.
- **Wired**: `ArcGISMap` wraps the map pane in `.map-wrap { position: relative }` and renders `<Spinner overlay>` while the existing `mapLoading` store is true (view stays mounted underneath). `SectorSidebar`/`MapLayerPanel` replaced their "Loading map layers…" text with the inline `<Spinner>`.
- **Verified**: autofixer + prettier clean, `npm run build` clean; rendered a temporary preview route headlessly to confirm the teal ring/overlay look, then deleted it. Spinner keyed to `mapLoading` (set true on mount, false once layers + legend extraction finish).
- **Files changed**: `hub-app/src/lib/components/Spinner.svelte` (new), `hub-app/src/lib/components/{ArcGISMap,SectorSidebar,MapLayerPanel}.svelte`, `opencode-docs/AGENTS.md`

## 2026-09-22 (infinite render loop fix)

- **Symptom**: Firefox "this page is slowing down" on the sector maps; CPU pegged.
- **Root cause**: `SectorSidebar`'s `$effect` subscribes to `mapLayers`; its synchronous callback calls `loadLayerInfo()`, which read *and* wrote the `loadingMeta` `$state` (`if (loadingMeta[id]) return; … loadingMeta[id] = false`). Reading `loadingMeta` inside the effect made it a dependency, so the post-`await` write re-ran the effect — reloading metadata forever. Reproduced in an isolated route: **16,777,217 runs / "Set maximum size exceeded" in ~2s** with the state guard vs **1 run** with a plain `Set` guard (initial flawed repro used `runs++` which self-loops; fixed the test before trusting it).
- **Fix**: in-flight guard moved to a non-reactive `const inFlight = new Set()`; `loadingMeta` is now only *written* (for the "Loading…" UI), never read by the effect. Writes don't register dependencies, reads do.
- **Audit**: checked the other `$effect`s — `resources` typewriter (writes `typed`, never reads it → safe) and `LegendAccordion` (its `metadataLoaded` guard stays `true`, so it converges after one extra run → safe).
- **Files changed**: `hub-app/src/lib/components/SectorSidebar.svelte`, `opencode-docs/AGENTS.md`

## 2026-09-22 (dead/defensive code sweep)

- Ran a read-only codebase audit (explore agent) for zombie/overly-defensive code, verified each finding, and fixed only the safe ones. `npm run build` + prettier clean.
- **Fixed (safe)**: `SectorSidebar` legend each-key `(item.label || item.type || i)` referenced an unbound `i` (latent `ReferenceError`) → `as item, i (i)`; dropped the unused `layerUrl` param + redundant `async` from `toggleLayer`; removed the dead `title` field from `extractMapPanelData` legend entries (no consumer); removed the redundant `mapLoading.set(false)` in `ArcGISMap` (the `finally` covers it); simplified the no-op system-message reassignment in `search-resources/+server.js`; removed the dead `globalid || objectid` fallback in `resources/+page.svelte` (live check: `globalid` never null, and the API keys on `globalid`); `catch (e)` → `catch {`; removed the empty `<script>` in `regional-activity/+page.svelte`; fixed `MapPageLayout` `calc(100vh - 59px)` → `100vh - 60px` (measured: nav is 60px, the old value caused a 1px vertical scroll).
- **Left for decision (documented as intentional / needs product sign-off)**: the dormant `MapLayerPanel` + `LegendAccordion` cluster (reachable only via the unlinked `/maps/regional-activity`); the two empty `mapId` stubs (community-prosperity / responsible-growth, linked but blank); the root `+layout.js` load fetching the tools catalog on every route (only `/resources` uses it); the `/data-access` placeholder link; the `/forms` routes (internal, unlinked by design); unused-but-intentional prop defaults (`Spinner` size/color, `ThinkingIndicator` label) and `var(--panel-width, 508px)` fallbacks.
- **Audit result**: no unused exports/imports/locals, no unused CSS classes, no commented-out code, no unused assets.
- **Files changed**: `hub-app/src/lib/components/{SectorSidebar,ArcGISMap,MapPageLayout}.svelte`, `hub-app/src/lib/map/extractMapPanelData.js`, `hub-app/src/routes/api/search-resources/+server.js`, `hub-app/src/routes/regional-activity/+page.svelte`, `hub-app/src/routes/resources/+page.svelte`

## 2026-09-24 — Second /forms survey (Hub Data Submission)

- **Request**: add a second editable-survey page for the `survey123_46ca68a2d700413a86df84e23eca68f9_results` FeatureServer, showing only Title / Author / Is the tool approved, without touching the in-use `regional-activity-map` entry.
- **Blocker & resolution**: the results layer first returned `Token Required` (code 499) on anonymous query, while the public `_form` view is a FieldworkerView with 0 features (schema only). User shared the **results feature service** publicly; then it queried fine (17 records). This is the standing gotcha: sharing the survey/share-link/`_form` is not enough — `_results` must itself be public for the server-side load.
- **Implementation**: pure registry addition — one entry `hub-data-submission` in `hub-app/src/lib/forms.js`. No route/component changes. `globalIdField: 'globalid'`, `objectIdField: 'objectid'`, `labelField: 'title'`, `columns: ['author', 'is_the_tool_approved']`, `statusField: 'is_the_tool_approved'` with `Y`→green "Yes" / `N`→red "No" / null→grey "Needs review".
- **Verified** against the running dev server on `:5173`: `/forms/hub-data-submission` → 200, 17 edit links (`?mode=edit&globalId=…`, correct globalIds), 15 green / 1 red / 1 grey tags; `/forms/regional-activity-map` unchanged (41 records); `/forms` index lists both. Prettier clean; no Svelte files changed.
- **Files changed**: `hub-app/src/lib/forms.js`, `opencode-docs/AGENTS.md`

## 2026-09-24 (later) — RAM photo updater page

- **Problem**: Survey123 browser edit writes text but never attachments (field-app-only feature). Custom page required.
- **Registry**: added `attachments.slots` to `regional-activity-map` in `hub-app/src/lib/forms.js` — `photo_1/2/3` (image) + `video` (video). Forms without `attachments` are untouched (`hub-data-submission`).
- **Row**: `forms/[slug]/+page.server.js` adds `row.photosUrl` + `hasAttachments`; `+page.svelte` wraps each record in a `.row-group` grid so the new "Photos" link sits beside the row anchor (avoids nesting `<a>` inside the row `<a>`). Header gets a matching "Photos" column.
- **Page**: `/forms/[slug]/photos/[globalId]` — server resolves `GlobalID_2`→`ObjectId` (strict GUID regex before the WHERE, 404 on bad/unknown/no-attachments), fetches existing attachments, returns `attachUrl`. Client: 3 image slots + video slot, `createImageBitmap` resize to 1280px JPEG, `XMLHttpRequest` upload progress, replace = delete+add, remove = `deleteAttachments`, direct to ArcGIS (no token/proxy — internal, layer is anonymously writable, GUID is the key). Mutations refresh via `invalidateAll()`; no `$effect` (autofixer flags state writes in effects).
- **Verified** on `:5173`: 42 RAM Photos buttons, 0 on hub-data, oid 41 renders its `photo_1` attachment — `ram-test-photo.png` in Photo 1, other 3 slots empty, bad GUID 404, hub-data photo route 404. Prettier + `npm run build` clean. Live write deliberately not run (would mutate the real layer).
- **Open**: `video` keyword unconfirmed against the survey's video question; 25 MB client cap; hand-link test on oid 41 pending.
- **Files changed**: `hub-app/src/lib/forms.js`, `hub-app/src/routes/forms/[slug]/+page.server.js`, `hub-app/src/routes/forms/[slug]/+page.svelte`, `hub-app/src/routes/forms/[slug]/photos/[globalId]/+page.server.js` (new), `hub-app/src/routes/forms/[slug]/photos/[globalId]/+page.svelte` (new), `opencode-docs/AGENTS.md`

## 2026-09-24 (photo updater — staged submit)

- **Follow-up**: the first cut uploaded/removed immediately on picking a file — no submit. Reworked to a staged flow: picking a file or toggling Remove only updates local `pending`/`removed` state (image previews via `URL.createObjectURL`); one **Save changes** button applies all ops (replace = delete slot's existing attachments + add; removals = `deleteAttachments`), then `invalidateAll()`. Save is disabled until there are changes; shows an op-count progress bar + per-slot validation messages.
- **Card tightened**: page 760px, slot padding `0.75rem 0.9rem`, 44px thumbs, smaller type, `Empty`/buttons scaled down.
- **Verified**: autofixer clean, prettier clean, `npm run build` clean; SSR on `:5173` shows the disabled "Save changes" button, Photo 1 with its existing `ram-test-photo.png`, other slots empty.
- **Files changed**: `hub-app/src/routes/forms/[slug]/photos/[globalId]/+page.svelte`, `opencode-docs/AGENTS.md`

## 2026-09-24 (photo updater — confirmation screen)

- **Follow-up**: replace the inline "Saved." with a completion screen after a successful submit — "The photos are submitted to row `<globalId>` (label). You can go back to all records." plus a **Back to all records** link and an "Add or remove more photos" button (resets `done`). The slots/actions are wrapped in `{#if done}…{:else}`.
- **Bug caught while doing it**: the submit loop counter was `let done = 0`, shadowing the new `done` state — `done = true` assigned the local, so the confirmation would never render. Renamed to `step`.
- **Verified**: autofixer clean, prettier clean, `npm run build` clean; SSR shows the form + disabled "Save changes" (no "Photos submitted" yet).
- **Files changed**: `hub-app/src/routes/forms/[slug]/photos/[globalId]/+page.svelte`, `opencode-docs/AGENTS.md`

## 2026-09-24 (photo updater — video is a file question)

- **Clarified**: Survey123 has no video question type — the video lives in a generic **file** question. So the keyword is whatever that file question is named (still unconfirmed; code uses `'video'`).
- **Caps/validation**: video slot now capped at **10 MB** (was 25 MB) and restricted to known video formats — `VIDEO_TYPES` (mp4/quicktime/x-m4v/webm/x-msvideo/x-matroska/mpeg) or `VIDEO_EXT` (mp4, mov, m4v, webm, avi, mkv, mpeg, mpg) whitelist via `isVideo(file)`; file input `accept` lists those exts. Hint reads "MP4, MOV, M4V, WEBM · up to 10 MB".
- **Verified**: autofixer clean, prettier clean, `npm run build` clean; SSR shows the new video hint.
- **Files changed**: `hub-app/src/routes/forms/[slug]/photos/[globalId]/+page.svelte`, `opencode-docs/AGENTS.md`

## 2026-09-24 (photo updater — video keyword confirmed)

- **Resolved**: the video slot's keyword is `short_video` — the XLSForm **`name`** of the "Short video" file question (Survey123 matches attachments by question `name`, not label). Updated `forms.js` (was the placeholder `'video'`) and the label to "Short video".
- **Files changed**: `hub-app/src/lib/forms.js`, `opencode-docs/AGENTS.md`

## 2026-09-25 — Group-layer summaries + layer logging + px→rem

- **Group-layer summary**: AGOL group layers can be saved as "Group Layer" items carrying a portal `snippet`. Natural Treasures' Protected Lands group (`19dca4b8b42-layer-16`) now references item `d5ee129f6f9f477194721b2cda6f8049` (type `Group Layer`, snippet "This group layer is the container for all protected lands layers…"). `SectorSidebar` loads group metadata when the accordion is first opened (`loadLayerInfo(group, true)` — new `force` param skips the visibility guard) and renders `.group-detail` (summary + description) if present. Groups without an `itemId` render nothing. Verified the portal item via the REST API; did **not** capture a headless Playwright run (user aborted that detour — the app is visible to them and needs WebGL).
- **Layer logging (diagnostic, removed)**: temporarily added logging to `extractMapPanelData.js` and `ArcGISMap.svelte` to dump the raw Esri layer tree (final form: only group layers, nested JSON from both `LayerListViewModel.operationalItems` and `view.map.layers`, with `title/id/type/visible/loadStatus/childCount/snippet/summary/description/portalItem*/keys`). **Removed once done** — the code is back to its original state (only the pre-existing `console.warn` on extraction failure remains).
- **px→rem conversion**: audited all CSS (~236 px across 14 `.svelte`; none in JS). Converted dimension/spacing properties (width/height/min/max, margin, padding, gap, border-radius, offsets, flex-basis, grid templates, `--panel-width`) to rem ÷16. Left in px intentionally: hairlines (`1px`/`1.5px`/`2px`/`999px`), borders/outline, `box-shadow`, `transform` offsets, `letter-spacing`, `font-size`/`line-height`, `clamp(...vw...)` font values, and `@media` breakpoints. Visual-neutral at the 16px root; enables mobile scaling via root `font-size`. One inline JS grid dimension (`forms/[slug]` template) converted too. Prettier + `npm run build` clean.
- **Files changed**: `hub-app/src/lib/components/SectorSidebar.svelte`, `hub-app/src/lib/map/extractMapPanelData.js`, `hub-app/src/lib/components/ArcGISMap.svelte`, all 14 `.svelte` files with CSS px, `hub-app/src/routes/forms/[slug]/+page.svelte` (JS grid), `opencode-docs/AGENTS.md`

## 2026-09-25 — Figma MCP hover variants (Resource Library cards)

- **Diagnosis (why hover was missed)**: the `figma_*` MCP tools were configured (`~/.config/opencode/opencode.jsonc`) and the Dev Mode server answered (v1.0.0 at `127.0.0.1:3845/mcp`) but were **not loaded** in the session. Even loaded, `get_design_context(instance)` returns only the **current variant** as static markup — hover states are separate variant symbols. `get_motion_context` is keyframe-motion only (returned `{"nodes":[]}` for the cards) and does **not** expose variant/prototype smart-animate transitions; transition timing/easing is not available via MCP at all. Probed the server with raw JSON-RPC (`tools/list`, `tools/call`) instead.
- **Inventory**: `resource library cards` frame `2578:35776` → component set `resource-library-card-v2` `3823:99596` with 12 rest + 12 `*-hover` variants. `sector-map-*-button` sets also carry `Default`/`Variant2`/`Variant3`.
- **Hover deltas**: card background darkens (RG `#f68a46`→`#fe8538`, NT `#a9b54d`→`#93a221`, TI `#33a5b9`→`#008fa8`, CP `#81749a`→`#6b588e`, neutral `#c0c0b9`→`#a5a5a5`) and the go-to arrow changes from a right arrow (→) to `arrow-down-right` rotated -90° (↗). No transform/shadow delta in the design variants.
- **Implemented**: added `hover` to `sectors.js` + `NEUTRAL`; `ResourceCard.svelte` cross-fades/rotates the arrow and transitions `background-color`; new asset `src/lib/assets/icons/arrow-down-right.svg`; global timing vars `--anim-duration`/`--anim-ease` on `:root` in `+layout.svelte`. Kept the existing lift/shadow hover (user likes it). autofixer + prettier + `npm run build` clean.
- **Files changed**: `hub-app/src/lib/sectors.js`, `hub-app/src/lib/components/ResourceCard.svelte`, `hub-app/src/routes/+layout.svelte`, `hub-app/src/lib/assets/icons/arrow-down-right.svg` (new), `opencode-docs/AGENTS.md`

## 2026-09-25 — Designer "Design edits" board: Montserrat, sidebar radios/copy/header

- **Source**: designer's to-do section `4117:85564` ("Design edits: to do list"), plus the copy frames `sector-map-1-T+I` `3816:123343` and `Sector map: NTA-PAD` `4058:74379`, radio components `radio-button-selector-check-{green,rg,cp,ti}`.
- **Montserrat**: `app.html` now loads Montserrat (300–900); all `'Source Sans 3'` strings replaced. Supersedes the old intentional-deviation decision (KB + figma-variables updated).
- **Sidebar** (`SectorSidebar`): header text white→black (icon no longer inverted); radios 18px→24px and active state now sector-coloured (outer = sector button shade, dot black; off = white + `#c7c7c7` dot; hover = sector shade at 40% via `color-mix`); `--sector-button` passed from `store.js` → `maps/[id]` → sidebar; sidebar bg `#faf9f9`→`#fff`; dividers `#ccc`→`#c4c4c4`; new bold `question` line from Figma for NT + T+I.
- **HeaderNav**: removed the logo's vertical divider (`border-right`).
- **Colour audit**: sector colours, header `#ecece8`, page `#e0e0d9`, neutral `#c0c0b9`, radio dot `#c7c7c7`, card hovers all match Figma. Open delta = sidebar meta/legend text greys vs design black-ish.
- **Verified**: autofixer (only pre-existing `@html`/plain-Set/effect-subscription flags), prettier, `npm run build` clean; `/`, `/resources`, both sector map routes return 200 on the user's `:5173`. Sidebar copy can't be curl-verified (map route SSR disabled) — checked in browser. (Started a stray dev server on :5174 by mistake; it exited, only user's :5173 remains.)
- **Files changed**: `src/app.html`, `src/lib/store.js`, `src/routes/+layout.svelte`, `src/lib/components/HeaderNav.svelte`, `src/lib/components/SectorSidebar.svelte`, `src/routes/maps/[id]/+page.svelte`, `opencode-docs/AGENTS.md`, `opencode-docs/figma-variables.md`

## 2026-09-25 — Design edits round 2: accordion states, landing hovers, nav colours

- **Accordion (sidebar)**: confirmed against `nta-topic-protected-lands` `2681:47624` + full NTA sidebar `4058:74383` — **open header bg = `#d6d6ce`** (neutral background/1, not a sector tint), **hover = sector tint (sector/40)**, closed white. Replaced the computed `groupBg()` with CSS `.group-header` / `.open` / `.open.cross` / `:hover`. Header padding `0.5rem 1rem`, `min-height: 3.25rem`, title `22px`. Replaced `+`/`−` text with the design `open-close-20` SVGs (`accordion-open.svg` = `+`, `accordion-close.svg` = `×`).
- **`sectors.js`** gained `tint` (sector/40) and `rowHover` (landing row hover: RG `#fc7520`, NT `#93a221`, TI `#008fa8`, CP `#625181`); plumbed through `store.js`/map page (`--sector-tint`) and the landing rows (`--row-bg`/`--row-hover`).
- **Landing**: sector rows now darken on hover (previously only the arrow button brightened); all go-to arrows cross-fade + rotate → to ↗ like the resource cards.
- **HeaderNav**: per-item hover/active colours (Regional Activity `#ffdc7c`/`#ffc425`; Resource Library `#66bccb`/`#33a5b9`; Data Access `#a197b3`) replacing the single grey hover and blue active. "Pull-down" (sector dropdown) items were already bold 900 — left as-is.
- **Verified**: prettier clean, `npm run build` clean, user's `:5173` serves `/`, `/resources`, both sector maps (200); landing SSR shows the new `--row-hover` vars + `go-arrow-hover`. Sidebar copy/accordion are client-only (SSR off) — check in browser.
- **Files changed**: `src/lib/sectors.js`, `src/lib/store.js`, `src/routes/maps/[id]/+page.svelte`, `src/lib/components/SectorSidebar.svelte`, `src/lib/components/HeaderNav.svelte`, `src/routes/+page.svelte`, new `src/lib/assets/icons/accordion-open.svg` + `accordion-close.svg`, `opencode-docs/AGENTS.md`

## 2026-09-25 — Fluid type: px→rem fonts + root font-size breakpoints

- **Problem**: font sizes were px (left that way in the earlier px→rem pass), so on <1200px viewports the 1600px-authored type looked oversized — fixed px doesn't scale with the viewport.
- **Fix**: converted font sizes px→rem in the design-driven files (`routes/+page.svelte`, `routes/resources/+page.svelte`, `HeaderNav`, `ResourceCard`, `SectorSidebar`); clamp min/max terms converted to rem (vw middle kept), `--search-font` `1.4vw + 10px` → `1.4vw + 0.625rem`. Added root scale in `+layout.svelte`: `html` 16px base, **14px ≤1200px**, **12px ≤900px**. Removed the redundant HeaderNav `@media(900px)` font override. Layout dims are already rem, so the whole design scales proportionally (design 1200 variant ≈0.89×; our 1200 step is 0.875×).
- **Verify**: `npm run build` clean; built CSS contains `@media (width<=1200px){html{font-size:14px}` and `@media (width<=900px){html{font-size:12px}`; `/`, `/resources`, `/maps/natural-treasures` 200 on `:5173`.
- **Tune**: the two breakpoint values in `+layout.svelte` are the ramp control.
- **Files changed**: `src/routes/+layout.svelte`, `src/routes/+page.svelte`, `src/routes/resources/+page.svelte`, `src/lib/components/HeaderNav.svelte`, `src/lib/components/ResourceCard.svelte`, `src/lib/components/SectorSidebar.svelte`, `opencode-docs/AGENTS.md`

## 2026-09-25 — Remove Esri map focus border (real cause)

- The blue border around the map pane is **not** a normal CSS `outline` on the view element — my earlier `.esri-view:focus{outline:none}` couldn't work. The SDK paints it on a pseudo-element using a custom property (found in `@arcgis/core/assets/esri/themes/light/main.css`):
  `.esri-view{--esri-view-outline-color:var(--calcite-color-brand);--esri-view-outline:2px solid var(--esri-view-outline-color)}` and `.esri-view .esri-view-surface:focus:after{outline:var(--esri-view-outline);...}`.
- **Fix** in `ArcGISMap.svelte`: scope `--esri-view-outline: none; --esri-view-outline-color: transparent;` on `.map :global(.esri-view)`. Lesson: when the SDK draws a ring, grep its theme CSS for the selector/variable instead of guessing element-level `outline`.
- Also earlier: global `:focus{outline:none}` + `:focus-visible` black ring + `-webkit-tap-highlight-color:transparent` in `+layout.svelte` for HTML elements.
- **Files**: `src/lib/components/ArcGISMap.svelte`, `src/routes/+layout.svelte`

## 2026-09-25 — Follow-up: esri focus border override hardened

- Made the ArcGISMap focus-ring override `!important` on all three SDK variables (`--esri-view-outline-color`, `--esri-view-outline`, `--esri-view-outline-offset`). Verified the emitted bundle contains `.map.svelte-90khid .esri-view{...!important}` (specificity 0,2,0 > SDK's 0,1,0). If the blue line persists after this, it's a stale cached theme CSS (hard refresh) or a different `--calcite-color-brand` source. Files: `src/lib/components/ArcGISMap.svelte`.

## 2026-09-25 — esri focus border: root cause (class is on the container)

- The SDK adds `esri-view` to the **container element itself**: `container.classList.add("esri-view")` (confirmed in `@arcgis/core/views/DOMContainer.js`). So `.map` **is** `.esri-view` — a `.map .esri-view` descendant selector never matches. This is why the first two overrides appeared in the CSS but did nothing.
- Final fix (ArcGISMap.svelte): global `:global(.esri-view){--esri-view-outline-color:none!important;--esri-view-outline:none!important;--esri-view-outline-offset:0!important}` **plus** `:global(.esri-view .esri-view-surface:focus::after){outline:none!important}`. Verified emitted in the build.

## 2026-09-30 — Landing 1-2-3 cards: titles aligned

- **Ask**: cards 2/3 titles differed in spacing/type from card 1; card 1 correct, match the others and align.
- **Change** (`src/routes/+page.svelte`): shared `.sector-head, .card h2` base rule (flex/center, `padding: 0.25rem 0.75rem`, `min-height: 3.5rem`, `1.25rem/22px` 700) so all three titles use identical type + left inset. `.card` lost its `padding`/`gap`; content wrapped in `.card-body` (`padding: 1rem 0.75rem`, gap 1rem). The `<hr>` under each yellow-card title was dropped in favour of `.card h2 { border-bottom: 1px solid #000 }`, which sits at the same y as card 1's header/row divider.
- **Verified**: autofixer clean, prettier clean, `:5173` returns 200. Visual check in browser (SSR-only, client render).

## 2026-09-30 — 400 baseline, resource-card meta labels + go-to arrows

- **Font weight baseline**: user asked that all site text default to 400 unless a component specifies otherwise. In `+layout.svelte`, `html/body` gained `font-weight: 400` and the blanket `h1–h6 { font-weight: 900 }` became `400`. Every explicit component weight (600/700 etc.) is untouched. Headings with no explicit weight now render 400 (e.g. `regional-activity` h1, both `/forms` h1s, `MapLayerPanel` h2).
- **Resource card meta labels**: `.meta-label` (Date / Last updated / Sector / Author) 600 → 700 in `ResourceCard.svelte`.
- **Resource card go-to (Figma `4155:76211` hover `↗` / `4155:76212` rest `→`, both 32×32 with a 20×20 arrow)**: per user, "no bg colour, just the icon and size". Removed the coloured button — `.go-btn` is now a bare 20×20 (`1.25rem`) box at bottom-right with no background/border/radius; both arrows are `1.25rem × 1.25rem` (rest `go-to.svg`, hover `arrow-down-right.svg` rotated `-90deg`). Removed the now-unused `--card-button` custom prop, `d.button`, and `NEUTRAL.button`.
- **Verified**: autofixer + prettier clean, `:5173/resources` 200.

## 2026-09-30 (later) — Resource card go-to: proper square arrow, border, stable size

- **Problem**: the resource-card unhovered arrow was the wide `go-to.svg` (34.75×20) force-fit into a square, so it looked stretched; the hover arrow swelled/shifted and pointed down.
- **Fix**: added `src/lib/assets/icons/arrow-right.svg` (the user-supplied 20×20 `viewBox` → arrow, no `preserveAspectRatio="none"`). `ResourceCard.svelte` now imports that one asset for **both** states (dropped `go-to.svg`/`arrow-down-right.svg` here). `.go-btn` is an explicit `2rem × 2rem` box at bottom-right with `border: 1px solid #000` + `border-radius: 0.5rem` (border, rounded, no fill). Arrows are absolutely centred at `1.25rem`; hover rotates the same arrow `-45deg` (→ becomes ↗, up-right), so the box never changes size and there is no jump.
- **Verified**: autofixer + prettier clean, `:5173/resources` 200. Landing still uses the old `go-to.svg`/`arrow-down-right.svg` — untouched.

## 2026-09-30 (arrow animation) — single rotating arrow

- Resource-card go-to is now **one** `arrow-right.svg` icon; hover animates its rotation `0 → -45deg` (→ becomes ↗) via `transform` transition instead of cross-fading two stacked icons. Removed `.go-arrow-rest` / `.go-arrow-hover` and the opacity rules.
- Verified: autofixer + prettier clean, `:5173/resources` 200.

## 2026-09-30 (sector map header) — header matches Figma `header/NTA`

- **Figma** `4124:106523` (`header/NTA`, 508 wide): sector-colour band, `padding: 9px 12px 16px`; row = 48px sector icon + 30px/36 bold title + 28px `open-close` × at the right; 10px gap; then question 24px/26 bold with 12px bottom margin; description 20px/26 regular.
- **`SectorSidebar.svelte`**: dropped the `mapPin` icon and the "Sector Map" suffix; new `sectorIcon` prop renders the 48px sector icon; title 30px bold; question 24px bold; description 20px weight 400; added a top-right `header-toggle` (reuses `accordion-open.svg`, `class:open` rotates 45° → ×) that collapses/expands the question + description (`introCollapsed` `$state`). Header `border-bottom` removed (the first group's black top border is the divider).
- **Wiring**: `store.js` `sectorDefaults.*.icon` from `sectors.js`; `maps/[id]/+page.svelte` passes `sectorIcon`.
- **Cleanup**: deleted the now-unused `src/lib/assets/icons/icon/map-pin.png` (and the empty `icon/` dir).
- **Verified**: prettier clean, `npm run build` clean, `/maps/natural-treasures` + `/resources` 200. Client-rendered — check in browser.

## 2026-09-30 (legend alias) — use web-map fieldConfiguration alias

- **Report**: on `/maps/natural-treasures`, the River Access layer's legend heading showed `display_category` (the column name).
- **Root cause**: the unique-value renderer's `field1` is `display_category`; the *service* field alias is also `display_category` (useless). The web map stores a better alias in `layerDefinition.fieldConfigurations` — `display_category` → **"River Access Type"** — which the app wasn't reading.
- **Fix** (`fetchSublayerMetadata.js` `fetchLayerVisualFieldAlias`): prefer `layer.getFieldAlias(fieldName)` (which returns the web-map fieldConfiguration alias, falling back to the field alias) before the raw field name.
- **Verified**: prettier clean; web-map JSON + service REST inspected to confirm the alias. No per-layer "legend title" exists in the web map — the fieldConfiguration alias is the intended source.

## 2026-09-30 (legend line preview fix) — Esri preview SVG had no viewBox

- **Report**: the Hiking Trails legend symbol on `/maps/natural-treasures` rendered as a dot.
- **Check**: it *is* a line layer — service `trails_county_name_added` has `geometryType: esriGeometryPolyline`; renderer is `simple` in both service and web map. The web map overrides the symbol to `esriSLS` / `style: esriSLSShortDot` / `color [88,140,2]` (`#588c02`) / width 1.5. So it's a **dotted line**, not a dot, and not dashed.
- **Root cause (app bug, affects all layers)**: `symbolUtils.renderPreviewHTML(symbol, {size:16})` returns an SVG with `width`/`height` but **no `viewBox`** (line preview is 50×22, marker 22×22). The sidebar CSS `.legend-symbol svg { width:1.2rem; height:1.2rem }` resizes the viewport without a viewBox, so the content doesn't scale — the 50×22 line gets cropped to its leftmost dot. Verified headlessly (chrome `--dump-dom`) against a temp route.
- **Fix** (`extractMapPanelData.js`): new `withSvgViewBox(element)` derives `viewBox="0 0 <w> <h>"` from the intrinsic size when absent (skips if already present). Applied to `symbolToHtml` and the `rampItem` previews (color/relationship/pie ramps). Marker previews are unaffected (22×22 → identity viewBox).
- **Verified**: headless dump shows `viewBox="0 0 50 22"` for the dot line and `0 0 22 22` for the marker; temp route removed; prettier clean.

## 2026-09-30 (hide simple-renderer legends)

- **Ask**: if a layer uses a *simple* renderer (no categories/gradation), hide its legend — a lone unlabeled swatch looks ugly.
- **Fix** (`extractMapPanelData.js`): new `isSimpleRendererLayer(layer)` (`renderer.type === 'simple'`). Skipped in the LegendViewModel loop, in the missing-layers fallback loop, and `legendFromRenderer` now returns `[]` for simple renderers (removed the single-symbol item). Categorical/gradation legends (`unique-value`, `class-breaks`, `heatmap`) still render.
- **Supersedes** the earlier "show simple-renderer legends (`items.length > 0`)" decision — e.g. the lone Trucking Companies swatch is now hidden.
- **Verified**: prettier clean.

## 2026-09-30 (sidebar detail typography) — match Figma sizes

- **Figma** `4187:113813` sidebar (group "Biodiversity & Habitat" open). Measured: group intro/detail = `18px` / lh `25px` / 400 (Montserrat); layer description = `16px` / lh `1.35` / 400; legend labels `16px`.
- **`SectorSidebar.svelte`**: `.group-summary` + `.group-description` 0.85/0.82rem → **1.125rem (18px)** / lh 1.4 / black; group-detail padding `0.5rem 1rem 0.75rem`. `.layer-description` 0.82rem → **1rem (16px)** / lh 1.35 / black.
- **Verified**: prettier clean. Client-rendered — check in browser.

## 2026-09-30 (chart title as HTML)

- **Ask**: render the chart title as an HTML element above `<arcgis-chart>` (read from the chart config), and hide the in-chart copy. Confirmed the user wants a *visible* HTML title, not sr-only.
- **Finding**: Hiking Trails chart (`1a0a1fa3578-layer-95`) has `title.content.text = "Miles of trails by county"` but `title.visible = false`; the visible caption is `footer.visible = true` with the **same text**. So hiding only the title would leave the footer duplicating it.
- **Fix** (`LayerChart.svelte`): reads `config.title.content.text` into reactive `chartTitle`; renders `<p class="chart-title">` above the chart; passes a shallow-cloned model with `title.visible = false` and, when the footer text equals the title text, `footer.visible = false` (avoids the duplicate; empty/different footers are left alone). Title styled `1.125rem/600`.
- **Verified**: autofixer + prettier + `npm run build` clean. Chart render itself needs WebGL2 (can't verify headlessly) — check in browser.

## 2026-09-30 (custom popups) — Figma `4191:115989`

- **Ask**: custom map popup; bg = sector header colour. Arcade question: kept Esri's engine so Arcade + field formats still apply.
- **Decision**: custom Svelte shell (design control) + Esri's `Feature` widget for content (Arcade/format). NT layers rely on Arcade heavily (Stream health 13 `expressionInfos`, Protected Lands 2, etc.), so a raw-attributes popup was ruled out.
- **Figma**: `4191:115989` is just the shape rect — 304×118, rounded 12px, down tail, fill `#bec77a` (NT button shade). Per the user, bg uses the **sector header colour** (`sector.color`) instead.
- **Impl**: `mapStore.js` gains `mapPopup` writable (`{feature, location}`); cleared in `clearMapState`. `ArcGISMap.svelte` takes `accentColor`, sets `view.popupEnabled = false`, and on `view.on('click')` hit-tests, picks the first result whose layer has a popupTemplate, attaches the layer template to the graphic if missing, and sets `mapPopup`. `MapPopup.svelte` (new) positions itself via `view.toScreen(location)` (repositions on `stationary`/`zoom`/`size`/`rotation`, flips below near the top, clamps x), renders the sector-coloured rounded box + CSS tail + bold HTML title + close, and hosts an Esri `Feature` widget (`visibleElements.title=false`) for the formatted content. `maps/[id]/+page.svelte` passes `accentColor={sector?.color ?? '#a9b54d'}`.
- **Verified**: autofixer + prettier + `npm run build` clean, map route 200. Runtime popup needs WebGL2 (can't verify headlessly) — check a feature click in the browser.

## 2026-09-30 (popup content fit)

- `MapPopup.svelte`: `.popup` is now a flex column with `max-height: 70vh`; `.popup-content` is `flex:1; min-height:0; overflow-y:auto` → long features scroll.
- Scoped Esri resets: `.popup-content :global(.esri-widget){ background-color: transparent !important; box-shadow:none !important; --esri-widget-padding-x:0; --esri-widget-padding-y:0; padding:0 !important }` and `.popup-content :global(.esri-feature__content-element){ padding:0 }`.
- **Note (not done)**: `.esri-widget` also sets `font-family: Avenir Next…` and `font-size:14px`, so the content still renders in Avenir at 14px rather than Montserrat/16px — flag if we want to override.
- Verified: prettier + `npm run build` clean.

## 2026-09-30 (popup: pan, height, font)

- **Pan lag**: the popup only repositioned on `view.stationary`, but during a drag the map is moved by a CSS transform so `view.toScreen` is stale → the popup sat at the old spot and jumped on release. Now watch `view.interacting`: hide the popup while interacting, reposition on release (`class:visible={shown && !interacting}`).
- **Height**: `.popup` `max-height: 250px` (was 70vh); content scrolls.
- **Widget reset fix**: the Esri `Feature` widget makes our `.popup-content` element its `.esri-widget` root, so a descendant `:global(.esri-widget)` rule never matched it (hence background stayed `#fff`). Resets now sit on `.popup-content` itself: `background-color: transparent !important`, `padding: 0 !important`, `--esri-widget-padding-x/y: 0`, and `font-family: 'Montserrat'` (also on any nested `.esri-widget`).
- Verified: prettier + `npm run build` clean.

## 2026-09-30 (popup: white + green stroke)

- Tried the alternative style: `.popup` now `background: #fff` (panel white) with `border: 2px solid var(--popup-color)` (the map/sector accent). Tail switched from a filled CSS-border triangle to a **rotated square** (`::after`, 1rem, `rotate(45deg)`, only the two outward edges stroked) so the green outline stays continuous with the box; the `.below` variant strokes top/left instead.
- Verified with a standalone headless render (temp HTML, chrome screenshot): box + tail outline connect cleanly, above and below variants. prettier + build clean.

## 2026-09-30 (map pan/zoom constraints)

- Added `src/lib/map/region.js` → `regionExtent` (WGS84 extent of the Thrive region).
- `ArcGISMap.svelte` MapView now gets `extent: regionExtent` (opens there) and `constraints: { geometry: regionExtent, minScale: 1_000_000, maxScale: 2000, rotationEnabled: false }` (can't pan outside or zoom past, no rotation). `minScale`/`maxScale` are placeholders to tune by eye.
- The existing `zoomToSecondaryBoundary` still runs (goTo of the boundary layer full extent, clamped to REGION since the boundary extent is slightly larger). If we want to drop that zoom and just use REGION, remove `defaultExtent`/`secondaryBoundaryExtent`.
- Verified: prettier + `npm run build` clean.

## 2026-09-30 (popup follows pan)

- The popup only moved on `view.stationary` (and the earlier `interacting` hide made it wait for pan-end). Now it tracks the pan 1:1: `view.on('drag', …)` records the pointer at `start` and shifts `pos` by the pointer delta on each `update`, then snaps to the true `view.toScreen` on `end` / `stationary`. Removed the `interacting` state/hide and the `!interacting` class toggle.
- Verified: autofixer + prettier + build clean. Needs a browser check.

## 2026-09-30 (resource link viewer)

- Cards previously opened `rest_api_url` in a new tab. Added `src/routes/resources/[id]/+page.svelte`: looks the tool up by `page.params.id` (globalid) in `page.data.approvedTools`, renders the site nav (layout) + a full-bleed `<iframe src={rest_api_url}>`. `.viewer { height: calc(100vh - 3.75rem); display:flex }` and the iframe `flex:1` fill all remaining space (nav is 3.75rem, same assumption as `MapPageLayout`).
- `ResourceCard.svelte`: `d.id = clean(a.globalid)`; the card now links to `/resources/{id}` (no `target="_blank"`).
- **Caveat**: many `rest_api_url` targets are external (Experience Builder, Dashboards, StoryMaps, Google Drive, PDFs). Some (notably Google Drive) send `X-Frame-Options`/CSP and will refuse to render in an iframe — server-side, not fixable here. Consider an "open in new tab" fallback.
- Verified: autofixer + prettier + `npm run build` clean.

## 2026-09-30 (viewer fallback link)

- `/resources/[id]`: added a slim bar above the iframe — tool title + "Open in new tab ↗" (`target="_blank" rel="noopener noreferrer"`) for resources that refuse framing. `.viewer` is now a flex column; the iframe `flex:1; min-height:0` still fills the rest.
- Verified: prettier + build clean.

## 2026-09-30 (viewer: Drive embedding)

- `/resources/[id]`: Google Drive `/file/d/<id>/view` sends `x-frame-options: SAMEORIGIN` so it can't be framed (Drive showed an access error). Added `embedUrl()`: rewrites `drive.google.com/file/d/<id>/…` → `/file/d/<id>/preview` and `docs.google.com/{document|spreadsheets|presentation}/d/<id>/…` → `…/preview`; the iframe uses `embedSrc`, while the "Open in new tab" link keeps the original URL.
- Verified: curl shows `/view` has `x-frame-options: SAMEORIGIN`, `/preview` does not; prettier + build clean.
- Caveat: `/preview` only renders if the file is shared publicly. If a file is restricted, it'll still ask for access — that's a sharing setting, not code.

## 2026-10-01 (landing About copy)

- Figma MCP tools were missing from the session again; probed the Dev Mode server directly (`POST http://127.0.0.1:3845/mcp`, initialize → session id → `tools/call` `get_design_context`/`get_screenshot` for `4271:120671`).
- `routes/+page.svelte` `.about` copy replaced to match: kept "About the Resource Hub" h2, "Find everything you need in one place" (now weight 500) + the 3 bullets; then new "How to use the hub" subhead (24/32 bold), intro line, and a 4-item ordered list. Removed the old hr + "Other information" + `Nam pulvinar…` filler. Added `.about-subhead` (1.5rem/32/700), `.about-body` + `ol` (1.125rem/28), ol padding; removed the dead `hr`/`p:not(.about-lead)` rules.
- **Not done**: the design's right column is a map image (Rectangle 425, 492px, radius 12, drop shadow); the yellow `.about-placeholder` is still there. Asset lives on the Figma MCP localhost — pull + save to the repo if we want it.
- Verified: prettier + `npm run build` clean.

## 2026-10-01 (landing About image)

- Answered the /static question: kept to the project convention, `src/lib/assets/`. Pulled the Figma asset (served as `.png` but it's actually a JPEG, 3543×3543, by Sara Eichner) and saved it as `src/lib/assets/about-map.jpg`.
- `routes/+page.svelte`: replaced the yellow `.about-placeholder` with `<img class="about-image">` (width 100%, height 30.75rem/492px, radius 0.75rem, `object-fit: cover`, `box-shadow: 0 4px 2px rgba(0,0,0,.25)`). About grid now `minmax(0, 35.875rem) 1fr` (574px text col + flexible image col, matching the Figma 574 + 32 gap + flexible). ≤900px collapses to one column, image `18rem`.
- Verified: prettier + build clean.

## 2026-10-01 (fluid line-heights + About tweaks)

- **Bug**: landing/most text used `line-height` in `px` while `font-size` is in `rem`. Root steps 16→13px below 1600px, so fonts shrank but line-heights didn't → text ran ~25% taller than the design. Converted the remaining 13 `line-height: Npx` values to `rem` (22→1.375, 26→1.625, 28→1.75, 32→2, 48→3) across `+page.svelte`, `ResourceCard.svelte`, `resources/+page.svelte`. **Supersedes** the earlier "line-heights left in px intentionally" note.
- About: `li` line-height set explicitly to `1.75rem`; `.about` padding `3rem 0 6rem` → `3rem 0`.
- Verified: prettier + build clean.

## 2026-10-01 (Protected Lands "Related Resource" banner)

- Hard-coded a banner in `SectorSidebar.svelte`, shown only inside the group whose title matches `/protected\s*lands/i` (the Protected Lands group on `/maps/natural-treasures`), at the end of the open group content (full-bleed within the panel).
- Figma `4219:116201` (via the raw Dev Mode MCP probe — the session had no figma tools): just the banner rect, 508×51, fill `#81749a` (secondary/purple/80). Text node wasn't exposed; matched the screenshot — white bold "Related Resource: " + underlined **Interactive Conservation Index** link (`https://www.thriveregionalpartnership.org/`, new tab) + a white `arrow-right.svg` (black icon recoloured via `filter: brightness(0) invert(1)`).
- Note: banner uses the Figma purple, which is also the Community Prosperity colour — say if it should be the sector colour instead.
- Verified: prettier + build clean.

## 2026-10-01 (sidebar tweaks + banner move)

- `.legend-heading`: `font-weight` 600 → **400** (same size as the legend items below, `1rem`).
- `.group-detail`: removed the bottom border; padding → `0.75rem 1rem`.
- Moved the Related Resource banner out of the group level into the **Protected Lands layer item** (`{#if layer.visible && /protected\s*lands/i.test(layer.title)}`), so it shows only when that layer is on; `.related-resource` gets `margin: 0 -1rem` to stay full-bleed inside `.layer-item`'s padding.
- Verified: prettier + build clean.
