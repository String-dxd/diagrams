# Dev Log — Diagrams

## Stack

| Concern | Choice |
|---------|--------|
| Framework | Next.js 14 (App Router) on Vercel |
| Database | NeonDB (Postgres) via `@neondatabase/serverless` |
| Styling | Tailwind CSS |
| Analytics | GA4 (traffic/performance) + NeonDB (product metrics) |
| Auth | None — `/metrics` is unlisted but unprotected for now |

---

## Tools

Three tools served as static HTML files from `/public/tools/`. Not migrated to React — preserves editability for non-technical co-coder. The only required change to each HTML file is one `<meta>` tag and one `<script>` tag at the bottom.

| Tool | HTML file | Route |
|------|-----------|-------|
| Circuit Symbol Diagram | `circuit_diagram_creator.html` | `/tools/circuits` (symbol tab) |
| Circuit Object Diagram | `object_circuit.html` | `/tools/circuits` (object tab) |
| Isometric Cube Generator | `isometric-cube-generator.html` (v2) | `/tools/isometric-cube` |

### Decision — Combined circuit view

A single `/tools/circuits` Next.js page renders **both circuit iframes simultaneously**, toggling visibility with CSS (`display: none` ↔ `block`). Both iframes stay mounted in the DOM at all times — switching tabs **preserves canvas state**. This fixes the state-loss bug in the old `circuit-diagram-suite.html`.

### Decision — Suite wrapper retired

`circuit-diagram-suite.html` removed from the index and archived as `_archive/circuit-diagram-suite.html`. The combined Next.js page supersedes it cleanly.

### Decision — Electromagnet integration (Option B)

`electromagnet_creator.html` (standalone file from co-coder) **not added as a 4th tool**. Instead, the electromagnet is added as a draggable component inside both circuit tools (symbol and object modes), alongside battery, bulb, and switch.

**Coil rendering fix:** original standalone used `fill: none` on the rod rect, causing flat look. Fixed draw order: back coil arches → rod rect (white fill) → front coil arches. Gives correct 3D wrap illusion.

Coil count is configurable per component (like battery cell count), range 4–20.

---

## Metrics Design

### User identity
Random UUID generated on first visit, stored in `localStorage` under key `diag_uid`. No login. Resets on storage clear (accepted tradeoff).

### Tracked event
`diagram_exported` — fires when user clicks the **Download PNG** button in any tool.

### Rate limit
1 recorded event per UUID per tool per **5 minutes**, enforced server-side. Excess events return 200 silently.

### NeonDB schema

```sql
CREATE TABLE IF NOT EXISTS users (
  uuid      TEXT PRIMARY KEY,
  first_seen TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  last_seen  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS events (
  id         SERIAL PRIMARY KEY,
  user_uuid  TEXT NOT NULL REFERENCES users(uuid),
  tool       TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS events_tool_created ON events(tool, created_at);
CREATE INDEX IF NOT EXISTS events_user_tool    ON events(user_uuid, tool, created_at);
```

**Valid `tool` values:** `circuit-symbol` | `circuit-object` | `isometric-cube`

### Metrics dashboard
Route: `/metrics` — server component, queries NeonDB at render time.

Sections:
1. **Aggregate** — all-time unique users, all-time exports, this month's exports, this month's unique exporters (MAU)
2. **Per-tool** — same four metrics per tool

MAU definition: unique UUIDs with ≥1 export event in the current calendar month.

### GA4
Placeholder Measurement ID: `G-XXXXXXXXXX`. Replace with real ID in `.env.local`:
```
NEXT_PUBLIC_GA_ID=G-XXXXXXXXXX
```

---

## Tracker injection

Each HTML tool file gets two additions (co-coder must not remove these):

```html
<!-- In <head>: identifies the tool for the tracker -->
<meta name="tool-id" content="circuit-symbol" />

<!-- Before </body>: loads shared tracking script -->
<script src="/tracker.js"></script>
```

`/public/tracker.js` handles UUID management and PNG-button click detection. Single file, shared across all tools.

---

## Environment Variables

```
DATABASE_URL=              # NeonDB connection string
NEXT_PUBLIC_GA_ID=G-XXXXXXXXXX  # GA4 Measurement ID (replace when ready)
```

---

## Tests

Run with `npm test`. 20 tests across 3 suites, all passing.

### What is tested and why

