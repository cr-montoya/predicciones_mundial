import type { Metadata } from 'next'
import { Suspense } from 'react'
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
  title: 'Mundial 2026 IA Predictor',
  description: 'Proyecciones estadísticas del Mundial 2026 generadas por IA',
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
        <Suspense>
          <CaptureWrapper captureHidden={null}>
            <Nav />
            <DisclaimerBanner />
          </CaptureWrapper>
        </Suspense>
        <main className="flex-1 flex flex-col">{children}</main>
      </body>
    </html>
  )
}
