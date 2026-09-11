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
