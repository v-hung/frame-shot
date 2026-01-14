/**
 * Capture Overlay Component
 * Full-screen overlay for screenshot capture UI
 * Feature: 001-screenshot-capture (User Story 1)
 */

import { useEffect, useState } from 'react'
import { useCaptureStore } from '@renderer/stores/captureStore'
import { RegionSelector } from './RegionSelector'
import { WindowPicker } from './WindowPicker'
import { FlashEffect } from './FlashEffect'
import './CaptureOverlay.css'

export function CaptureOverlay() {
  const { isActive, mode, cancelCapture, executeCapture, currentRegion } = useCaptureStore()
  const [showFlash, setShowFlash] = useState(false)
  const [windowBounds, setWindowBounds] = useState<{
    x: number
    y: number
    width: number
    height: number
  } | null>(null)

  console.log('[CaptureOverlay] Render - isActive:', isActive, 'mode:', mode)

  // Listen for window bounds from main process
  useEffect(() => {
    window.captureAPI.onWindowBounds((bounds) => {
      console.log('[CaptureOverlay] Received window bounds:', bounds)
      setWindowBounds(bounds)
    })
  }, [])

  // Handle fullscreen capture immediately with flash
  useEffect(() => {
    if (isActive && mode === 'fullscreen') {
      // Execute on next tick to avoid setState-in-effect warning
      const timer = setTimeout(() => {
        setShowFlash(true)
        executeCapture()
      }, 0)
      return () => clearTimeout(timer)
    }
    return undefined
  }, [isActive, mode, executeCapture])

  useEffect(() => {
    if (!isActive) return

    const handleKeyDown = (e: KeyboardEvent) => {
      // ESC: Cancel capture or clear selection (FR-008)
      if (e.key === 'Escape') {
        if (currentRegion) {
          useCaptureStore.getState().clearRegion()
        } else {
          cancelCapture()
          // Close the capture window
          window.captureAPI.closeCaptureWindow()
        }
      }

      // Enter: Confirm capture (FR-009)
      if (e.key === 'Enter' && currentRegion) {
        setShowFlash(true)
        executeCapture()
      }
    }

    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [isActive, currentRegion, cancelCapture, executeCapture])

  // Don't render anything if not active and no flash
  if (!isActive && !showFlash) {
    return null
  }

  return (
    <>
      {isActive && (
        <div className="capture-overlay">
          {mode === 'region' && <RegionSelector windowBounds={windowBounds} />}
          {mode === 'window' && <WindowPicker />}
        </div>
      )}
      {showFlash && <FlashEffect onComplete={() => setShowFlash(false)} />}
    </>
  )
}
