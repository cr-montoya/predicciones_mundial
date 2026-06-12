'use client'

import { useState } from 'react'
import { triggerRefresh } from '@/app/actions/refresh'

type ButtonState = 'idle' | 'loading' | 'done'

export function RefreshButton() {
  const [state, setState] = useState<ButtonState>('idle')
  const [message, setMessage] = useState<string>('')

  async function handleClick() {
    setState('loading')
    const result = await triggerRefresh()
    setMessage(result.message)
    setState('done')
    setTimeout(() => setState('idle'), 3000)
  }

  if (state === 'done') {
    return (
      <div
        className="px-6 py-2 text-xs tracking-widest border"
        style={{ borderColor: 'var(--accent)', color: 'var(--accent)' }}
      >
        {message}
      </div>
    )
  }

  return (
    <button
      onClick={handleClick}
      disabled={state === 'loading'}
      className="px-6 py-2 text-xs tracking-widest border transition-colors disabled:opacity-50"
      style={{
        borderColor: 'var(--accent)',
        color: state === 'loading' ? 'var(--muted)' : 'var(--accent)',
        background: 'transparent',
        cursor: state === 'loading' ? 'not-allowed' : 'pointer',
      }}
    >
      {state === 'loading' ? 'ACTUALIZANDO...' : 'ACTUALIZAR'}
    </button>
  )
}
