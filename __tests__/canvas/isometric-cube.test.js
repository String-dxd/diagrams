/**
 * @jest-environment jsdom
 *
 * Tests for isometric-cube-generator.html (v2) UI logic.
 * Covers: toggle front/side mapping, preview overlay, independent export
 * settings, rotated top view mapping, and button label refreshes.
 * Canvas rendering is mocked — we test state and DOM mutations only.
 */
const { loadCircuitScript } = require('./helpers')

// Mock canvas so jsdom doesn't throw on getContext/toBlob
beforeAll(() => {
  HTMLCanvasElement.prototype.getContext = () => ({
    clearRect: jest.fn(),
    beginPath: jest.fn(),
    moveTo: jest.fn(),
    lineTo: jest.fn(),
    stroke: jest.fn(),
    fill: jest.fn(),
    fillRect: jest.fn(),
    arc: jest.fn(),
    closePath: jest.fn(),
    save: jest.fn(),
    restore: jest.fn(),
    setLineDash: jest.fn(),
    drawImage: jest.fn(),
    scale: jest.fn(),
    translate: jest.fn(),
    measureText: jest.fn(() => ({ width: 0 })),
    fillText: jest.fn(),
    strokeText: jest.fn(),
    rect: jest.fn(),
    strokeRect: jest.fn(),
    roundRect: jest.fn(),
    clip: jest.fn(),
    createLinearGradient: jest.fn(() => ({ addColorStop: jest.fn() })),
    canvas: { width: 800, height: 600 },
  })
  HTMLCanvasElement.prototype.toBlob = jest.fn((cb) => cb(new Blob()))

  document.body.innerHTML = `
    <canvas id="canvas" width="800" height="600"></canvas>
    <canvas id="isoPreviewCanvas" width="400" height="300"></canvas>
    <canvas id="viewsPreviewCanvas" width="400" height="300"></canvas>

    <input id="cubeCount" type="number" value="5" />
    <input id="spread" type="number" value="2" />

    <button id="generateBtn">Randomise</button>
    <button id="resetBtn">Clear</button>
    <button id="previewExportsBtn">Preview Exports</button>
    <button id="closePreviewBtn">Close</button>
    <button id="toggleGuidesBtn">Hide Guides</button>
    <button id="toggleFrontSideBtn">Front/Side Mapping: Standard</button>
    <button id="toggleWallsBtn">Hide Walls</button>
    <button id="toggleDotsBtn">Hide Dotted Grid</button>
    <button id="toggleExportDotsBtn">Export Dots: On</button>
    <button id="toggleExportWallsBtn">Export Walls: On</button>
    <button id="toggleExportDirectionLabelsBtn">Export Front/Side Labels: On</button>
    <button id="downloadIsoFromPreviewBtn">Download Iso PNG</button>
    <button id="downloadViewsFromPreviewBtn">Download Views PNG</button>

    <div id="previewOverlay" class="preview-overlay" aria-hidden="true"></div>

    <span id="shapeTag"></span>
    <span id="hoverHint"></span>
    <div id="cursorLabel"></div>
    <span id="statCubes">0</span>
    <span id="statColumns">0</span>
    <span id="statHeight">0</span>
    <span id="statFootprint">0</span>
  `
})

let state, toggleFrontSideBtn, toggleWallsBtn, toggleDotsBtn,
  toggleExportDotsBtn, toggleExportWallsBtn, toggleExportDirectionLabelsBtn,
  previewOverlay, previewExportsBtn, closePreviewBtn, getFrontSideMapping,
  computePlanData

beforeAll(() => {
  ;({
    state,
    toggleFrontSideBtn,
    toggleWallsBtn,
    toggleDotsBtn,
    toggleExportDotsBtn,
    toggleExportWallsBtn,
    toggleExportDirectionLabelsBtn,
    previewOverlay,
    previewExportsBtn,
    closePreviewBtn,
    getFrontSideMapping,
    computePlanData,
  } = loadCircuitScript('isometric-cube-generator.html', [
    'state',
    'toggleFrontSideBtn',
    'toggleWallsBtn',
    'toggleDotsBtn',
    'toggleExportDotsBtn',
    'toggleExportWallsBtn',
    'toggleExportDirectionLabelsBtn',
    'previewOverlay',
    'previewExportsBtn',
    'closePreviewBtn',
    'getFrontSideMapping',
    'computePlanData',
  ]))
})

