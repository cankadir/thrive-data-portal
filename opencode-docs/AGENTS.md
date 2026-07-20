# Thrive Data Portal — Project Context

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

## Active Areas

- `hub-app/src/routes/maps/[id]/+page.svelte` — main interactive map page with sidebar
- `hub-app/src/lib/components/ArcGISMap.svelte` — core map component
- `hub-app/src/lib/components/MapLayerPanel.svelte` — layer toggle + legend
- `hub-app/src/lib/components/SectorSidebar.svelte` — sector-specific sidebar
