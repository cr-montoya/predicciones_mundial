'use client'

import { useState, useRef, useEffect } from 'react'
import type { MarketCopy } from '@/lib/content/markets-es'

export function MarketInfo({ copy }: { copy: MarketCopy }) {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!open) return
    function onMouse(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') setOpen(false)
    }
    document.addEventListener('mousedown', onMouse)
    document.addEventListener('keydown', onKey)
    return () => {
      document.removeEventListener('mousedown', onMouse)
      document.removeEventListener('keydown', onKey)
    }
  }, [open])

  return (
    <div ref={ref} style={{ position: 'relative', display: 'inline-flex', flexShrink: 0 }}>
      <button
        onClick={() => setOpen(v => !v)}
        aria-label={`Información sobre ${copy.label}`}
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          justifyContent: 'center',
          width: 32,
          height: 32,
          margin: -8,
          background: 'none',
          border: 'none',
          cursor: 'pointer',
          padding: 0,
        }}
      >
        <span style={{
          display: 'inline-flex',
          alignItems: 'center',
          justifyContent: 'center',
          width: 16,
          height: 16,
          fontSize: 10,
          fontWeight: 700,
          fontFamily: 'inherit',
          borderRadius: 3,
          border: open ? '1px solid rgba(212,168,67,0.4)' : '1px solid rgba(255,255,255,0.06)',
          color: open ? '#D4A843' : '#6b6d75',
          background: open ? 'rgba(255,219,0,0.06)' : 'transparent',
          lineHeight: 1,
          userSelect: 'none',
        }}>
          i
        </span>
      </button>

      {open && (
        <div style={{
          position: 'absolute',
          top: '100%',
          left: 0,
          marginTop: 6,
          width: 'min(280px, calc(100vw - 32px))',
          background: '#12141a',
          border: '1px solid rgba(212,168,67,0.15)',
          borderTop: '2px solid #D4A843',
          borderRadius: 4,
          zIndex: 50,
          padding: '12px 14px',
          display: 'flex',
          flexDirection: 'column',
          gap: 8,
        }}>
          <div style={{
            fontSize: 10,
            fontWeight: 700,
            color: '#6b6d75',
            letterSpacing: '1.5px',
            textTransform: 'uppercase',
          }}>
            {copy.label}
          </div>
          <p style={{ fontSize: 13, color: '#f0ece4', lineHeight: 1.5, margin: 0 }}>
            {copy.description}
          </p>
          <div style={{ borderTop: '1px solid rgba(255,255,255,0.04)', paddingTop: 8, display: 'flex', gap: 4 }}>
            <span style={{ fontSize: 11, fontWeight: 600, color: '#D4A843', flexShrink: 0 }}>Ej.</span>
            <span style={{ fontSize: 12, color: '#6b6d75', lineHeight: 1.4 }}>{copy.example}</span>
          </div>
          {copy.confidenceNote && (
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: 6 }}>
              <span style={{
                background: 'rgba(255,165,0,0.12)',
                color: '#FFA500',
                fontSize: 10,
                fontWeight: 600,
                padding: '2px 6px',
                borderRadius: 3,
                letterSpacing: 1,
                flexShrink: 0,
                marginTop: 1,
              }}>NOTA</span>
              <span style={{ fontSize: 11, color: '#6b6d75', lineHeight: 1.4 }}>{copy.confidenceNote}</span>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
