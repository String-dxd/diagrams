/**
 * @jest-environment jsdom
 *
 * Tests for seed-dispersal-diagram.html.
 *
 * Part 1 — HTML structure: reads the generated file as a string and
 * checks that key DOM element IDs are present without executing the script.
 *
 * Part 2 — Pure utility functions: extracts the functions from the IIFE
 * body (stripping the outer arrow-function wrapper) and wraps them in a
 * plain function closure so individual helpers can be unit-tested.
 */

const fs = require('fs')
const path = require('path')
const { extractMainScript } = require('./helpers')

const FILENAME = 'seed-dispersal-diagram.html'
const html = fs.readFileSync(
  path.join(__dirname, '../../public/tools', FILENAME),
  'utf8'
)

// ---------------------------------------------------------------------------
// Helper: extract IIFE body and return named utility exports.
// The seed dispersal script is structured as (() => { 'use strict'; ... })()
// Strip the outer IIFE wrapper, then eval only up to the first DOM query
// that would fail (the block of named utility functions is self-contained).
// ---------------------------------------------------------------------------
function loadSeedUtils(exportNames) {
  const script = extractMainScript(FILENAME)

  // Strip the outer arrow-IIFE wrapper so we can wrap it ourselves.
  let body = script
    .replace(/^\s*\(\s*\(\s*\)\s*=>\s*\{/, '')
    .replace(/\}\s*\)\s*\(\s*\)\s*;?\s*$/, '')

  // Truncate before the top-level DOM event-listener wiring (the section
  // that starts with lines like `$('#...').addEventListener(...)` at the
  // outermost level of the IIFE body).  Everything above this point is
  // constant declarations and pure utility function definitions.
  const domSetupIdx = body.search(/\n {0,4}\$\('#[^']+'\)\.addEventListener/)
  if (domSetupIdx !== -1) body = body.slice(0, domSetupIdx)

  const returnExpr = `({ ${exportNames.join(', ')} })`
  // eslint-disable-next-line no-eval
  return eval(`(function () {\n${body}\nreturn ${returnExpr};\n})()`)
}

// ---------------------------------------------------------------------------
// Part 1 — HTML structure
// ---------------------------------------------------------------------------

describe('Seed Dispersal Diagram — HTML structure', () => {
  it('has the Practice export button (#exportPractice)', () => {
    expect(html).toContain('id="exportPractice"')
  })

  it('has the Creator export button (#exportCreator)', () => {
    expect(html).toContain('id="exportCreator"')
  })

  it('has the practice map stage (#practiceMap)', () => {
    expect(html).toContain('id="practiceMap"')
  })

  it('has the creator map stage (#creatorMap)', () => {
    expect(html).toContain('id="creatorMap"')
  })

  it('includes the tool-id meta tag', () => {
    expect(html).toContain('<meta name="tool-id" content="seed-dispersal" />')
  })

  it('includes the tracker script hook', () => {
    expect(html).toContain('<script src="/tracker.js"></script>')
  })
})

// ---------------------------------------------------------------------------
// Part 2 — Pure utility functions
// ---------------------------------------------------------------------------

describe('Seed Dispersal Diagram — utility functions', () => {
  let clamp, snap, distance, rectContainsPoint, rectsOverlap, parentsTooClose, GRID, MAP_W, MAP_H

  beforeAll(() => {
    ;({ clamp, snap, distance, rectContainsPoint, rectsOverlap, parentsTooClose, GRID, MAP_W, MAP_H } =
      loadSeedUtils(['clamp', 'snap', 'distance', 'rectContainsPoint', 'rectsOverlap', 'parentsTooClose', 'GRID', 'MAP_W', 'MAP_H']))
  })

  describe('constants', () => {
    it('GRID is 10', () => {
      expect(GRID).toBe(10)
    })

    it('MAP_W is 760', () => {
      expect(MAP_W).toBe(760)
    })

    it('MAP_H is 500', () => {
      expect(MAP_H).toBe(500)
    })
  })

  describe('clamp', () => {
    it('returns min when value is below range', () => {
      expect(clamp(-5, 0, 100)).toBe(0)
    })

    it('returns max when value exceeds range', () => {
      expect(clamp(200, 0, 100)).toBe(100)
    })

    it('returns value when within range', () => {
      expect(clamp(50, 0, 100)).toBe(50)
    })
  })

  describe('snap', () => {
    it('snaps 14 to 10 (nearest multiple of GRID=10)', () => {
      expect(snap(14)).toBe(10)
    })

    it('snaps 16 to 20', () => {
      expect(snap(16)).toBe(20)
    })

    it('snaps 0 to 0', () => {
      expect(Math.abs(snap(0))).toBe(0)
    })
  })

  describe('distance', () => {
    it('returns 0 for the same point', () => {
      expect(distance({ x: 5, y: 5 }, { x: 5, y: 5 })).toBe(0)
    })

    it('returns 5 for a 3-4-5 right triangle', () => {
      expect(distance({ x: 0, y: 0 }, { x: 3, y: 4 })).toBeCloseTo(5)
    })
  })

  describe('rectContainsPoint', () => {
    const rect = { x: 10, y: 10, width: 50, height: 40 }

    it('returns true for a point inside the rect', () => {
      expect(rectContainsPoint(rect, { x: 30, y: 25 })).toBe(true)
    })

    it('returns false for a point outside the rect', () => {
      expect(rectContainsPoint(rect, { x: 5, y: 5 })).toBe(false)
    })

    it('includes points within padding', () => {
      expect(rectContainsPoint(rect, { x: 5, y: 5 }, 10)).toBe(true)
    })
  })

  describe('rectsOverlap', () => {
    it('returns true for overlapping rects', () => {
      const a = { x: 0, y: 0, width: 50, height: 50 }
      const b = { x: 30, y: 30, width: 50, height: 50 }
      expect(rectsOverlap(a, b)).toBe(true)
    })

    it('returns false for non-overlapping rects', () => {
      const a = { x: 0, y: 0, width: 20, height: 20 }
      const b = { x: 100, y: 100, width: 20, height: 20 }
      expect(rectsOverlap(a, b)).toBe(false)
    })

    it('detects overlap introduced by padding', () => {
      const a = { x: 0, y: 0, width: 20, height: 20 }
      const b = { x: 30, y: 0, width: 20, height: 20 }
      expect(rectsOverlap(a, b, 15)).toBe(true)
    })
  })

  describe('parentsTooClose', () => {
    it('returns false when plants are far apart', () => {
      const plants = [
        { parent: { x: 0, y: 0 } },
        { parent: { x: 200, y: 200 } },
      ]
      expect(parentsTooClose(plants)).toBe(false)
    })

    it('returns true when two parent plants are closer than the minimum (46)', () => {
      const plants = [
        { parent: { x: 0, y: 0 } },
        { parent: { x: 20, y: 20 } },
      ]
      expect(parentsTooClose(plants)).toBe(true)
    })

    it('returns false for a single plant', () => {
      expect(parentsTooClose([{ parent: { x: 0, y: 0 } }])).toBe(false)
    })
  })
})
