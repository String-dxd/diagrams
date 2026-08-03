const GA4_MEASUREMENT_ID = /^G-[A-Z0-9]{5,20}$/

export function parseGoogleAnalyticsId(value: string | undefined) {
  if (!value || value === 'G-XXXXXXXXXX') return undefined
  return GA4_MEASUREMENT_ID.test(value) ? value : undefined
}
