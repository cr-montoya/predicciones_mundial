'use client'

import { motion } from 'framer-motion'

interface BounceNumberProps {
  children: React.ReactNode
  className?: string
  style?: React.CSSProperties
}

export function BounceNumber({ children, className, style }: BounceNumberProps) {
  return (
    <motion.span
      initial={{ scale: 0.75, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      transition={{ type: 'spring', stiffness: 280, damping: 18 }}
      className={className}
      style={style}
    >
      {children}
    </motion.span>
  )
}
