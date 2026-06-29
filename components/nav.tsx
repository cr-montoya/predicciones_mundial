'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { FixturesNavBadge } from '@/components/fixtures-nav-badge'
import { LanguageToggle } from '@/components/language-toggle'
import { useTranslation } from '@/lib/i18n/hook'

export function Nav() {
  const pathname = usePathname()
  const { t } = useTranslation()

  const TABS = [
    { label: t.nav.today, href: '/' },
    { label: t.nav.groups, href: '/groups' },
    { label: t.nav.fixtures, href: '/fixtures' },
    { label: t.nav.bracket, href: '/bracket' },
    { label: t.nav.myPicks, href: '/mis-picks' },
  ]

  return (
    <div style={{
      position: 'sticky',
      top: 0,
      zIndex: 100,
      background: 'rgba(8,9,13,0.92)',
      backdropFilter: 'blur(16px)',
      WebkitBackdropFilter: 'blur(16px)',
      borderBottom: '1px solid rgba(255,255,255,0.06)',
    }}>
      <div style={{
        maxWidth: 1100,
        margin: '0 auto',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '0 28px',
        height: 60,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{
            width: 28,
            height: 28,
            background: 'linear-gradient(135deg, #FFDB00, #D4A843)',
            borderRadius: 6,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: 14,
          }}>
            ⚽
          </div>
          <span style={{ fontWeight: 700, fontSize: 16, color: '#f0ece4', letterSpacing: '0.5px' }}>
            MUNDIAL 2026
          </span>
          <span style={{ fontWeight: 400, fontSize: 13, color: '#6b6d75' }}>
            IA Predictor
          </span>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 24, height: '100%' }}>
          <div style={{ display: 'flex', gap: 32, height: '100%' }}>
            {TABS.map(({ label, href }) => {
              const active = pathname === href
              return (
                <Link
                  key={href}
                  href={href}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    height: '100%',
                    paddingTop: 2,
                    borderBottom: `2px solid ${active ? '#FFDB00' : 'transparent'}`,
                    textDecoration: 'none',
                    fontSize: 13,
                    fontWeight: 600,
                    color: active ? '#FFDB00' : '#6b6d75',
                    letterSpacing: '1px',
                    textTransform: 'uppercase',
                    transition: 'color 0.15s, border-color 0.15s',
                  }}
                >
                  {label}
                  {href === '/fixtures' && <FixturesNavBadge />}
                </Link>
              )
            })}
          </div>

          <LanguageToggle />
        </div>
      </div>
    </div>
  )
}
