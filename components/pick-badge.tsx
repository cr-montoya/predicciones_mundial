'use client'

import { useState, useEffect } from 'react'

interface PickBadgeProps {
  fixtureId: number
}

export function PickBadge({ fixtureId }: PickBadgeProps) {
  const [hasPick, setHasPick] = useState(false)

  useEffect(() => {
    try {
      setHasPick(!!localStorage.getItem(`pick_${fixtureId}`))
    } catch {
      // localStorage unavailable — silent fail
    }
  }, [fixtureId])

  if (!hasPick) return null

  return (
    <div style={{
      display: 'flex',
      alignItems: 'center',
      gap: 4,
      fontSize: 10,
      fontWeight: 600,
      color: '#FFDB00',
      letterSpacing: '0.5px',
      flexShrink: 0,
    }}>
      <span style={{
        width: 6,
        height: 6,
        borderRadius: '50%',
        background: '#FFDB00',
        display: 'inline-block',
        flexShrink: 0,
      }} />
      PICK
    </div>
  )
}