describe('initial state', () => {
  test('swapFrontSide defaults to false', () => {
    expect(state.swapFrontSide).toBe(false)
  })

  test('showDots defaults to true', () => {
    expect(state.showDots).toBe(true)
  })

  test('showWalls defaults to true', () => {
    expect(state.showWalls).toBe(true)
  })

  test('export settings default to visible with direction labels', () => {
    expect(state.exportDots).toBe(true)
    expect(state.exportWalls).toBe(true)
    expect(state.exportDirectionLabels).toBe(true)
  })

  test('preview overlay is closed initially', () => {
    expect(previewOverlay.classList.contains('open')).toBe(false)
    expect(previewOverlay.getAttribute('aria-hidden')).toBe('true')
  })
})

describe('toggle front/side mapping', () => {
  test('clicking toggleFrontSideBtn flips swapFrontSide to true', () => {
    toggleFrontSideBtn.click()
    expect(state.swapFrontSide).toBe(true)
  })

  test('button label updates to Swapped', () => {
    expect(toggleFrontSideBtn.textContent).toBe('Front/Side Mapping: Swapped')
    expect(getFrontSideMapping().topGrid).toBe('topGridSwapped')
  })

  test('clicking again flips swapFrontSide back to false', () => {
    toggleFrontSideBtn.click()
    expect(state.swapFrontSide).toBe(false)
    expect(toggleFrontSideBtn.textContent).toBe('Front/Side Mapping: Standard')
    expect(getFrontSideMapping().topGrid).toBe('topGridStandard')
  })
})

describe('top view orientation', () => {
  test('uses a different top grid when Front and Side are swapped', () => {
    state.heights = new Map([
      ['0,0', 1],
      ['1,0', 1],
      ['0,1', 1],
    ])
    const data = computePlanData()
    expect(data.topGridStandard).not.toEqual(data.topGridSwapped)
  })
})

describe('preview overlay', () => {
  test('clicking previewExportsBtn opens the overlay', () => {
    previewExportsBtn.click()
    expect(previewOverlay.classList.contains('open')).toBe(true)
    expect(previewOverlay.getAttribute('aria-hidden')).toBe('false')
  })

  test('clicking closePreviewBtn closes the overlay', () => {
    closePreviewBtn.click()
    expect(previewOverlay.classList.contains('open')).toBe(false)
    expect(previewOverlay.getAttribute('aria-hidden')).toBe('true')
  })

  test('pressing Escape closes an open overlay', () => {
    previewExportsBtn.click()
    expect(previewOverlay.classList.contains('open')).toBe(true)
    document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }))
    expect(previewOverlay.classList.contains('open')).toBe(false)
  })
})

describe('display toggles', () => {
  test('toggleDotsBtn flips showDots', () => {
    const before = state.showDots
    toggleDotsBtn.click()
    expect(state.showDots).toBe(!before)
    toggleDotsBtn.click() // restore
    expect(state.showDots).toBe(before)
  })

  test('toggleWallsBtn flips showWalls', () => {
    const before = state.showWalls
    toggleWallsBtn.click()
    expect(state.showWalls).toBe(!before)
    toggleWallsBtn.click() // restore
    expect(state.showWalls).toBe(before)
  })

  test('dots button label reflects state', () => {
    toggleDotsBtn.click()
    expect(toggleDotsBtn.textContent).toBe(state.showDots ? 'Hide Dotted Grid' : 'Show Dotted Grid')
    toggleDotsBtn.click() // restore
  })

  test('walls button label reflects state', () => {
    toggleWallsBtn.click()
    expect(toggleWallsBtn.textContent).toBe(state.showWalls ? 'Hide Walls' : 'Show Walls')
    toggleWallsBtn.click() // restore
  })
})

describe('independent export settings', () => {
  test('export dots can change without changing canvas dots', () => {
    const displayed = state.showDots
    toggleExportDotsBtn.click()
    expect(state.exportDots).toBe(false)
    expect(state.showDots).toBe(displayed)
    expect(toggleExportDotsBtn.textContent).toBe('Export Dots: Off')
    toggleExportDotsBtn.click()
  })

  test('export walls can change without changing canvas walls', () => {
    const displayed = state.showWalls
    toggleExportWallsBtn.click()
    expect(state.exportWalls).toBe(false)
    expect(state.showWalls).toBe(displayed)
    expect(toggleExportWallsBtn.textContent).toBe('Export Walls: Off')
    toggleExportWallsBtn.click()
  })

  test('direction labels can be excluded from exports', () => {
    toggleExportDirectionLabelsBtn.click()
    expect(state.exportDirectionLabels).toBe(false)
    expect(toggleExportDirectionLabelsBtn.textContent).toBe('Export Front/Side Labels: Off')
    toggleExportDirectionLabelsBtn.click()
  })
})
