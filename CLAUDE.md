# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm run dev       # Start local dev server at http://localhost:3000
npm test          # Run all Jest specifications
npm run build     # Production build
npm run verify    # Sync canonical tools, test, audit, and build
```

Run a single test file:
```bash
npx jest __tests__/api/event.test.ts
npx jest __tests__/tracker.test.js
```

## Environment

Requires `.env.local`:
```
DATABASE_URL=          # NeonDB (Postgres) connection string
NEXT_PUBLIC_GA_ID=G-XXXXXXXXXX  # GA4 Measurement ID
```

Database schema: run `lib/schema.sql` once against NeonDB to create `users` and `events` tables.

## Architecture

This is a **Next.js 15.5 App Router** project. The core tools are **standalone HTML files** — not React components. The Next.js layer provides routing, a thin iframe wrapper per tool, metrics tracking, and the home page index.

### Tool pattern

Each Next.js tool page (`app/tools/<name>/page.tsx`) renders a header with a back link and a full-viewport `<iframe>` pointing to the HTML file at `/tools/<filename>.html`. Julienne-managed tools use the versioned root files as canonical input; `npm run sync:tools` selects the highest version and generates the stable filename under `public/tools/` with its metrics hooks. Do not hand-edit those three generated copies.

Canonical mappings are defined and tested in `scripts/sync-julienne-tools.js`:
- `circuit_diagram_creatorv*.html` → `public/tools/circuit_diagram_creatorv3.html`
- `circuit diagram secjc v*.html` → `public/tools/circuit_diagram_secjcv2.html`
- `cube_solid_generator_refined_v*.html` → `public/tools/isometric-cube-generator.html`

**Every HTML tool file must include two things — do not remove them:**
```html
<!-- In <head> — identifies the tool for metrics -->
<meta name="tool-id" content="<tool-id>" />

<!-- Before </body> — loads shared tracking script -->
<script src="/tracker.js"></script>
```

Valid `tool-id` values (must match `VALID_TOOLS` in `app/api/event/route.ts`):
- `circuit-symbol` — primary school symbol circuit diagram
- `circuit-object` — primary school object circuit diagram
- `circuit-secjc` — Sec/JC circuit diagram
- `water-tank` — water tank diagram generator
- `isometric-cube`

New tools added to `public/tools/` also need a new `tool-id` added to `VALID_TOOLS`.

### Tool pages

- **`/tools/circuits`** — primary school; wraps `circuit_pri_suitev2.html`, which is a shell that hosts both `circuit_diagram_creatorv3.html` (symbol) and `object_circuitv3.html` (object) in iframes. The toggle lives in the suite HTML and switches views by changing CSS visibility, so both iframes remain mounted and canvas state is preserved per view.
- **`/tools/circuits-secjc`** — wraps `circuit_diagram_secjcv2.html`. 3-column layout with extended components (transistor, transformer, potentiometer, solenoid, LED, etc.).
- **`/tools/water-tank`** — wraps `water_tank_generator.html`. Depends on `tap.png` being co-located in `public/tools/`.
- **`/tools/isometric-cube`** — wraps the generated `isometric-cube-generator.html` (currently canonical v3). Features: preview overlay before download, toggle Front/Side mapping, and independent export dots/walls/direction-label settings.

Earlier root versions remain available as history, but the highest matching version is always the deployment source of truth.

### Metrics system

`public/tracker.js` is injected into every HTML tool. It:
1. Gets/creates a persistent anonymous UUID in `localStorage` (`diag_uid` key)
2. Attaches click listeners to `#exportBtn`, `#downloadBtn`, `#exportViewsBtn`, `#downloadIsoFromPreviewBtn`, `#downloadViewsFromPreviewBtn`
3. POSTs `{ uuid, tool }` to `/api/event` on export

`app/api/event/route.ts` validates the payload, applies a **5-minute rate limit per UUID+tool** via a DB query, then upserts the user row and inserts the event. Silent 200 on rate-limit hit.

`app/metrics/page.tsx` is a server component that queries NeonDB at render time — no auth, unlisted route.

### DB layer

`lib/db.ts` exports `getDb()` — a lazy singleton that initialises the Neon client on first call. The client is a tagged template literal (`sql\`...\``).

## Tests

Jest specifications in `__tests__/` cover:

**API & infrastructure**
- `api/event.test.ts` — API route: input validation, rate-limit behaviour, happy-path DB call sequence, all 5 valid tool names accepted. DB is mocked via `jest.mock('@/lib/db')`.
- `tracker.test.js` — tracker.js: UUID lifecycle, fetch fired per export button ID, no-op when `tool-id` meta is absent. Evaluated with `eval()` in jsdom.

**Pages**
- `pages/index.test.tsx` — smoke test: all 4 tool cards render with correct titles and hrefs.
- `pages/metrics.test.tsx` — async server component: aggregate stats, per-tool rows, zero defaults, DB error state. DB mocked via `jest.mock('@/lib/db')`.

**Canvas logic** (`__tests__/canvas/`)
- `circuit-symbol.test.js` — `snap`, `gcd`, `componentSize`, `getComponentNodes` from `circuit_diagram_creatorv3.html`. GRID=28, **COMPONENT_SCALE=0.8** (all component sizes multiplied by 0.8).
- `circuit-secjc.test.js` — same functions plus `rotatePoint` from `circuit_diagram_secjcv2.html`. GRID=22.4, includes transistor (3-node) and transformer (2-node) geometry.
- `object-circuit.test.js` — `rotatePoint`, `getLocalNodes`, `getComponentNodes` from `object_circuitv3.html`. **COMPONENT_SCALE=0.8** (battery/switch nodes), **BULB_SCALE=1** (bulb nodes unscaled).
- `water-tank.test.js` — IIFE-based script; tested via DOM events (`fireInput`/`fireChange`) and `svgWrap.innerHTML` inspection.
- `isometric-cube.test.js` — v3 cube tool; tests toggle front/side mapping, top-view rotation, preview overlay open/close (incl. Escape key), independent export settings (dots, walls, direction labels), and button label refresh. Canvas mocked via `HTMLCanvasElement.prototype.getContext`.

**Deployment specifications**
- `deployment-contract.test.js` — proves the highest versioned root files are selected, deployed copies are byte-for-byte generated output, and exactly one tool identity/tracker hook is present.
- `pages/index.test.tsx` — includes the immutable footer contract: `Created by Julienne, supported by string.sg` with the `https://string.sg` backlink.

**Canvas test pattern**: `__tests__/canvas/helpers.js` provides `loadCircuitScript` (eval-extracts functions from HTML) and `loadIifeScript` (eval-runs IIFE scripts). The helpers file is excluded from Jest test discovery via `testPathIgnorePatterns`.

**Key gotcha**: `snap(-10)` returns `-0` in JavaScript (IEEE 754); use `Math.abs(snap(-10))` or `toBeCloseTo` when asserting zero.
