/**
 * Capture Overlay Component
 * Region selection overlay UI (standalone window)
 * Feature: 001-screenshot-capture (User Story 1)
 */

import { useEffect, useState } from 'react'
import { RegionSelector } from './RegionSelector'
import { FlashEffect } from './FlashEffect'
import { CaptureRegion } from 'src/main/types/capture.types'
import { desktopCapturer, screen } from 'electron'

export function CaptureOverlay() {
  const [currentRegion, setCurrentRegion] = useState<CaptureRegion | null>(null)
  const [showFlash, setShowFlash] = useState(false)
  const [windowBounds, setWindowBounds] = useState<{
    x: number
    y: number
    width: number
    height: number
  } | null>(null)

  console.log('[CaptureOverlay] Current region:', currentRegion)

  // Listen for window bounds from main process
  useEffect(() => {
    window.captureAPI.onWindowBounds?.((bounds) => {
      console.log('[CaptureOverlay] Received window bounds:', bounds)
      setWindowBounds(bounds)
    })
    ;(async () => {
      const sources = await desktopCapturer.getSources({
        types: ['window']
        // thumbnailSize: { width: 3840, height: 2160 } // Full resolution
      })

      const displays = screen.getAllDisplays()

      console.log('[CaptureOverlay] Available sources:', sources, displays)
    })()

    return () => {
      window.captureAPI.removeListeners?.()
    }
  }, [])

  // Execute capture
  const executeCapture = async () => {
    if (!currentRegion) return

    try {
      const result = await window.captureAPI.execute({
        mode: 'region',
        region: currentRegion
      })

      console.log('[CaptureOverlay] Capture result:', result)

      if (result.success) {
        // Show flash effect
        setShowFlash(true)
        // Close capture window after flash
        setTimeout(() => {
          window.captureAPI.closeCaptureWindow?.()
        }, 200)
      } else {
        console.error('Capture failed:', result.error)
        // TODO: Show error message to user
      }
    } catch (error) {
      console.error('Capture error:', error)
    }
  }

  // Cancel capture
  const cancelCapture = () => {
    setCurrentRegion(null)
    window.captureAPI.closeCaptureWindow?.()
  }

  // Clear region selection
  const clearRegion = () => {
    setCurrentRegion(null)
  }

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // ESC: Cancel capture or clear selection (FR-008)
      if (e.key === 'Escape') {
        if (currentRegion) {
          clearRegion()
        } else {
          cancelCapture()
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentRegion])

  return (
    <>
      <div className="fixed inset-0 z-99999 bg-black/30 cursor-crosshair select-none overflow-hidden m-0 p-0">
        <RegionSelector
          windowBounds={windowBounds}
          onRegionSelect={setCurrentRegion}
          currentRegion={currentRegion}
        />
      </div>
      {showFlash && <FlashEffect onComplete={() => setShowFlash(false)} />}
    </>
  )
}
