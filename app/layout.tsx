import type { Metadata } from 'next'
import { Suspense } from 'react'
import { JetBrains_Mono } from 'next/font/google'
import { DisclaimerBanner } from '@/components/disclaimer-banner'
import { CaptureWrapper } from '@/components/capture-wrapper'
import './globals.css'

const jetbrainsMono = JetBrains_Mono({
  variable: '--font-jetbrains-mono',
  subsets: ['latin'],
})

export const metadata: Metadata = {
  title: 'Mundial 2026 IA Predictor',
  description: 'Proyecciones estadísticas del Mundial 2026 generadas por IA',
}

function Header() {
  return (
    <header className="border-b flex flex-col" style={{ borderColor: 'var(--border)' }}>
      <div className="px-6 py-3 flex items-center gap-4">
        <svg
          width="20"
          height="20"
          viewBox="0 0 20 20"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          style={{ color: 'var(--accent)' }}
        >
          <path
            d="M10 2L12 8H18L13 12L15 18L10 14L5 18L7 12L2 8H8L10 2Z"
            fill="currentColor"
          />
        </svg>
        <a
          href="/"
          className="text-sm font-bold tracking-widest"
          style={{ color: 'var(--accent)' }}
        >
          MUNDIAL 2026
        </a>
        <span style={{ color: 'var(--muted)' }}>·</span>
        <span className="text-sm tracking-widest" style={{ color: 'var(--muted)' }}>
          IA PREDICTOR
        </span>
        <nav className="ml-auto flex gap-6">
          <a
            href="/groups"
            className="text-xs tracking-wider hover:text-white transition-colors"
            style={{ color: 'var(--muted)' }}
          >
            GRUPOS
          </a>
          <a
            href="/fixtures"
            className="text-xs tracking-wider hover:text-white transition-colors"
            style={{ color: 'var(--muted)' }}
          >
            PARTIDOS
          </a>
        </nav>
      </div>
      <div className="flex h-1">
        <div className="flex-1" style={{ background: 'var(--accent)' }} />
        <div className="flex-1" style={{ background: 'var(--accent2)' }} />
        <div className="flex-1" style={{ background: 'var(--accent3)' }} />
      </div>
    </header>
  )
}

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="es" className={`${jetbrainsMono.variable} h-full`} suppressHydrationWarning>
      <body
        className="min-h-full flex flex-col"
        style={{ background: 'var(--bg)', color: 'var(--text)' }}
      >
        <style>{`
          :root {
            --bg: #060d1a;
            --text: #f0f4f8;
            --accent: #c8102e;
            --accent2: #009a44;
            --accent3: #002868;
            --muted: #7a8fa6;
            --border: #1a2535;
          }
        `}</style>
        <DisclaimerBanner />
        <Suspense>
          <CaptureWrapper captureHidden={null}>
            <Header />
          </CaptureWrapper>
        </Suspense>
        <main className="flex-1 flex flex-col">{children}</main>
      </body>
    </html>
  )
}
