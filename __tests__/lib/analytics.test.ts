import { parseGoogleAnalyticsId } from '@/lib/analytics'

describe('parseGoogleAnalyticsId', () => {
  it('accepts a GA4 measurement ID', () => {
    expect(parseGoogleAnalyticsId('G-ABC123XYZ')).toBe('G-ABC123XYZ')
  })

  it.each([
    undefined,
    '',
    'G-XXXXXXXXXX',
    'UA-12345-1',
    "G-ABC');alert(1);//",
    'https://example.com',
  ])('rejects invalid or placeholder input: %s', value => {
    expect(parseGoogleAnalyticsId(value)).toBeUndefined()
  })
})
