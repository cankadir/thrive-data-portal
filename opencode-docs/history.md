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
