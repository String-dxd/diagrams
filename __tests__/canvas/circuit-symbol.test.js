/**
 * @jest-environment jsdom
 *
 * Tests for the pure logic functions in circuit_diagram_creatorv2.html.
 * GRID = 28, COMPONENT_SCALE = 0.8
 */
const { loadCircuitScript } = require('./helpers')

let snap, gcd, componentSize, getComponentNodes, GRID, state, render, undo

beforeAll(() => {
  document.body.innerHTML = `
    <svg id="app" xmlns="http://www.w3.org/2000/svg"></svg>
    <button class="tool-btn active" data-tool="select">Select</button>
    <button class="tool-btn" data-tool="wire">Wire</button>
    <button class="tool-btn" data-tool="bulb">Bulb</button>
    <button class="tool-btn" data-tool="battery">Battery</button>
    <button class="tool-btn" data-tool="switch-open">Switch Open</button>
    <button class="tool-btn" data-tool="switch-closed">Switch Closed</button>
    <button class="tool-btn" data-tool="delete">Delete</button>
    <button id="rotateBtn">Rotate</button>
    <button id="rotate180Btn">Rotate 180°</button>
    <button id="toggleGridBtn">Hide Grid</button>
    <input id="batteryCells" type="number" value="2" />
    <input id="textValue" type="text" value="Type here" />
    <input id="fontSize" type="number" value="12" />
    <button id="addTextBtn">Add Text</button>
    <button id="updateTextBtn">Update Selected</button>
    <button id="undoBtn">Undo</button>
    <button id="redoBtn">Redo</button>
    <button id="clearBtn">Clear</button>
    <button id="exportBtn">Export PNG</button>
    <input id="inlineEditor" type="text" />
    <select id="resistorFill"><option value="white">White</option></select>
    <button id="updateResistorBtn">Update</button>
    <input id="magnetBlocks" type="number" value="2" />
    <input id="magnetCoils" type="number" value="5" />
    <div id="statusBox"></div>
    <button id="fitBtn">Centre View</button>
    <button id="zoomInBtn">+</button>
    <button id="zoomOutBtn">−</button>
    <button id="zoomResetBtn">100%</button>
    <div id="navigator" class="navigator-panel">
      <svg id="minimap" xmlns="http://www.w3.org/2000/svg"></svg>
      <div id="minimap-viewport"></div>
    </div>
  `;

  const svg = document.getElementById('app')
  svg.createSVGPoint = () => ({
    x: 0,
    y: 0,
    matrixTransform() { return { x: this.x, y: this.y } },
  })
  svg.getScreenCTM = () => ({ inverse: () => ({}) })

  ;({ snap, gcd, componentSize, getComponentNodes, GRID, state, render, undo } = loadCircuitScript(
    'circuit_diagram_creatorv3.html',
    ['snap', 'gcd', 'componentSize', 'getComponentNodes', 'GRID', 'state', 'render', 'undo']
  ))
})

describe('snap()', () => {
  it('snaps 0 to 0', () => expect(snap(0)).toBe(0))
  it('snaps an exact grid value to itself', () => expect(snap(28)).toBe(28))
  it('snaps a value below midpoint down', () => expect(snap(10)).toBe(0))
  it('snaps a value above midpoint up', () => expect(snap(20)).toBe(28))
  it('snaps a large value correctly', () => expect(snap(56)).toBe(56))
  it('snaps a negative value', () => expect(Math.abs(snap(-10))).toBe(0))
})

describe('gcd()', () => {
  it('returns the GCD of two multiples of GRID', () => expect(gcd(28, 56)).toBe(28))
  it('returns a non-trivial GCD', () => expect(gcd(28, 42)).toBe(14))
  it('returns a || 1 when both inputs are 0', () => expect(gcd(0, 0)).toBe(1))
})

// COMPONENT_SCALE = 0.8 is applied to all dimensions
describe('componentSize()', () => {
  it('returns bulb dimensions (58 × 0.8)', () => {
    const s = componentSize('bulb')
    expect(s.w).toBeCloseTo(46.4)
    expect(s.h).toBeCloseTo(46.4)
  })

  it('returns battery dimensions for 2 cells ((34+36) × 0.8)', () => {
    const s = componentSize('battery', 2)
    expect(s.w).toBeCloseTo(56)
    expect(s.h).toBeCloseTo(35.2)
  })

  it('returns battery dimensions for 4 cells ((34+72) × 0.8)', () => {
    const s = componentSize('battery', 4)
    expect(s.w).toBeCloseTo(84.8)
    expect(s.h).toBeCloseTo(35.2)
  })

  it('returns default dimensions for unknown type (80×30 × 0.8)', () => {
    const s = componentSize('unknown')
    expect(s.w).toBeCloseTo(64)
    expect(s.h).toBeCloseTo(24)
  })
})

describe('getComponentNodes()', () => {
  it('places bulb nodes left/right at rotation 0°', () => {
    const comp = { type: 'bulb', x: 100, y: 100, rotation: 0 }
    const nodes = getComponentNodes(comp)
    expect(nodes).toHaveLength(2)
    expect(nodes[0].x).toBeCloseTo(76.8)
    expect(nodes[0].y).toBeCloseTo(100)
    expect(nodes[1].x).toBeCloseTo(123.2)
    expect(nodes[1].y).toBeCloseTo(100)
  })

  it('places bulb nodes top/bottom at rotation 90°', () => {
    const comp = { type: 'bulb', x: 100, y: 100, rotation: 90 }
    const nodes = getComponentNodes(comp)
    expect(nodes[0].x).toBeCloseTo(100)
    expect(nodes[0].y).toBeCloseTo(76.8)
    expect(nodes[1].x).toBeCloseTo(100)
    expect(nodes[1].y).toBeCloseTo(123.2)
  })

  it('rotation 180° produces same layout as 0° (mod 180)', () => {
    const comp0   = { type: 'bulb', x: 100, y: 100, rotation: 0 }
    const comp180 = { type: 'bulb', x: 100, y: 100, rotation: 180 }
    expect(getComponentNodes(comp180)).toEqual(getComponentNodes(comp0))
  })

  it('places battery nodes at correct offsets for 2 cells', () => {
    const comp = { type: 'battery', x: 100, y: 100, rotation: 0, cells: 2 }
    const nodes = getComponentNodes(comp)
    // battery w = (34 + 2*18) * 0.8 = 56; half = 28
    expect(nodes[0].x).toBeCloseTo(72)
    expect(nodes[0].y).toBeCloseTo(100)
    expect(nodes[1].x).toBeCloseTo(128)
    expect(nodes[1].y).toBeCloseTo(100)
  })
})

describe('move history', () => {
  it('undoes a drag back to the component position before the move', () => {
    const svg = document.getElementById('app')
    state.tool = 'select'
    state.wires = []
    state.components = [{ id: 1, type: 'bulb', x: 112, y: 112, rotation: 0 }]
    state.history = []
    state.future = []
    state.nextId = 2
    state.selected = null
    state.dragging = null
    render()

    svg.dispatchEvent(new MouseEvent('pointerdown', { bubbles: true, clientX: 112, clientY: 112 }))
    svg.dispatchEvent(new MouseEvent('pointermove', { bubbles: true, clientX: 140, clientY: 112 }))
    svg.dispatchEvent(new MouseEvent('pointerup', { bubbles: true, clientX: 140, clientY: 112 }))

    expect(state.components[0].x).toBe(140)
    undo()
    expect(state.components[0].x).toBe(112)
  })
})
