/**
 * Region Selector Component
 * Handles rectangle selection with mouse dragging and keyboard nudging
 * Feature: 001-screenshot-capture (User Story 1)
 */

import { useState, useEffect, useCallback } from 'react'
import { useCaptureStore } from '@renderer/stores/captureStore'
import { DimensionDisplay } from './DimensionDisplay'

interface Position {
  x: number
  y: number
}

interface RegionSelectorProps {
  windowBounds: { width: number; height: number; x: number; y: number } | null
}

interface DisplayInfo {
  id: string
  bounds: { x: number; y: number; width: number; height: number }
  scaleFactor: number
}

export function RegionSelector({ windowBounds }: RegionSelectorProps) {
  const { setRegion, currentRegion, executeCapture } = useCaptureStore()
  const [isDrawing, setIsDrawing] = useState(false)
  const [startPos, setStartPos] = useState<Position | null>(null)
  const [endPos, setEndPos] = useState<Position | null>(null)
  const [displayId, setDisplayId] = useState<string>('')
  const [scaleFactor, setScaleFactor] = useState<number>(1)
  const [displays, setDisplays] = useState<DisplayInfo[]>([])

  console.log('[RegionSelector] Window bounds:', windowBounds)

  // Listen for display information
  useEffect(() => {
    window.captureAPI.onDisplays((displayList) => {
      console.log('[RegionSelector] Received displays:', displayList)
      setDisplays(displayList)
      if (displayList.length > 0) {
        setDisplayId(displayList[0].id)
        setScaleFactor(displayList[0].scaleFactor)
      }
    })
  }, [])

  // Detect which display the mouse is on
  const getDisplayAtPoint = useCallback(
    (absoluteX: number, absoluteY: number): DisplayInfo | null => {
      for (const display of displays) {
        const { x, y, width, height } = display.bounds
        if (absoluteX >= x && absoluteX < x + width && absoluteY >= y && absoluteY < y + height) {
          return display
        }
      }
      return displays[0] || null
    },
    [displays]
  )

  // Mouse handlers for drawing rectangle
  const handleMouseDown = useCallback(
    (e: React.MouseEvent) => {
      setIsDrawing(true)
      // Adjust coordinates by window offset (for multi-monitor support)
      const offsetX = windowBounds?.x || 0
      const offsetY = windowBounds?.y || 0
      const absoluteX = e.clientX + offsetX
      const absoluteY = e.clientY + offsetY

      // Detect which display we're on
      const display = getDisplayAtPoint(absoluteX, absoluteY)
      if (display) {
        setDisplayId(display.id)
        setScaleFactor(display.scaleFactor)
        console.log(
          '[RegionSelector] Mouse on display:',
          display.id,
          'scaleFactor:',
          display.scaleFactor
        )
      }

      const pos = { x: absoluteX, y: absoluteY }
      console.log('[RegionSelector] Mouse down - client:', e.clientX, e.clientY, 'absolute:', pos)
      setStartPos(pos)
      setEndPos(pos)
    },
    [windowBounds, getDisplayAtPoint]
  )

  const handleMouseMove = useCallback(
    (e: React.MouseEvent) => {
      if (!isDrawing || !startPos) return
      const offsetX = windowBounds?.x || 0
      const offsetY = windowBounds?.y || 0
      setEndPos({ x: e.clientX + offsetX, y: e.clientY + offsetY })
    },
    [isDrawing, startPos, windowBounds]
  )

  const handleMouseUp = useCallback(() => {
    if (!startPos || !endPos || !displayId) return

    setIsDrawing(false)

    // Calculate region dimensions
    const x = Math.min(startPos.x, endPos.x)
    const y = Math.min(startPos.y, endPos.y)
    const width = Math.abs(endPos.x - startPos.x)
    const height = Math.abs(endPos.y - startPos.y)

    // Only set region if area is significant (>10x10 pixels)
    if (width > 10 && height > 10) {
      setRegion({
        x,
        y,
        width,
        height,
        displayId,
        scaleFactor
      })

      // Auto-execute capture after mouse release (FR-009)
      setTimeout(() => {
        executeCapture()
      }, 50)
    } else {
      // Reset if selection too small
      setStartPos(null)
      setEndPos(null)
    }
  }, [startPos, endPos, displayId, scaleFactor, setRegion, executeCapture])

  // Arrow key nudging (T024.5: FR-009)
  useEffect(() => {
    if (!currentRegion) return

    const handleKeyDown = (e: KeyboardEvent) => {
      const nudgeAmount = e.shiftKey ? 10 : 1 // 10px with Shift, 1px default

      const newRegion = { ...currentRegion }

      switch (e.key) {
        case 'ArrowLeft':
          newRegion.x -= nudgeAmount
          break
        case 'ArrowRight':
          newRegion.x += nudgeAmount
          break
        case 'ArrowUp':
          newRegion.y -= nudgeAmount
          break
        case 'ArrowDown':
          newRegion.y += nudgeAmount
          break
        default:
          return
      }

      e.preventDefault()
      setRegion(newRegion)
    }

    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [currentRegion, setRegion])

  // Calculate rectangle dimensions for rendering
  const getSelectionStyle = (): React.CSSProperties => {
    if (!startPos || !endPos) return {}

    // Subtract window offset for rendering (coordinates are absolute, need to make them relative)
    const offsetX = windowBounds?.x || 0
    const offsetY = windowBounds?.y || 0

    const x = Math.min(startPos.x, endPos.x) - offsetX
    const y = Math.min(startPos.y, endPos.y) - offsetY
    const width = Math.abs(endPos.x - startPos.x)
    const height = Math.abs(endPos.y - startPos.y)

    return {
      left: `${x}px`,
      top: `${y}px`,
      width: `${width}px`,
      height: `${height}px`
    }
  }

  return (
    <div
      className="region-selector"
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      style={{ position: 'fixed', inset: 0 }}
    >
      {(isDrawing || currentRegion) && (
        <>
          <div
            className="region-selection"
            style={currentRegion ? undefined : getSelectionStyle()}
          />
          <DimensionDisplay
            width={currentRegion?.width ?? Math.abs((endPos?.x ?? 0) - (startPos?.x ?? 0))}
            height={currentRegion?.height ?? Math.abs((endPos?.y ?? 0) - (startPos?.y ?? 0))}
            x={currentRegion?.x ?? Math.min(startPos?.x ?? 0, endPos?.x ?? 0)}
            y={currentRegion?.y ?? Math.min(startPos?.y ?? 0, endPos?.y ?? 0)}
          />
        </>
      )}
    </div>
  )
}
