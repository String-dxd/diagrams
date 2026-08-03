/**
 * @jest-environment node
 */
import { POST } from '@/app/api/event/route'
import { NextRequest } from 'next/server'

// Mock the DB module so tests never touch NeonDB
jest.mock('@/lib/db', () => ({ getDb: jest.fn() }))
import { getDb } from '@/lib/db'

const VALID_UUID = '123e4567-e89b-42d3-a456-426614174000'

function makeRequest(body: unknown) {
  return new NextRequest('http://localhost/api/event', {
    method: 'POST',
    body: JSON.stringify(body),
    headers: { 'Content-Type': 'application/json' },
  })
}

describe('POST /api/event', () => {
  const mockSql = jest.fn()

  beforeEach(() => {
    jest.clearAllMocks()
    ;(getDb as jest.Mock).mockReturnValue(mockSql)
  })

  // --- Input validation ---

  it('returns 400 when uuid is missing', async () => {
    const res = await POST(makeRequest({ tool: 'circuit-symbol' }))
    expect(res.status).toBe(400)
    expect(mockSql).not.toHaveBeenCalled()
  })

  it('returns 400 when tool is missing', async () => {
    const res = await POST(makeRequest({ uuid: VALID_UUID }))
    expect(res.status).toBe(400)
    expect(mockSql).not.toHaveBeenCalled()
  })

  it('returns 400 for an unrecognised tool name', async () => {
    const res = await POST(makeRequest({ uuid: VALID_UUID, tool: 'unknown-tool' }))
    expect(res.status).toBe(400)
    expect(mockSql).not.toHaveBeenCalled()
  })

  it('returns 400 for malformed JSON body', async () => {
    const req = new NextRequest('http://localhost/api/event', {
      method: 'POST',
      body: 'not json',
      headers: { 'Content-Type': 'application/json' },
    })
    const res = await POST(req)
    expect(res.status).toBe(400)
  })

  it.each([
    'user-1',
    '123e4567-e89b-12d3-a456-426614174000',
    '123e4567-e89b-42d3-c456-426614174000',
    'x'.repeat(10_000),
    123,
    null,
  ])('returns 400 for a non-v4 UUID: %p', async uuid => {
    const res = await POST(makeRequest({ uuid, tool: 'circuit-symbol' }))
    expect(res.status).toBe(400)
    expect(mockSql).not.toHaveBeenCalled()
  })

  it('returns 415 for a non-JSON request', async () => {
    const req = new NextRequest('http://localhost/api/event', {
      method: 'POST',
      body: 'uuid=anything',
      headers: { 'Content-Type': 'text/plain' },
    })
    const res = await POST(req)
    expect(res.status).toBe(415)
    expect(mockSql).not.toHaveBeenCalled()
  })

  // --- Rate limiting ---

  it('returns 200 and skips inserts when rate limited', async () => {
    mockSql.mockResolvedValueOnce([{ 1: 1 }]) // recent event found → rate limited

    const res = await POST(makeRequest({ uuid: VALID_UUID, tool: 'circuit-symbol' }))
    const json = await res.json()

    expect(res.status).toBe(200)
    expect(json).toEqual({ ok: true })
    expect(mockSql).toHaveBeenCalledTimes(1) // only the rate-limit check, no inserts
  })

  // --- Happy path ---

  it('returns 200 and runs 3 queries for a new event', async () => {
    mockSql
      .mockResolvedValueOnce([])  // rate-limit check: no recent events
      .mockResolvedValueOnce([])  // upsert user
      .mockResolvedValueOnce([])  // insert event

    const res = await POST(makeRequest({ uuid: VALID_UUID, tool: 'circuit-symbol' }))
    const json = await res.json()

    expect(res.status).toBe(200)
    expect(json).toEqual({ ok: true })
    expect(mockSql).toHaveBeenCalledTimes(3)
  })

  it('accepts all valid tool names', async () => {
    const tools = ['circuit-symbol', 'circuit-object', 'circuit-secjc', 'water-tank', 'isometric-cube']
    for (const tool of tools) {
      mockSql
        .mockResolvedValueOnce([])
        .mockResolvedValueOnce([])
        .mockResolvedValueOnce([])
      const res = await POST(makeRequest({ uuid: VALID_UUID, tool }))
      expect(res.status).toBe(200)
    }
  })
})
