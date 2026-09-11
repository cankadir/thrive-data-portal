# Thrive Data Portal — Project Context

This file is self-maintaining. When you make a significant architectural decision, append it below. Do not ask for permission. Just update the file. When a decision is superseded or no longer relevant, remove it. Do not leave zombie decisions.

## Overview

Thrive Regional Data Hub portal (`hub-app/`). Svelte 5 + SvelteKit app with ArcGIS integration for maps, resources, and regional data. Lives alongside data notebooks (`PY/`, `landuse/`, `stakeholder-map/`) in a monorepo.

## Architecture Decisions

- **Framework**: Svelte 5 with runes mode forced in `svelte.config.js`
- **ArcGIS**: `@arcgis/core` via ES modules (no CDN/AMD). Excluded from Vite optimizeDeps.
- **Maps**: Dynamic route `/maps/[id]` with SSR disabled. Map IDs and layer config in `src/lib/store.js`.
- **Resources page**: Fetches approved tools from ArcGIS FeatureServer (Hub_Data_Submission_-_Approved_Items).
- **State**: Svelte writable stores (`store.js`, `mapStore.js`). No external state libs.
- **Components**: Presentational; logic in stores/modules (`extractMapPanelData.js`, `fetchSublayerMetadata.js`).
- **Svelte conventions**: Use `$props()` (not `export let`), `onclick` (not `on:click`), `{@render children()}` (not `<slot>`), `{@attach}` (not `use:action`), `$state` for local reactive state, `get(store)` in script (not `$storeName`).
- **Fonts**: `Source Sans 3` (Google Fonts) — weights 300, 400, 600, 900 loaded in `app.html`. Fallback `sans-serif`. Replaces Museo Sans (previous design choice).
- **Avoid**: `$effect` where a top-level assignment or `$derived` suffices; unnecessary spread patterns with `$state` (direct mutation works).

## Files reviewed (2026-07-20)

All hub-app Svelte files reviewed with autofixer. Clean:

| File | Status |
|------|--------|
| `+layout.svelte` | Fixed — removed unnecessary `$effect` |
| `+page.svelte` (landing) | Clean |
| `maps/[id]/+page.svelte` | Clean |
| `resources/+page.svelte` | Fixed — added each-block key |
| `regional-activity/+page.svelte` | Clean |
| `ArcGISMap.svelte` | Clean (uses `{@attach}`) |
| `MapLayerPanel.svelte` | Clean |
| `SectorSidebar.svelte` | Fixed — `get()` instead of `$store` in script, simplified `$state` mutations |
| `MapPageLayout.svelte` | Clean |
| `Accordion.svelte` | Clean |
| `LegendAccordion.svelte` | Clean (expected `$effect` for async metadata load) |
| `store.js` | Clean |
| `mapStore.js` | Clean |
| `storeLinks.js` | Clean |
| `extractMapPanelData.js` | Clean (complex ArcGIS logic, acceptable verbosity) |
| `fetchSublayerMetadata.js` | Clean (with caching, acceptable verbosity) |

## Architecture Decisions (2026-07-22)

- **Auth for ArcGIS layers**: `identityManager.dialog = null` set at module level in `extractMapPanelData.js` to suppress ArcGIS IdentityManager auth dialogs. Public-facing app should never prompt for credentials.
- **Map load strategy**: `await webmap.load()` removed — MapView created immediately with unloaded WebMap. MapView handles loading internally, removing a sequential network round-trip.
- **No `map.loadAll()`**: Eager layer loading removed from `extractLayers` and `extractMapPanelData`. Layers load naturally via MapView. Avoids triggering auth dialogs and redundant N network requests.
- **Deferred legend**: `extractLegendLazy()` exported as separate fire-and-forget call. Legend rendering (symbol preview HTML) no longer blocks initial map render.
- **Zoom to extent**: `zoomToExtent(view, layerTitle)` helper in `ArcGISMap.svelte` finds a layer by title, loads it, and calls `view.goTo(fullExtent)`. Used for "Thrive County Boundaries" reference layer.

## Active Areas

- `hub-app/src/routes/maps/[id]/+page.svelte` — main interactive map page with sidebar
- `hub-app/src/lib/components/ArcGISMap.svelte` — core map component
- `hub-app/src/lib/components/MapLayerPanel.svelte` — layer toggle + legend
- `hub-app/src/lib/components/SectorSidebar.svelte` — sector-specific sidebar
- `hub-app/src/lib/map/extractMapPanelData.js` — layer/legend extraction; auth suppression; reactive watcher

