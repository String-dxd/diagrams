/**
 * @jest-environment jsdom
 */
const fs = require('fs')
const path = require('path')

const trackerCode = fs.readFileSync(
  path.join(__dirname, '../public/tracker.js'),
  'utf8'
)

function loadTracker() {
  // eslint-disable-next-line no-eval
  eval(trackerCode)
}

const mockRandomUUID = jest.fn().mockReturnValue('mock-uuid-1234')

beforeEach(() => {
  localStorage.clear()
  jest.clearAllMocks()
  mockRandomUUID.mockReturnValue('mock-uuid-1234')
  global.fetch = jest.fn().mockResolvedValue({})
  Object.defineProperty(global, 'crypto', {
    value: { randomUUID: mockRandomUUID },
    writable: true,
    configurable: true,
  })
  document.head.innerHTML = ''
  document.body.innerHTML = ''
})

describe('UUID management', () => {
  it('creates and stores a UUID on first visit', () => {
    document.head.innerHTML = '<meta name="tool-id" content="circuit-symbol" />'
    loadTracker()
    expect(localStorage.getItem('diag_uid')).toBe('mock-uuid-1234')
  })

  it('reuses an existing UUID on return visits', () => {
    localStorage.setItem('diag_uid', 'existing-uuid')
    document.head.innerHTML = '<meta name="tool-id" content="circuit-symbol" />'
    loadTracker()
    expect(localStorage.getItem('diag_uid')).toBe('existing-uuid')
    expect(mockRandomUUID).not.toHaveBeenCalled()
  })
})

describe('Export button detection', () => {
  it('fires fetch when #exportBtn is clicked', () => {
    document.head.innerHTML = '<meta name="tool-id" content="circuit-symbol" />'
    document.body.innerHTML = '<button id="exportBtn">Export PNG</button>'
    loadTracker()

    document.getElementById('exportBtn').click()

    expect(global.fetch).toHaveBeenCalledWith('/api/event', expect.objectContaining({
      method: 'POST',
      body: JSON.stringify({ uuid: 'mock-uuid-1234', tool: 'circuit-symbol' }),
    }))
  })

  it('fires fetch when #downloadBtn is clicked', () => {
    document.head.innerHTML = '<meta name="tool-id" content="isometric-cube" />'
    document.body.innerHTML = '<button id="downloadBtn">Download Iso PNG</button>'
    loadTracker()

    document.getElementById('downloadBtn').click()

    expect(global.fetch).toHaveBeenCalledWith('/api/event', expect.objectContaining({
      body: JSON.stringify({ uuid: 'mock-uuid-1234', tool: 'isometric-cube' }),
    }))
  })

  it('fires fetch when #exportViewsBtn is clicked', () => {
    document.head.innerHTML = '<meta name="tool-id" content="isometric-cube" />'
    document.body.innerHTML = '<button id="exportViewsBtn">Download Views PNG</button>'
    loadTracker()

    document.getElementById('exportViewsBtn').click()

    expect(global.fetch).toHaveBeenCalledTimes(1)
  })

  it('fires fetch when #exportPractice is clicked', () => {
    document.head.innerHTML = '<meta name="tool-id" content="seed-dispersal" />'
    document.body.innerHTML = '<button id="exportPractice">Export Diagram as PNG</button>'
    loadTracker()

    document.getElementById('exportPractice').click()

    expect(global.fetch).toHaveBeenCalledWith('/api/event', expect.objectContaining({
      body: JSON.stringify({ uuid: 'mock-uuid-1234', tool: 'seed-dispersal' }),
    }))
  })

  it('fires fetch when #exportCreator is clicked', () => {
    document.head.innerHTML = '<meta name="tool-id" content="seed-dispersal" />'
    document.body.innerHTML = '<button id="exportCreator">Export PNG</button>'
    loadTracker()

    document.getElementById('exportCreator').click()

    expect(global.fetch).toHaveBeenCalledWith('/api/event', expect.objectContaining({
      body: JSON.stringify({ uuid: 'mock-uuid-1234', tool: 'seed-dispersal' }),
    }))
  })
})

describe('No-op cases', () => {
  it('does nothing if tool-id meta tag is absent', () => {
    document.body.innerHTML = '<button id="exportBtn">Export PNG</button>'
    loadTracker()

    document.getElementById('exportBtn').click()

    expect(global.fetch).not.toHaveBeenCalled()
    expect(localStorage.getItem('diag_uid')).toBeNull()
  })

  it('silently skips buttons that are not present in this tool', () => {
    document.head.innerHTML = '<meta name="tool-id" content="circuit-symbol" />'
    document.body.innerHTML = '<button id="exportBtn">Export PNG</button>'
    // downloadBtn and exportViewsBtn not in DOM — should not throw
    expect(() => loadTracker()).not.toThrow()
  })
})
