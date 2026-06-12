'use client'

import { useSearchParams } from 'next/navigation'

interface CaptureWrapperProps {
  children: React.ReactNode
  captureHidden?: React.ReactNode
}

export function CaptureWrapper({ children, captureHidden }: CaptureWrapperProps) {
  const params = useSearchParams()
  const isCapture = params.get('capture') === 'true'

  if (isCapture) {
    return <>{captureHidden}</>
  }

  return <>{children}</>
}
