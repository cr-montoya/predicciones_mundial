import type { Metadata } from 'next'
import { Outfit } from 'next/font/google'
import { DisclaimerBanner } from '@/components/disclaimer-banner'
import { CaptureWrapper } from '@/components/capture-wrapper'
import { Nav } from '@/components/nav'
import { LanguageProvider } from '@/lib/i18n/context'
import './globals.css'

const outfit = Outfit({
  variable: '--font-outfit',
  subsets: ['latin'],
  weight: ['300', '400', '500', '600', '700', '800'],
})

export const metadata: Metadata = {
  title: {
    default: 'World Cup 2026 Prediction Simulator',
    template: '%s | World Cup 2026 Prediction Simulator',
  },
  description: 'AI-assisted statistical football analytics app for World Cup 2026 match and tournament projections.',
  openGraph: {
    title: 'World Cup 2026 Prediction Simulator',
    description: 'AI-assisted statistical football analytics app for World Cup 2026 match and tournament projections.',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'World Cup 2026 Prediction Simulator',
    description: 'AI-assisted statistical football analytics app for World Cup 2026 match and tournament projections.',
  },
}

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="es" className={outfit.variable} suppressHydrationWarning>
      <body
        className="min-h-full flex flex-col"
        style={{ background: 'var(--bg)', color: 'var(--text)' }}
      >
        <LanguageProvider>
          <CaptureWrapper captureHidden={null}>
            <Nav />
            <DisclaimerBanner />
          </CaptureWrapper>
          <main className="flex-1 flex flex-col">{children}</main>
        </LanguageProvider>
      </body>
    </html>
  )
}
