'use client'

import { useState, useEffect } from 'react'
import { UPCOMING_UNPICKED_COUNT_KEY } from '@/components/picks-reminder-banner'

export function FixturesNavBadge() {
  const [count, setCount] = useState(0)

  useEffect(() => {
    try {
      const n = Number(localStorage.getItem(UPCOMING_UNPICKED_COUNT_KEY)) || 0
      setCount(n)
    } catch {
      // localStorage unavailable (private mode)
    }
  }, [])

  if (count === 0) return null

  return (
    <span
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        minWidth: 16,
        height: 16,
        padding: '0 5px',
        marginLeft: 6,
        borderRadius: 8,
        background: '#E5342B',
        color: '#fff',
        fontSize: 10,
        fontWeight: 700,
        lineHeight: 1,
        verticalAlign: 'middle',
        flexShrink: 0,
      }}
    >
      {count > 9 ? '9+' : count}
    </span>
  )
}
