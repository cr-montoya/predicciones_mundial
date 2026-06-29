import type { Metadata } from 'next'
import { Outfit } from 'next/font/google'
import { DisclaimerBanner } from '@/components/disclaimer-banner'
import { CaptureWrapper } from '@/components/capture-wrapper'
import { Nav } from '@/components/nav'
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
  description:
    'AI-assisted statistical football analytics for the 2026 FIFA World Cup. ' +
    'Explore probabilities, market projections, and tournament predictions ' +
    'powered by a custom Poisson + Monte Carlo model.',
  openGraph: {
    title: 'World Cup 2026 Prediction Simulator',
    description: 'AI-assisted statistical football analytics for the 2026 FIFA World Cup.',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'World Cup 2026 Prediction Simulator',
    description: 'AI-assisted statistical football analytics for the 2026 FIFA World Cup.',
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
        <CaptureWrapper captureHidden={null}>
          <Nav />
          <DisclaimerBanner />
        </CaptureWrapper>
        <main className="flex-1 flex flex-col">{children}</main>
      </body>
    </html>
  )
}
