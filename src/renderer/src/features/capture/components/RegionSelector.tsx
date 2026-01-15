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
  const [mousePos, setMousePos] = useState<Position>({ x: 0, y: 0 })

  // Track mouse position and match with available windows (client-side)
  useEffect(() => {
    const handleGlobalMouseMove = (e: MouseEvent) => {
      const offsetX = windowBounds?.x || 0
      const offsetY = windowBounds?.y || 0
      const absoluteX = e.clientX + offsetX
      const absoluteY = e.clientY + offsetY

      setMousePos({ x: absoluteX, y: absoluteY })

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

      // If hovering over a window, capture it immediately (single click)
      if (hoveredWindow) {
        // logger.log('[RegionSelector] Click on window:', hoveredWindow.title)

        // Detect which display the window is on
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
        return
      }

      // Otherwise, start drawing region
      setIsDrawing(true)

      // Detect which display we're on
      const display = getDisplayAtPoint(absoluteX, absoluteY)
      if (display) {
        setDisplayId(display.id)
        setScaleFactor(display.scaleFactor)
        // logger.log(
        //   '[RegionSelector] Mouse on display:',
        //   display.id,
        //   'scaleFactor:',
        //   display.scaleFactor
        // )
      }

      const pos = { x: absoluteX, y: absoluteY }
      // logger.log('[RegionSelector] Mouse down - client:', e.clientX, e.clientY, 'absolute:', pos)
      setStartPos(pos)
      setEndPos(pos)
    },
    [windowBounds, getDisplayAtPoint, hoveredWindow, onRegionSelect]
  )

  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    // Global mousemove already handles endPos update for realtime drawing
    // This React event handler is kept for fallback but not needed
  }, [])

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
  }, [startPos, endPos, displayId, scaleFactor, onRegionSelect])

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
      onRegionSelect(newRegion)
    }

    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [currentRegion, onRegionSelect])

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

  // Get window highlight style (relative to overlay bounds)
  const getWindowHighlightStyle = (): React.CSSProperties | null => {
    if (!hoveredWindow || isDrawing || currentRegion) return null

    const offsetX = windowBounds?.x || 0
    const offsetY = windowBounds?.y || 0

    return {
      left: `${hoveredWindow.x - offsetX}px`,
      top: `${hoveredWindow.y - offsetY}px`,
      width: `${hoveredWindow.width}px`,
      height: `${hoveredWindow.height}px`
    }
  }

  // Calculate unified selector box style
  const getSelectorBoxStyle = (): React.CSSProperties => {
    const offsetX = windowBounds?.x || 0
    const offsetY = windowBounds?.y || 0

    // Priority: hoveredWindow (not dragging) > currentRegion > dragging selection
    if (hoveredWindow && !isDrawing && !currentRegion) {
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

    // Dragging - calculate from startPos and endPos
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

    return {}
  }

  // Check if selector should be visible
  const showSelector = Boolean(hoveredWindow || isDrawing || currentRegion)

  return (
    <div
      className="fixed inset-0"
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
    >
      {/* Unified selection box - for both window hover and manual drag */}
      {showSelector && (
        <>
          <div
            className="absolute pointer-events-none z-[2] transition-all duration-75"
            style={getSelectorBoxStyle()}
          />

          {/* Tooltip - only show when hovering window */}
          {hoveredWindow && !isDrawing && !currentRegion && (
            <div
              className="absolute pointer-events-none z-[3]"
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
