'use client'

import { useTranslation } from '@/lib/i18n/hook'

export function DisclaimerBanner() {
  const { t } = useTranslation()

  return (
    <div style={{
      padding: '8px 28px',
      background: 'rgba(255,219,0,0.03)',
      borderBottom: '1px solid rgba(255,219,0,0.04)',
      textAlign: 'center',
      fontSize: 11,
      color: '#6b6d75',
      letterSpacing: '0.3px',
    }}>
      {t.disclaimer}
    </div>
  )
}
