'use client'

import { useState } from 'react'

interface CollapsibleSectionProps {
  title: string
  count?: number
  defaultOpen?: boolean
  children: React.ReactNode
}

export function CollapsibleSection({
  title,
  count,
  defaultOpen = true,
  children,
}: CollapsibleSectionProps) {
  const [open, setOpen] = useState(defaultOpen)

  return (
    <div className="flex flex-col gap-6">
      <button
        type="button"
        onClick={() => setOpen((prev) => !prev)}
        className="flex items-center justify-between w-full border-b pb-2 text-left"
        style={{ borderColor: 'var(--border)' }}
      >
        <span
          className="text-xs tracking-widest font-bold uppercase"
          style={{ color: 'var(--accent)' }}
        >
          {title}
        </span>
        <span className="flex items-center gap-2">
          {count !== undefined && (
            <span className="text-xs" style={{ color: 'var(--muted)' }}>
              {count}
            </span>
          )}
          <span
            className="text-xs transition-transform"
            style={{
              color: 'var(--muted)',
              display: 'inline-block',
              transform: open ? 'rotate(0deg)' : 'rotate(180deg)',
            }}
          >
            ▼
          </span>
        </span>
      </button>
      <div style={{ display: open ? undefined : 'none' }}>{children}</div>
    </div>
  )
}
