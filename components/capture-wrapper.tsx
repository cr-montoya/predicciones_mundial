'use client'

import { useState, useEffect } from 'react'

interface CaptureWrapperProps {
  children: React.ReactNode
  captureHidden?: React.ReactNode
}

export function CaptureWrapper({ children, captureHidden }: CaptureWrapperProps) {
  const [isCapture, setIsCapture] = useState(false)

  useEffect(() => {
    setIsCapture(new URLSearchParams(window.location.search).get('capture') === 'true')
  }, [])

  if (isCapture) {
    return <>{captureHidden}</>
  }

  return <>{children}</>
}
