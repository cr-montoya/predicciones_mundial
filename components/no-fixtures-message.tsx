'use client'

import { useTranslation } from '@/lib/i18n/hook'

export function NoFixturesMessage() {
  const { t } = useTranslation()

  return (
    <div style={{
      padding: '24px 16px',
      border: '1px solid rgba(255,255,255,0.04)',
      fontSize: 13,
      color: '#6b6d75',
      marginBottom: 36,
    }}>
      {t.home.noFixtures}
    </div>
  )
}