## Architecture Decisions (2026-08-31)

- **Effective layer visibility**: The app reads/writes *effective* layer visibility, not the raw per-layer flag. Esri group layers cascade visibility to children — a child of an off group is not drawn even if its own `visible` is true. `flattenOperationalItems`/`walkMapLayers` compute `visible = layer.visible && ancestorVisible`. `setMapLayerVisibility` turns on ancestor groups when enabling a layer so the toggle actually shows it on the map. Keeps sidebar radio buttons in sync with what the map renders.
  - **Known real-world case**: The Natural Treasures webmap (`aba702c5420e4a36ac645f14a00ba8f1`) has group layers with `visibility: false` whose *children* are `visible: true` (e.g. `Water Resources` group off → Stream health / Brownfield / Superfund children on; `Protected Lands` group off → two children on). Without the effective-visibility logic, the app's radios showed those children as ON while the map never drew them — only Regional Trails (+ reference layers) actually rendered.
  - **Preferred map setup (user)**: Keep all group layers visible in ArcGIS and control visibility per leaf layer. The UI never toggles groups (groups are expand/collapse headers in `SectorSidebar`). The effective-visibility code is inert when all groups are on (a no-op safety net for future webmaps that have off groups).

## Architecture Decisions (2026-09-04)

- **Resources page redesign + AI search**: `ResourceCard.svelte` component renders approved tools as small cards (Figma card language scaled down: rounded 18px, offset drop-shadow, colored top panel + neutral bottom panel). Single sector → top panel in that sector color with auto white/black text by luminance; multiple sectors → neutral white/grey top with per-sector colored chips. All fields driven by data with `{#if}` guards; whole card is an `<a href={rest_api_url}>`.
- **AI search**: `POST /api/search-resources` calls DeepSeek (`deepseek-v4-flash`, JSON mode) to rank the tool catalog by relevance and return a short reasoning. Uses `reasoning_effort: 'low'` (v4 thinking mode is on by default at `high`; `low` is plenty for a ~15-item ranking). **Env access**: use `$env/static/private` and import the var directly (`import { DEEPSEEK_API_KEY } from '$env/static/private'`). `$env/dynamic/private` only exports an `env` object, and named imports only work with the static module. (`deepseek-chat` is deprecated — use `deepseek-v4-flash`.) Thinking mode ignores `temperature`/`top_p`/penalties, so don't send them.
- **Session context**: cookie-backed (`thrive_search_session`) in-memory per-tab session stores the catalog as fixed system context on first call; follow-up queries reuse the thread ("only the natural ones"). History pruned to last 20 turns. Server restarts reset memory (page transparently re-sends `tools`). No DB — memory-per-tab is intentional.
- **Out-of-context guard**: if a query is unrelated to regional planning / the catalog, DeepSeek returns `{"ids": [], "reasoning": "Query out of Context", "outOfContext": true}`. The page shows a banner and keeps the default grid. Server always appends any ids the model omitted so cards never disappear.
- **Sidebar data-column alias**: In `SectorSidebar`, a layer's legend block is now titled by the alias of the field it renders (e.g. Protected Lands 2026 renders `Pub_Access` → legend header "Public Access"), falling back to "Legend". The "Summary" heading was removed (description text retained). New `fetchLayerVisualFieldAlias()` in `fetchSublayerMetadata.js` reads the live layer's renderer `field1`/`field` and resolves the alias via `layer.fields`. Visualized-field knowledge is where future sidebar charts will plug in.

## Architecture Decisions (2026-09-11)

