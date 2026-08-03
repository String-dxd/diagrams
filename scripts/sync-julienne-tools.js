#!/usr/bin/env node

const fs = require('fs')
const path = require('path')

const TOOL_CONTRACTS = [
  {
    name: 'Primary circuit diagram',
    sourcePattern: /^circuit_diagram_creatorv(\d+)\.html$/,
    destination: 'public/tools/circuit_diagram_creatorv3.html',
    toolId: 'circuit-symbol',
  },
  {
    name: 'Sec/JC circuit diagram',
    sourcePattern: /^circuit diagram secjc v(\d+)\.html$/,
    destination: 'public/tools/circuit_diagram_secjcv2.html',
    toolId: 'circuit-secjc',
  },
  {
    name: 'Isometric cube builder',
    sourcePattern: /^cube_solid_generator_refined_v(\d+)\.html$/,
    destination: 'public/tools/isometric-cube-generator.html',
    toolId: 'isometric-cube',
  },
]

function findHighestVersion(root, sourcePattern) {
  const candidates = fs.readdirSync(root, { withFileTypes: true })
    .filter(entry => entry.isFile())
    .map(entry => {
      const match = entry.name.match(sourcePattern)
      return match ? { name: entry.name, version: Number(match[1]) } : null
    })
    .filter(Boolean)
    .sort((a, b) => b.version - a.version || a.name.localeCompare(b.name))

  if (!candidates.length) {
    throw new Error(`No canonical source matched ${sourcePattern}`)
  }

  return path.join(root, candidates[0].name)
}

function resolveContracts(root = process.cwd()) {
  return TOOL_CONTRACTS.map(contract => ({
    ...contract,
    source: findHighestVersion(root, contract.sourcePattern),
    destination: path.join(root, contract.destination),
  }))
}

function decorateTool(source, toolId) {
  const eol = '\n'
  let output = source.replace(/\r\n/g, eol)
    .replace(/^[ \t]*<meta\s+name=["']tool-id["'][^>]*>\s*/gim, '')
    .replace(/^[ \t]*<script\s+src=["']\/tracker\.js["']\s*><\/script>\s*/gim, '')

  const viewport = /<meta\s+name=["']viewport["'][^>]*>/i
  if (!viewport.test(output)) {
    throw new Error(`Cannot add tool identity for ${toolId}: viewport meta tag not found`)
  }
  output = output.replace(
    viewport,
    match => `${match}${eol}  <meta name="tool-id" content="${toolId}" />`
  )

  if (!/<\/body>/i.test(output)) {
    throw new Error(`Cannot add tracker for ${toolId}: closing body tag not found`)
  }
  output = output.replace(
    /^[ \t]*<\/body>/im,
    `  <script src="/tracker.js"></script>${eol}</body>`
  )

  return output
}

function syncTools(root = process.cwd(), { check = false } = {}) {
  const results = []

  for (const contract of resolveContracts(root)) {
    const source = fs.readFileSync(contract.source, 'utf8')
    const expected = decorateTool(source, contract.toolId)
    const current = fs.existsSync(contract.destination)
      ? fs.readFileSync(contract.destination, 'utf8')
      : null
    const changed = current !== expected

    if (changed && !check) {
      fs.mkdirSync(path.dirname(contract.destination), { recursive: true })
      fs.writeFileSync(contract.destination, expected, 'utf8')
    }

    results.push({ ...contract, changed })
  }

  return results
}

function runCli() {
  const check = process.argv.includes('--check')
  const results = syncTools(process.cwd(), { check })
  const changed = results.filter(result => result.changed)

  for (const result of results) {
    const source = path.relative(process.cwd(), result.source)
    const destination = path.relative(process.cwd(), result.destination)
    const status = result.changed ? (check ? 'DRIFT' : 'SYNCED') : 'CURRENT'
    process.stdout.write(`${status} ${source} -> ${destination}\n`)
  }

  if (check && changed.length) process.exitCode = 1
}

if (require.main === module) runCli()

module.exports = {
  TOOL_CONTRACTS,
  decorateTool,
  findHighestVersion,
  resolveContracts,
  syncTools,
}
