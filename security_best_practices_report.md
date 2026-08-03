# Security best-practices report

## Executive summary

The application and its release path were reviewed for dependency, Next.js, React, API-input, browser-policy, and CI/CD risks. Four findings were remediated. The production dependency tree now reports zero known vulnerabilities, dangerous GA configuration interpolation was removed, API event input is strictly validated, and browser security headers plus two SAST gates are enforced. One low-severity hardening limitation remains because the standalone HTML tools currently require inline scripts and styles.

## Resolved findings

### SEC-001 — Vulnerable runtime and transitive dependencies (High, resolved)

- Evidence before remediation: `npm audit --json` reported 9 known vulnerabilities (7 high, 2 low), including the installed Next.js and transitive build/runtime packages.
- Remediation: Next.js and its Google integration are pinned to `15.5.22`; PostCSS and vulnerable transitive packages are pinned to patched releases in `package.json:21-50` and `package-lock.json`.
- Verification: `npm ci` and `npm run security:audit` both complete with `found 0 vulnerabilities`.

### SEC-002 — Unvalidated analytics ID interpolated into executable JavaScript (Medium, resolved)

- Evidence before remediation: `NEXT_PUBLIC_GA_ID` was interpolated into a `dangerouslySetInnerHTML` script in the root layout. A malformed deployment value could change executable script content.
- Remediation: `lib/analytics.ts:1-6` accepts only a narrowly defined GA4 measurement ID. `app/layout.tsx:31-37` passes the validated value to Next.js's maintained `GoogleAnalytics` component and no longer constructs executable script text.
- Verification: `__tests__/lib/analytics.test.ts` rejects placeholders, legacy IDs, URLs, and script-injection payloads.

### SEC-003 — Weak event API boundary validation (Medium, resolved)

- Evidence before remediation: the event endpoint accepted any truthy UUID and did not require a JSON content type.
- Remediation: `app/api/event/route.ts:5-23` requires `application/json`, a UUID v4 string, and a string from the existing tool allowlist before any database operation.
- Verification: `__tests__/api/event.test.ts` covers malformed JSON, non-JSON bodies, invalid UUID versions/variants/types, oversized input, unknown tools, rate limiting, and the valid path.

### SEC-004 — Missing browser security policy (Low, resolved)

- Evidence before remediation: `next.config.mjs` defined no response headers.
- Remediation: `next.config.mjs:1-39` applies a Content Security Policy, same-origin framing, MIME sniffing protection, a restrictive permissions policy, and a strict referrer policy to every route. Same-origin framing is intentionally retained because the application embeds its own tools in iframes.
- Verification: `__tests__/release-guardrails.test.js` asserts the complete header contract; production response headers are also checked after deployment.

## Continuous security gates

- `.github/workflows/julienne-deploy.yml:47-94` runs CodeQL, a pinned Semgrep release with local high-signal rules plus the Node.js ruleset, `npm audit`, all specifications, and a production build before deployment.
- `.semgrep.yml` blocks `eval`, the `Function` constructor, and `javascript:` URLs outside excluded test/archive paths.
- `vercel.json:3-6` disables unchecked direct Git deployment from `main`; only the verified prebuilt output is promoted.

## Residual hardening note

### SEC-005 — CSP permits inline scripts and styles (Low, open)

- Evidence: the canonical standalone HTML tools contain their application CSS and JavaScript inline, so `next.config.mjs` must currently include `'unsafe-inline'` for `script-src` and `style-src`.
- Impact: the CSP still restricts origins, objects, framing, forms, and connections, but it cannot fully mitigate a future HTML-injection bug inside these tools.
- Recommended follow-up: move each tool's inline JavaScript and CSS to same-origin static assets, then remove both `'unsafe-inline'` allowances or adopt per-response nonces/hashes. Current scans found no user-controlled path into the static `innerHTML`/SVG templates reviewed.