- **Landing page (`/`)** — **correct frame `3820:96886`**: Figma `landing-page-2`. (The file contains **two** frames named `landing-page-2`; `3799:122467` is an older duplicate and was implemented by mistake first. Always use the URL's node id and pull a screenshot of that exact node.) Page bg `#e0e0d9`, 1144px column, hero teal `#008fa8`. The 1‑2‑3 row has step headers (order: sectors / activity / library) in a fixed **77px** row (`step-head`), then three **equal-height** (273px) cards: **Sector Profile Maps** card (yellow header + 4 sector rows, each a link to `/maps/[id]` with a go-to arrow button), **Regional Activity Map** card → `/regional-activity`, **Resource library** card → `/resources`; each yellow card has a title, divider and a bottom-right go-to arrow. Sector row colors RG `#f68a46`, NT `#a9b54d`, TI `#33a5b9`, CP `#81749a` with button shades `#f8a16b`/`#bec77a`/`#66bccb`/`#a197b3`; sector icons are the design SVGs in `src/lib/assets/icons/sector/`. The **About section is a full-width yellow band** (`#ffc425`, black top/bottom border) with a `#ffd051` placeholder card; tagline purple `#625181` right-aligned; footer uses the color `thrive-logo-color.svg`. Vertical rhythm: each block gets top padding and ~2× that at the bottom (1‑2‑3 `32px 0 64px`; About and tagline `48px 0 96px`). Fonts Source Sans 3.
- **Figma frame-name collision gotcha**: the Thrive file has two frames both named `landing-page-2` (`3799:122467` old, `3820:96886` current). Frame names are not unique — resolve by node id from the URL and verify with `get_screenshot` before implementing, otherwise you build the wrong design.
- **`approvedTools` store removed**: `+layout.js` still returns `approvedTools`, but `resources/+page.svelte` now reads it via `page.data.approvedTools` (a `$derived`) instead of a writable store. Removed the store and the layout's store-sync `$effect` (which also triggered the `state_referenced_locally` warning).
- **HeaderNav redesign (Figma `3836:102832`, "Variant2")**: Lighter bg `#ecece8` with a 1px black outer border and a single divider between logo and buttons (no lines between buttons). Items are **fixed 255.75px** (`flex: 0 1 255.75px`, shrink-only) so the text/gap ratio matches the design and stays put whether or not the home button renders. Four items: Regional Activity Map → `/regional-activity`, **Sector Maps** (hover dropdown, always labelled "Sector Maps"), Resource Library → `/resources`, Data Access (placeholder — no route yet, `preventDefault`). Sector dropdown order/colors: Responsible Growth `#f68a46`, Transportation + Infrastructure `#33a5b9`, Community Prosperity `#81749a`, Natural Treasures `#93a221`; the active sector color is applied to the "Sector Maps" toggle on `/maps/[id]`. Home icon is the black `home_circle_line_black` (inline SVG), hidden on `/`. Logo: color `thrive-logo-color.svg` on `/`, BW `thrive-logo.png` elsewhere; links to `https://www.thriveregionalpartnership.org/` in a new tab. Verified against the design by rendering headless Chromium at 1600px (item centers within ~2px of Figma). Fonts use Source Sans 3 (18px, weight 600/900; 14px at ≤900px). **Dropdown folding**: `.dropdown-item` inherits `white-space: nowrap` from `.nav-item` (the `.nav-sector` wrapper carries that class), which made long labels ("Transportation + Infrastructure") overflow — fixed with `white-space: normal` + `overflow-wrap: break-word` and `min-height` instead of a fixed `height`. The logo container is `flex: 0 1 clamp(250px, 32%, 50%)` + `min-width: 250px` (32% of the nav, so it grows with the viewport on wide screens; floors at 250px; 50% is a safety cap); nav labels have no `white-space: nowrap` so they can wrap and the buttons compress at narrow widths. Nav items carry no per-item padding — a small `padding: 0 8px` sits on the `.nav-items` container instead, so buttons can sit close when compressed.
- **Landing footer**: full-bleed divider + logo with a 12px side inset (`.footer { padding: 32px 12px 48px }`), not constrained to the 1144px `.wrap` column.
- **Deployment branch gotcha (Vercel)**: `main` (repo default branch → Vercel production) contains `hub-app/src/routes/**` but **no `hub-app/src/lib/**`** — all `$lib` code lives only on feature branches (e.g. `web-style-transfer`). Building `main` fails with `UNLOADABLE_DEPENDENCY` / "No such file or directory (os error 2)" for `$lib/store`, `$lib/components/MapPageLayout.svelte`, etc. Before deploying, merge the feature branch into `main` (or set Vercel's Production Branch to the feature branch).

## Figma Design Variables

Design tokens from the Thrive Figma file are documented in `opencode-docs/figma-variables.md`. Always consult this file when implementing UI components to use correct colors and typography. When the Figma MCP server returns variable names, cross-reference them against this file.

### Color convention

Variable names follow `category/shade/tone` (e.g. `primary/green/100`, `neutrals/60`). 100 = base, 80/60/40/20 = lightened.

### Font note

Figma uses **Museo Sans** (headings/body) and **EB Garamond** (serif/display). The app uses **Source Sans 3** instead — this is intentional. Map variable names to Source Sans 3 equivalents when implementing.
