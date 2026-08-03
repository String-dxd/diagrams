/**
 * @jest-environment node
 */
const fs = require('fs')
const path = require('path')

const ROOT = path.join(__dirname, '..')

describe('release guardrails', () => {
  it('serves the required browser security headers on every route', async () => {
    const { default: config } = await import('../next.config.mjs')
    const rules = await config.headers()
    const headers = Object.fromEntries(rules[0].headers.map(({ key, value }) => [key, value]))

    expect(rules[0].source).toBe('/:path*')
    expect(headers).toMatchObject({
      'X-Content-Type-Options': 'nosniff',
      'X-Frame-Options': 'SAMEORIGIN',
      'Referrer-Policy': 'strict-origin-when-cross-origin',
      'Permissions-Policy': 'camera=(), microphone=(), geolocation=()',
    })
    expect(headers['Content-Security-Policy']).toContain("default-src 'self'")
    expect(headers['Content-Security-Policy']).toContain("frame-ancestors 'self'")
    expect(headers['Content-Security-Policy']).toContain("object-src 'none'")
  })

  it('disables unchecked Vercel Git deployments from main', () => {
    const vercel = JSON.parse(fs.readFileSync(path.join(ROOT, 'vercel.json'), 'utf8'))
    expect(vercel.git.deploymentEnabled.main).toBe(false)
  })

  it('uses a push trigger rather than a scheduled deployment', () => {
    const workflow = fs.readFileSync(
      path.join(ROOT, '.github/workflows/julienne-deploy.yml'),
      'utf8'
    )

    expect(workflow).toMatch(/^  push:/m)
    expect(workflow).not.toMatch(/^  schedule:/m)
    expect(workflow).toContain('npm run sync:check')
    expect(workflow).toContain('npm run test:ci')
    expect(workflow).toContain('npm run security:audit')
    expect(workflow).toContain('semgrep scan')
    expect(workflow).toContain('github/codeql-action/analyze@v4')
    expect(workflow).toContain('vercel deploy --prebuilt --prod')
  })
})
