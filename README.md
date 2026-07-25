# Diagram Tools

Teaching tools for creating clean, exportable diagrams. Built for Singapore educators — no installation required for end users.

## Tools

| Tool | Route | Level | Description |
|------|-------|-------|-------------|
| Circuit Diagrams (Pri) | `/tools/circuits` | Pri | Symbol and object-style circuit diagrams. Export as PNG. |
| Circuit Diagrams (Sec/JC) | `/tools/circuits-secjc` | Sec/JC | Extended components: transistor, transformer, potentiometer, LED, and more. Export as PNG. |
| Water Tank Diagram Generator | `/tools/water-tank` | Pri/Sec | Customisable water tank diagrams with adjustable dimensions and water levels. Export as PNG. |
| Isometric Cube Builder | `/tools/isometric-cube` | Pri (PSLE) | Build 3D cube structures and auto-generate top, front, and side orthogonal views. Export as PNG. |

The primary school circuit tool has two modes (toggle without losing your work):
- **Symbol** — standard schematic symbols for worksheets
- **Object** — realistic apparatus style for apparatus diagrams

## Metrics

Visit `/metrics` to see PNG export counts per tool, all-time and for the current month.

Metrics use an anonymous browser UUID (no login). Only PNG exports are counted.

## Running locally

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

Open [http://localhost:3000](http://localhost:3000).

## Database setup

Run `lib/schema.sql` once against your NeonDB instance.

**Option A — Neon dashboard:**
1. Go to [console.neon.tech](https://console.neon.tech) → SQL Editor
2. Paste and run the contents of `lib/schema.sql`

**Option B — psql:**
```bash
psql $DATABASE_URL -f lib/schema.sql
```

## Releases and CI/CD

`main` is the production branch. The CI/CD workflow runs the Jest suite, a production
build, and CodeQL SAST on every pull request to `main` and every `main` push. A
successful `main` run then deploys the prebuilt production artifact to Vercel.

### Uploading a new tool version

Julienne should create a branch and pull request for each upload. The approved upload
location is `public/tools/`; replace the deployed tool's existing canonical file there
rather than adding a new `v4` filename. Routes and tests reference the canonical names,
so this makes a validated merge deploy the new version automatically. For example, an
updated primary circuit suite replaces:

- `public/tools/circuit_pri_suitev2.html`
- `public/tools/circuit_diagram_creatorv3.html`
- `public/tools/object_circuitv3.html`

Use the pull request title and Git history to record the supplied version (for example,
`Circuit builder v4`). Preserve the required `tool-id` meta tag and `/tracker.js` script
when replacing a tool. Do not commit uploads outside `public/tools/`; move retired
source copies to `_archive/` only when they are needed for reference.

### One-time GitHub and Vercel setup

1. Create a Vercel project linked to this repository and configure its production
   `DATABASE_URL` and `NEXT_PUBLIC_GA_ID` environment variables.
2. In GitHub repository **Settings → Secrets and variables → Actions**, add:
   - `VERCEL_TOKEN` — a Vercel token authorized for the project.
   - `VERCEL_ORG_ID` — the Vercel team or personal account ID.
   - `VERCEL_PROJECT_ID` — the Vercel project ID.
3. In GitHub repository **Settings → Environments**, create a `production`
   environment and restrict deployment approval to the intended release maintainers if
   manual production approval is desired.
4. In GitHub repository **Settings → Rules → Rulesets**, add a ruleset targeting
   `main` that requires pull requests before merging, requires the `quality` and
   `sast` status checks to pass, requires branches to be up to date, and blocks force
   pushes and deletion. Restrict bypass permission to repository administrators.

After that setup, Julienne opens a PR, confirms the `quality` and `sast` checks pass,
and merges it. The merge triggers the Vercel deployment; direct, unvalidated uploads
to `main` are blocked by the ruleset.

## Editing the HTML tools

The diagram tools live in `public/tools/` as standalone HTML files. You can edit them directly — no React knowledge needed.

Two things in each file must not be removed:

```html
<!-- In <head> — identifies the tool for metrics tracking -->
<meta name="tool-id" content="circuit-symbol" />

<!-- Before </body> — loads the tracking script -->
<script src="/tracker.js"></script>
```

Valid `tool-id` values: `circuit-symbol`, `circuit-object`, `circuit-secjc`, `water-tank`, `isometric-cube`.

## Project structure

```
app/
  page.tsx                          # Index — links to all tools
  layout.tsx                        # Root layout with GA4, favicons, OG image
  tools/
    circuits/page.tsx               # Pri circuit view (symbol + object toggle)
    circuits-secjc/page.tsx         # Sec/JC circuit view
    water-tank/page.tsx             # Water tank wrapper
    isometric-cube/page.tsx         # Isometric cube wrapper
  metrics/page.tsx                  # Metrics dashboard
  api/event/route.ts                # POST endpoint — records PNG exports
lib/
  db.ts                             # NeonDB connection (lazy)
  schema.sql                        # Run once to create DB tables
public/
  tools/                            # HTML tool files (edit freely)
    circuit_pri_suitev2.html        # Pri circuit shell (symbol/object toggle)
    circuit_diagram_creatorv2.html  # Pri symbol mode
    object_circuitv2.html           # Pri object mode
    circuit_diagram_secjc.html      # Sec/JC circuit tool
    water_tank_generator.html       # Water tank tool
    isometric-cube-generator.html   # Isometric cube tool
  tracker.js                        # Shared tracking script
  og-image.jpg                      # OpenGraph preview image
```

## Stack

- [Next.js 14](https://nextjs.org) — framework
- [Vercel](https://vercel.com) — hosting
- [NeonDB](https://neon.tech) — Postgres for metrics
- [Tailwind CSS](https://tailwindcss.com) — styling
- [Google Analytics 4](https://analytics.google.com) — traffic analytics

---

Created by Julienne, supported by [string.sg](https://string.sg)
