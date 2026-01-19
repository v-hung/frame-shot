/**
 * Region Selector Component
 * Handles rectangle selection with mouse dragging and keyboard nudging
 * Feature: 001-screenshot-capture (User Story 1)
 */

import { useState, useEffect, useCallback } from 'react'
import { DimensionDisplay } from './DimensionDisplay'
import logger from '@renderer/utils/logger.utils'

interface Position {
  x: number
  y: number
}

interface CaptureRegion {
  x: number
  y: number
  width: number
  height: number
  displayId: string
  scaleFactor: number
}

interface WindowInfo {
  hwnd: number
  title: string
  x: number
  y: number
  width: number
  height: number
  zIndex: number
}

interface RegionSelectorProps {
  windowBounds: { width: number; height: number; x: number; y: number } | null
  availableWindows: WindowInfo[]
  onRegionSelect: (region: CaptureRegion | null) => void
  currentRegion: CaptureRegion | null
}

interface DisplayInfo {
  id: string
  bounds: { x: number; y: number; width: number; height: number }
  scaleFactor: number
}

export function RegionSelector({
  windowBounds,
  availableWindows,
  onRegionSelect,
  currentRegion
}: RegionSelectorProps) {
  const [isDrawing, setIsDrawing] = useState(false)
  const [startPos, setStartPos] = useState<Position | null>(null)
  const [endPos, setEndPos] = useState<Position | null>(null)
  const [displayId, setDisplayId] = useState<string>('')
  const [scaleFactor, setScaleFactor] = useState<number>(1)
  const [displays, setDisplays] = useState<DisplayInfo[]>([])
  const [hoveredWindow, setHoveredWindow] = useState<WindowInfo | null>(null)
  // const [mousePos, setMousePos] = useState<Position>({ x: 0, y: 0 })

  const DRAG_THRESHOLD = 5 // pixels to move before entering drawing mode

  // Track mouse position and match with available windows (client-side)
  useEffect(() => {
    const handleGlobalMouseMove = (e: MouseEvent) => {
      const offsetX = windowBounds?.x || 0
      const offsetY = windowBounds?.y || 0
      const absoluteX = e.clientX + offsetX
      const absoluteY = e.clientY + offsetY

      // setMousePos({ x: absoluteX, y: absoluteY })

      // Check if we should enter drawing mode (drag threshold exceeded)
      if (startPos && !isDrawing) {
        const distance = Math.sqrt(
          Math.pow(absoluteX - startPos.x, 2) + Math.pow(absoluteY - startPos.y, 2)
        )
        if (distance > DRAG_THRESHOLD) {
          setIsDrawing(true)
          setEndPos({ x: absoluteX, y: absoluteY }) // Update endPos immediately when entering drawing mode
        }
      }

      // Update endPos if dragging (for realtime selection update)
      if (isDrawing && startPos) {
        setEndPos({ x: absoluteX, y: absoluteY })
      }

      // Only detect window when NOT drawing AND no current region
      if (!isDrawing && !currentRegion && availableWindows.length > 0) {
        // Find all windows that contain this point
        const matchedWindows = availableWindows.filter((win) => {
          return (
            absoluteX >= win.x &&
            absoluteX <= win.x + win.width &&
            absoluteY >= win.y &&
            absoluteY <= win.y + win.height
          )
        })

        // If multiple windows overlap, sort by zIndex to get the top-most one
        // Higher zIndex = on top
        if (matchedWindows.length > 0) {
          matchedWindows.sort((a, b) => b.zIndex - a.zIndex)
          setHoveredWindow(matchedWindows[0])
        } else {
          setHoveredWindow(null)
        }
      } else {
        setHoveredWindow(null)
      }
    }

    window.addEventListener('mousemove', handleGlobalMouseMove)
    return () => window.removeEventListener('mousemove', handleGlobalMouseMove)
  }, [windowBounds, availableWindows, isDrawing, currentRegion, startPos])

  // Listen for display information
  useEffect(() => {
    window.captureAPI.onDisplays?.((displayList) => {
      logger.log('[RegionSelector] Received displays:', displayList)
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
      // Adjust coordinates by window offset (for multi-monitor support)
      const offsetX = windowBounds?.x || 0
      const offsetY = windowBounds?.y || 0
      const absoluteX = e.clientX + offsetX
      const absoluteY = e.clientY + offsetY

      // Clear current region when starting new interaction
      if (currentRegion) {
        onRegionSelect(null)
      }

      // Reset old positions
      setStartPos(null)
      setEndPos(null)
      setIsDrawing(false)

      // Detect which display we're on
      const display = getDisplayAtPoint(absoluteX, absoluteY)
      if (display) {
        setDisplayId(display.id)
        setScaleFactor(display.scaleFactor)
      }

      // Only set start position, wait for mouseUp or drag to decide action
      const pos = { x: absoluteX, y: absoluteY }
      requestAnimationFrame(() => {
        setStartPos(pos)
        setEndPos(pos)
      })
    },
    [windowBounds, getDisplayAtPoint, onRegionSelect, currentRegion]
  )

  const handleMouseUp = useCallback(() => {
    if (!startPos || !displayId) return

    // Calculate drag distance
    const currentEndPos = endPos || startPos
    const distance = Math.sqrt(
      Math.pow(currentEndPos.x - startPos.x, 2) + Math.pow(currentEndPos.y - startPos.y, 2)
    )

    // If no significant drag (< threshold) - check if we should capture hovered window
    if (distance < DRAG_THRESHOLD) {
      // If hovering over a window, capture it
      if (hoveredWindow) {
        const display = getDisplayAtPoint(hoveredWindow.x, hoveredWindow.y)
        if (display) {
          onRegionSelect({
            x: hoveredWindow.x,
            y: hoveredWindow.y,
            width: hoveredWindow.width,
            height: hoveredWindow.height,
            displayId: display.id,
            scaleFactor: display.scaleFactor
          })
        }
      }
      // If not hovering window, just reset (no action)
      setStartPos(null)
      setEndPos(null)
      setIsDrawing(false)
      return
    }

    // Significant drag detected - capture the selected region
    setIsDrawing(false)

    const x = Math.min(startPos.x, currentEndPos.x)
    const y = Math.min(startPos.y, currentEndPos.y)
    const width = Math.abs(currentEndPos.x - startPos.x)
    const height = Math.abs(currentEndPos.y - startPos.y)

    // Only set region if area is significant (>10x10 pixels)
    if (width > 10 && height > 10) {
      onRegionSelect({
        x,
        y,
        width,
        height,
        displayId,
        scaleFactor
      })
    } else {
      // Reset if selection too small
      setStartPos(null)
      setEndPos(null)
    }
  }, [startPos, endPos, displayId, scaleFactor, onRegionSelect, hoveredWindow, getDisplayAtPoint])

  // Calculate unified selector box style
  const getSelectorBoxStyle = (): React.CSSProperties => {
    const offsetX = windowBounds?.x || 0
    const offsetY = windowBounds?.y || 0

    // Priority: isDrawing (override currentRegion) > hoveredWindow > currentRegion

    // Dragging - calculate from startPos and endPos (HIGHEST PRIORITY)
    if (isDrawing && startPos && endPos) {
      const x = Math.min(startPos.x, endPos.x) - offsetX
      const y = Math.min(startPos.y, endPos.y) - offsetY
      const width = Math.abs(endPos.x - startPos.x)
      const height = Math.abs(endPos.y - startPos.y)

      return {
        left: `${x}px`,
        top: `${y}px`,
        width: `${width}px`,
        height: `${height}px`,
        boxShadow: '0 0 0 9999px rgba(0,0,0,0.5)'
      }
    }

    if (hoveredWindow && !currentRegion) {
      return {
        left: `${hoveredWindow.x - offsetX}px`,
        top: `${hoveredWindow.y - offsetY}px`,
        width: `${hoveredWindow.width}px`,
        height: `${hoveredWindow.height}px`,
        boxShadow: '0 0 0 9999px rgba(0,0,0,0.5)'
      }
    }

    if (currentRegion) {
      return {
        left: `${currentRegion.x - offsetX}px`,
        top: `${currentRegion.y - offsetY}px`,
        width: `${currentRegion.width}px`,
        height: `${currentRegion.height}px`,
        boxShadow: '0 0 0 9999px rgba(0,0,0,0.5)'
      }
    }

    return {}
  }

  // Check if selector should be visible
  const showSelector = Boolean(hoveredWindow || isDrawing || currentRegion)

  return (
    <div className="fixed inset-0" onMouseDown={handleMouseDown} onMouseUp={handleMouseUp}>
      {/* Unified selection box - for both window hover and manual drag */}
      {showSelector && (
        <>
          <div
            className={`absolute pointer-events-none z-2 ${isDrawing ? '' : 'transition-all duration-75'}`}
            style={getSelectorBoxStyle()}
          />

          {/* Tooltip - only show when hovering window */}
          {hoveredWindow && !isDrawing && !currentRegion && (
            <div
              className="absolute pointer-events-none z-3"
              style={{
                left: `${hoveredWindow.x - (windowBounds?.x || 0) + hoveredWindow.width / 2}px`,
                top: `${hoveredWindow.y - (windowBounds?.y || 0)}px`,
                transform: 'translate(-50%, calc(-100% - 1rem))'
              }}
            >
              <div className="rounded-xl bg-white/90 dark:bg-zinc-900/90 backdrop-blur border border-black/5 dark:border-white/10 shadow-lg shadow-black/10 px-4 py-3 text-sm text-zinc-900 dark:text-zinc-100 min-w-50">
                <div className="font-medium leading-snug truncate">
                  {hoveredWindow.title || '(No title)'}
                </div>
                <div className="mt-1.5 text-xs text-zinc-500 dark:text-zinc-400 flex items-center gap-2">
                  <span>
                    {hoveredWindow.width} × {hoveredWindow.height}
                  </span>
                  <span className="opacity-40">•</span>
                  <span className="text-blue-600 dark:text-blue-400 font-medium">
                    Click to capture
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* Dimension display - show when dragging or region selected */}
          {(isDrawing || currentRegion) && (
            <DimensionDisplay
              width={currentRegion?.width ?? Math.abs((endPos?.x ?? 0) - (startPos?.x ?? 0))}
              height={currentRegion?.height ?? Math.abs((endPos?.y ?? 0) - (startPos?.y ?? 0))}
              x={currentRegion?.x ?? Math.min(startPos?.x ?? 0, endPos?.x ?? 0)}
              y={currentRegion?.y ?? Math.min(startPos?.y ?? 0, endPos?.y ?? 0)}
            />
          )}
        </>
      )}
    </div>
  )
}
