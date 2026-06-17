'use client'

import { useState } from 'react'

interface ShareButtonProps {
  title: string
  text: string
  path: string
}

export function ShareButton({ title, text, path }: ShareButtonProps) {
  const [feedback, setFeedback] = useState<string | null>(null)

  async function handleShare() {
    const url = window.location.origin + path

    if (navigator.share) {
      try {
        await navigator.share({ title, text, url })
      } catch {
        // user cancelled — no feedback needed
      }
      return
    }

    try {
      await navigator.clipboard.writeText(url)
      setFeedback('¡Copiado!')
      setTimeout(() => setFeedback(null), 2000)
    } catch {
      setFeedback('Copia la URL manualmente')
      setTimeout(() => setFeedback(null), 3000)
    }
  }

  return (
    <button
      onClick={handleShare}
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 8,
        padding: '8px 16px',
        background: feedback ? 'rgba(2,185,6,0.12)' : 'rgba(255,219,0,0.08)',
        border: `1px solid ${feedback ? 'rgba(2,185,6,0.3)' : 'rgba(255,219,0,0.2)'}`,
        borderRadius: 8,
        color: feedback ? '#02B906' : '#FFDB00',
        fontSize: 13,
        fontWeight: 600,
        letterSpacing: '0.5px',
        cursor: 'pointer',
        transition: 'all 0.2s',
      }}
    >
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="18" cy="5" r="3" />
        <circle cx="6" cy="12" r="3" />
        <circle cx="18" cy="19" r="3" />
        <line x1="8.59" y1="13.51" x2="15.42" y2="17.49" />
        <line x1="15.41" y1="6.51" x2="8.59" y2="10.49" />
      </svg>
      {feedback ?? 'Compartir predicción'}
    </button>
  )
}
