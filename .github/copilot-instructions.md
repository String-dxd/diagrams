# Copilot Instructions

## Project Overview

Diagram tools for primary school educators — standalone HTML canvas tools served via a Next.js 15.5 (App Router) host on Vercel. No installation required for end users.

### Tools

| Tool | Route | HTML file |
|------|-------|-----------|
| Circuit Symbol Diagram | `/tools/circuits` (symbol tab) | `public/tools/circuit_diagram_creatorv3.html` |
| Circuit Object Diagram | `/tools/circuits` (object tab) | `public/tools/object_circuitv3.html` |
| Circuit Diagram (Sec/JC) | `/tools/circuits-secjc` | `public/tools/circuit_diagram_secjcv2.html` |
| Isometric Cube Builder | `/tools/isometric-cube` | `public/tools/isometric-cube-generator.html` |

## Stack

| Concern | Choice |
|---------|--------|
| Framework | Next.js 15.5 (App Router) |
| Hosting | Vercel |
| Database | NeonDB (Postgres) via `@neondatabase/serverless` |
| Styling | Tailwind CSS |
| Analytics | GA4 (traffic) + NeonDB (product metrics) |
| Testing | Jest + ts-jest + Testing Library |

## Project Structure

```
app/
  page.tsx                  # Index — links to all tools
  tools/
    circuits/page.tsx       # Combined circuit view (symbol + object tabs)
    isometric-cube/page.tsx # Isometric cube wrapper
  metrics/page.tsx          # Metrics dashboard
  api/event/route.ts        # POST endpoint — records PNG exports
  layout.tsx                # Root layout with GA4
lib/
  db.ts                     # NeonDB connection (lazy)
  schema.sql                # Run once to create DB tables
public/
  tools/                    # HTML tool files (edit freely)
  tracker.js                # Shared tracking script
__tests__/                  # Jest test suites
_archive/                   # Retired files
```

## Key Conventions

### Julienne's canonical HTML tool files

For the primary symbol, Sec/JC, and isometric tools, the highest matching versioned root file is the source of truth. Run `npm run sync:tools` to generate the stable `public/tools/` destination. Never hand-edit the generated destination.

Mappings are encoded in `scripts/sync-julienne-tools.js` and enforced by `__tests__/deployment-contract.test.js`.

### HTML Tool Files (`public/tools/`)

Every HTML tool file **must** include both of the following — do not remove them:

```html
<!-- In <head>: identifies the tool for metrics tracking -->
<meta name="tool-id" content="<tool-id>" />

<!-- Before </body>: loads shared tracking script -->
<script src="/tracker.js"></script>
```

Valid `tool-id` values: `circuit-symbol` | `circuit-object` | `circuit-secjc` | `water-tank` | `isometric-cube`

When adding a new tool, register a new unique `tool-id` value and update the API route's allowed list in `app/api/event/route.ts`.

### Circuit View — Tab Switching

The `/tools/circuits` Next.js page renders **both** circuit iframes simultaneously, toggling visibility with CSS (`display: none` ↔ `block`). Both iframes stay mounted in the DOM at all times — this preserves canvas state when switching tabs. Do not change this to unmount/remount iframes.

### Metrics and Rate Limiting

- One recorded event per UUID per tool per **5 minutes**, enforced server-side.
- The browser UUID is stored in `localStorage` under key `diag_uid`.
- Only PNG exports are counted (`diagram_exported` event).

### Environment Variables

```
DATABASE_URL=              # NeonDB connection string
NEXT_PUBLIC_GA_ID=         # GA4 Measurement ID (format: G-XXXXXXXXXX)
```

## Running Locally

```bash
npm install
```

Create `.env.local`:
```
DATABASE_URL=your_neon_connection_string
NEXT_PUBLIC_GA_ID=G-XXXXXXXXXX
```

```bash
npm run dev
```

## Testing

Run all tests:
```bash
npm test
```

Run the local release gates:
```bash
npm run verify
```

Pushes to `main` that touch canonical tools or application/deployment files trigger `.github/workflows/julienne-deploy.yml`. The event-driven workflow runs drift checks, Jest, npm audit, Semgrep, CodeQL, and a production build before deploying through Vercel. There is no polling or deployment cron.

### Test Suites

| Suite | File | What it covers |
|-------|------|----------------|
| API route | `__tests__/api/event.test.ts` | Input validation, rate-limit silencing, happy-path DB flow, all valid tool names |
| Tracker | `__tests__/tracker.test.js` | UUID lifecycle, fetch fired per export button, no-op when tool-id meta absent |
| Index page | `__tests__/pages/index.test.tsx` | Tool cards render, correct hrefs, footer present |

When adding a new tool or API change, add corresponding tests following the patterns in the existing test files.

## Database Setup

Run `lib/schema.sql` once against your NeonDB instance before first use.

Valid `tool` column values in the `events` table: `circuit-symbol` | `circuit-object` | `circuit-secjc` | `water-tank` | `isometric-cube`
