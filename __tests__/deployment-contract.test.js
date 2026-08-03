/**
 * @jest-environment node
 *
 * Executable deployment contract for Julienne's canonical HTML tools.
 */
const fs = require('fs')
const path = require('path')

const ROOT = path.join(__dirname, '..')

describe('Julienne source-of-truth deployment contract', () => {
  let sync

  beforeAll(() => {
    sync = require('../scripts/sync-julienne-tools')
  })

  it('selects the highest numbered source file for every maintained tool', () => {
    const selected = sync.resolveContracts(ROOT)

    expect(selected.map(({ source }) => path.basename(source))).toEqual([
      'circuit_diagram_creatorv4.html',
      'circuit diagram secjc v3.html',
      'cube_solid_generator_refined_v3.html',
    ])
  })

  it('keeps deployed files byte-for-byte aligned after required integration hooks are added', () => {
    for (const contract of sync.resolveContracts(ROOT)) {
      const canonical = fs.readFileSync(contract.source, 'utf8')
      const deployed = fs.readFileSync(contract.destination, 'utf8')

      expect(deployed).toBe(sync.decorateTool(canonical, contract.toolId))
    }
  })

  it('preserves exactly one metrics identity and tracker hook in every deployed file', () => {
    for (const contract of sync.resolveContracts(ROOT)) {
      const deployed = fs.readFileSync(contract.destination, 'utf8')
      expect(deployed.match(/<meta name="tool-id"/g)).toHaveLength(1)
      expect(deployed).toContain(`<meta name="tool-id" content="${contract.toolId}" />`)
      expect(deployed.match(/<script src="\/tracker\.js"><\/script>/g)).toHaveLength(1)
    }
  })
})
