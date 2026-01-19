/**
 * Capture Overlay Component
 * Region selection overlay UI (standalone window)
 * Feature: 001-screenshot-capture (User Story 1)
 */

import { useEffect, useState } from 'react'
import { RegionSelector } from './RegionSelector'
import { FlashEffect } from './FlashEffect'
import { CaptureRegion } from 'src/main/types/capture.types'
// import { desktopCapturer, screen } from 'electron'
import * as logger from '@renderer/utils/logger.utils'

interface WindowInfo {
  hwnd: number
  title: string
  x: number
  y: number
  width: number
  height: number
  zIndex: number
}

export function CaptureOverlay() {
  const [currentRegion, setCurrentRegion] = useState<CaptureRegion | null>(null)
  const [showFlash, setShowFlash] = useState(false)
  const [windowBounds, setWindowBounds] = useState<{
    x: number
    y: number
    width: number
    height: number
  } | null>(null)
  const [availableWindows, setAvailableWindows] = useState<WindowInfo[]>([])

  // Listen for window bounds from main process and fetch windows
  useEffect(() => {
    window.captureAPI.onWindowBounds?.((bounds) => {
      setWindowBounds(bounds)
    })

    // Fetch all windows ONCE when overlay opens
    ;(async () => {
      try {
        const windowsResult = await window.windowPickerAPI.listAll()
        if (windowsResult.success && windowsResult.data) {
          setAvailableWindows(windowsResult.data.windows)
        }
      } catch (error) {
        logger.error('[CaptureOverlay] Failed to fetch windows:', error)
      }
    })()

    return () => {
      window.captureAPI.removeListeners?.()
    }
  }, [])

  // Execute capture
  const executeCapture = async (region: CaptureRegion) => {
    try {
      const result = await window.captureAPI.execute({
        mode: 'region',
        region
      })

      if (result.success) {
        // Show flash effect - will auto-close window after animation
        setShowFlash(true)
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
      // ESC: Clear region or close overlay
      if (e.key === 'Escape') {
        if (currentRegion) {
          clearRegion()
        } else {
          cancelCapture()
        }
      }
    }

    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [currentRegion])

  return (
    <>
      <div className="fixed inset-0 z-99999 cursor-crosshair select-none overflow-hidden m-0 p-0">
        <RegionSelector
          windowBounds={windowBounds}
          availableWindows={availableWindows}
          onRegionSelect={(region) => {
            if (region) {
              setCurrentRegion(region)
              executeCapture(region)
            } else {
              setCurrentRegion(null)
            }
          }}
          currentRegion={currentRegion}
        />
      </div>
      {showFlash && (
        <FlashEffect
          onComplete={() => {
            setShowFlash(false)
            window.captureAPI.closeCaptureWindow?.()
          }}
        />
      )}
    </>
  )
}