| Suite | File | What it covers | Why it matters |
|-------|------|----------------|----------------|
| API route | `__tests__/api/event.test.ts` | Input validation (missing uuid, missing tool, unknown tool, malformed JSON), rate-limit silencing, happy-path 3-query flow, all 3 valid tool names | Core business logic — if this breaks, events are silently lost or the DB is hit unsafely |
| Tracker | `__tests__/tracker.test.js` | UUID created on first visit, UUID reused on return, fetch fired for each of the 3 export button IDs, no-op when tool-id meta is absent | The tracker is injected into HTML files that non-technical co-coder edits — catching regressions here is important |
| Index page | `__tests__/pages/index.test.tsx` | Both tool cards render, correct hrefs, footer credit and string.sg link present | Smoke test to catch accidental deletion of cards or wrong routes |

### Known gaps (not tested)

- **`/metrics` page** — requires a live NeonDB connection or a more involved mock. Not worth the complexity for now; validate manually after deploy.
- **Circuit/cube HTML tools** — the diagram canvas logic (wire snapping, component placement, export) is not unit-tested. Would require a full browser environment (Playwright/Cypress). Log here if regressions become a problem.
- **Combined circuit view** (`/tools/circuits`) — iframe CSS show/hide behaviour is not tested. The state-preservation fix is architectural (both iframes stay mounted); can be validated manually in the browser.
- **Rate limiting under load** — the 5-minute window is tested via mock, but actual DB timing is not. Acceptable for current scale.

---

## Changelog

| Date | Description |
|------|-------------|
| 2026-03-24 | Project scaffolded. Next.js + NeonDB + Tailwind. dev.md created with full architecture decisions. |
| 2026-03-24 | Tests added: API route (8 tests), tracker.js (7 tests), index page (5 tests). All 20 passing. |
| 2026-05-01 | Isometric cube v2 deployed: preview overlay before download, toggle Front/Side mapping, export direction-label toggle. tracker.js updated with new button IDs (`downloadIsoFromPreviewBtn`, `downloadViewsFromPreviewBtn`). 14 new tests in `isometric-cube.test.js`. |

---

## Bug Tracker

| ID | Status | Description | Notes |
|----|--------|-------------|-------|
| B001 | Fixed | Circuit suite iframe state loss on tab switch | Fixed by rendering both iframes simultaneously, toggling with CSS display:none |
| B002 | Fixed | Electromagnet coil flat rendering (no depth) | Fixed draw order: back arches → rod (white fill) → front arches |
| B003 | Reverted | Electromagnet integration removed from circuit tools | Symbol style did not match required exam format (hatched steel rod + stacked cell symbols). To be redesigned before re-integrating. |

---

## Planned: Co-contributor Push Automation

### Problem
JulesWyrm (co-contributor) pushes raw HTML tool additions/enhancements directly. These changes need Next.js wiring (new page, `tool-id`, tracker meta, tests) before they are production-ready. Currently this wiring is done manually after noticing her push.

### Goal
Automate detection, notification, and issue creation whenever JulesWyrm pushes, so nothing falls through the cracks.

### Design

**Trigger:** GitHub Actions workflow on `push` to any branch.

**Job 1 — Notify**
- Check if any commit author in the push is `JulesWyrm`
- If yes, call Beeper API to send a push notification to Kahhow

**Job 2 — Auto-issue (runs only on JulesWyrm pushes)**
- Generate a diff of her changes using the full push range (`${before}..${after}`), not just the last commit; if `before` is all zeros (new branch), handle that case separately so the diff still covers everything introduced by the push
- Send the diff to Claude API (Anthropic) with a structured prompt that checks for:
  - New HTML files in `public/tools/` → needs a Next.js page + `tool-id` added to `VALID_TOOLS`
  - Missing `<meta name="tool-id">` or `<script src="/tracker.js">` in any HTML file
  - New tool → needs Jest test suite added under `__tests__/canvas/`
  - Changes to existing canvas logic → flag tests may need updating
- Claude returns a structured issue body (markdown) summarising what changed and what wiring is needed
- Open a GitHub Issue via `gh issue create --assignee "@copilot"` so Copilot automatically attempts the wiring and opens a PR

**Why Claude for analysis, Copilot for implementation:**
Claude handles open-ended diff analysis and writing the issue spec. Copilot handles the mechanical Next.js wiring (creating page files, adding tool-id, etc.) once given a clear spec.

**Secrets required:**
- `ANTHROPIC_API_KEY` — for Claude diff analysis
- `BEEPER_*` — Beeper API auth (TBD once API docs confirmed)
- `GITHUB_TOKEN` — already available in Actions

**Status:** Planned — not yet implemented.
