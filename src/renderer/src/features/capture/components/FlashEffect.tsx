/**
 * Flash Effect Component
 * Visual feedback animation after screenshot capture
 * Feature: 001-screenshot-capture (FR-006)
 */

import { useEffect, useState } from 'react'

interface FlashEffectProps {
  onComplete?: () => void
}

export function FlashEffect({ onComplete }: FlashEffectProps) {
  const [visible, setVisible] = useState(true)

  useEffect(() => {
    // Flash effect lasts 200ms
    const timer = setTimeout(() => {
      setVisible(false)
      onComplete?.()
    }, 200)

    return () => clearTimeout(timer)
  }, [onComplete])

  if (!visible) return null

  return (
    <div
      className="capture-flash"
      style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: 'white',
        animation: 'flash 200ms ease-out',
        pointerEvents: 'none',
        zIndex: 99999
      }}
    />
  )
}
