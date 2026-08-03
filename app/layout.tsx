import type { Metadata } from 'next'
import { GoogleAnalytics } from '@next/third-parties/google'
import { parseGoogleAnalyticsId } from '@/lib/analytics'
import './globals.css'

export const metadata: Metadata = {
  metadataBase: new URL('https://diagrams.string.sg'),
  title: 'Diagram Tools',
  description: 'Teaching tools for creating clean, exportable diagrams.',
  openGraph: {
    images: [{ url: '/og-image.jpg', width: 1280, height: 1024 }],
  },
  icons: {
    icon: [
      { url: '/favicon-16x16.png', sizes: '16x16', type: 'image/png' },
      { url: '/favicon-32x32.png', sizes: '32x32', type: 'image/png' },
      { url: '/favicon.ico' },
    ],
    apple: [
      { url: '/apple-touch-icon-iphone-60x60.png', sizes: '60x60' },
      { url: '/apple-touch-icon-iphone-retina-120x120.png', sizes: '120x120' },
      { url: '/apple-touch-icon-ipad-76x76.png', sizes: '76x76' },
      { url: '/apple-touch-icon-ipad-retina-152x152.png', sizes: '152x152' },
    ],
    other: [
      { rel: 'msapplication-TileImage', url: '/mstile-150x150.png' },
    ],
  },
}

const GA_ID = parseGoogleAnalyticsId(process.env.NEXT_PUBLIC_GA_ID)

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
      {GA_ID && <GoogleAnalytics gaId={GA_ID} />}
    </html>
  )
}
