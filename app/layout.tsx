import type { Metadata } from 'next'
import { JetBrains_Mono } from 'next/font/google'
import './globals.css'

const jetbrainsMono = JetBrains_Mono({
  variable: '--font-jetbrains-mono',
  subsets: ['latin'],
})

export const metadata: Metadata = {
  title: 'Mundial 2026 IA Predictor',
  description: 'Proyecciones estadísticas del Mundial 2026 generadas por IA',
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
        <header
          className="border-b px-6 py-3 flex items-center gap-4"
          style={{ borderColor: 'var(--border)' }}
        >
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
        </header>
        <main className="flex-1 flex flex-col">{children}</main>
      </body>
    </html>
  )
}
