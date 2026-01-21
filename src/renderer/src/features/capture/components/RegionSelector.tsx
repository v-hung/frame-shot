/**
 * Region Selector Component
 * Handles rectangle selection with mouse dragging and keyboard nudging
 * Feature: 001-screenshot-capture (User Story 1)
 */

import { useState, useEffect, useCallback } from 'react'
import { DimensionDisplay } from './DimensionDisplay'

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
  processName: string
  windowBounds: { x: number; y: number; width: number; height: number } // Full window including title bar
  clientBounds: { x: number; y: number; width: number; height: number } // Content area only
  titleBarBounds: { x: number; y: number; width: number; height: number } // Title bar area
  isVisible: boolean
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
  const [cursorRegion, setCursorRegion] = useState<'title-bar' | 'client' | 'outside'>('outside')

  const DRAG_THRESHOLD = 5 // pixels to move before entering drawing mode

  // Track mouse position and detect windows using native API
  useEffect(() => {
    const handleGlobalMouseMove = (e: MouseEvent) => {
      const offsetX = windowBounds?.x || 0
      const offsetY = windowBounds?.y || 0
      const absoluteX = e.clientX + offsetX
      const absoluteY = e.clientY + offsetY

      // Check if we should enter drawing mode (drag threshold exceeded)
      if (startPos && !isDrawing) {
        const distance = Math.sqrt(
          Math.pow(absoluteX - startPos.x, 2) + Math.pow(absoluteY - startPos.y, 2)
        )
        if (distance > DRAG_THRESHOLD) {
          setIsDrawing(true)
          setEndPos({ x: absoluteX, y: absoluteY })
        }
      }

      // Update endPos if dragging (for realtime selection update)
      if (isDrawing && startPos) {
        setEndPos({ x: absoluteX, y: absoluteY })
      }

      // Only detect window when NOT drawing AND no current region
      if (!isDrawing && !currentRegion && availableWindows.length > 0) {
        // Find window at cursor position (client-side detection)
        const matchedWindow = availableWindows.find((win) => {
          const wb = win.windowBounds
          return (
            absoluteX >= wb.x &&
            absoluteX <= wb.x + wb.width &&
            absoluteY >= wb.y &&
            absoluteY <= wb.y + wb.height
          )
        })

        if (matchedWindow) {
          setHoveredWindow(matchedWindow)

          // Detect which region cursor is in
          const client = matchedWindow.clientBounds
          const windowBounds = matchedWindow.windowBounds

          // Check client area FIRST (more precise - actual content area)
          if (
            absoluteX >= client.x &&
            absoluteX <= client.x + client.width &&
            absoluteY >= client.y &&
            absoluteY <= client.y + client.height
          ) {
            setCursorRegion('client')
          }
          // If inside window but not in client area, it's title bar (includes tabs, address bar, etc)
          else if (
            absoluteX >= windowBounds.x &&
            absoluteX <= windowBounds.x + windowBounds.width &&
            absoluteY >= windowBounds.y &&
            absoluteY <= windowBounds.y + windowBounds.height
          ) {
            setCursorRegion('title-bar')
          } else {
            setCursorRegion('outside')
          }
        } else {
          setHoveredWindow(null)
          setCursorRegion('outside')
        }
      } else {
        setHoveredWindow(null)
        setCursorRegion('outside')
      }
    }

    window.addEventListener('mousemove', handleGlobalMouseMove)
    return () => window.removeEventListener('mousemove', handleGlobalMouseMove)
  }, [windowBounds, isDrawing, currentRegion, startPos, availableWindows])

  // Listen for display information
  useEffect(() => {
    window.captureAPI.onDisplays?.((displayList) => {
      // logger.log('[RegionSelector] Received displays:', displayList)
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
        // Determine which bounds to use based on cursor region
        let bounds = hoveredWindow.windowBounds // Default to full window

        if (cursorRegion === 'client') {
          // Cursor in client area - capture content only
          bounds = hoveredWindow.clientBounds
        } else if (cursorRegion === 'title-bar') {
          // Cursor in title bar - capture full window
          bounds = hoveredWindow.windowBounds
        }

        const display = getDisplayAtPoint(bounds.x, bounds.y)
        if (display) {
          onRegionSelect({
            x: bounds.x,
            y: bounds.y,
            width: bounds.width,
            height: bounds.height,
            displayId: display.id,
            scaleFactor: display.scaleFactor
          })
        }
      }
      // If not hovering window, just reset (no action)
      setStartPos(null)
      setEndPos(null)
      setIsDrawing(false)
      setCursorRegion('outside')
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
  }, [
    startPos,
    endPos,
    displayId,
    scaleFactor,
    onRegionSelect,
    hoveredWindow,
    cursorRegion,
    getDisplayAtPoint
  ])

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
      // Show different highlight based on cursor region
      let bounds = hoveredWindow.windowBounds // Default to full window

      if (cursorRegion === 'client') {
        // Highlight client area only
        bounds = hoveredWindow.clientBounds
      } else if (cursorRegion === 'title-bar') {
        // Highlight full window
        bounds = hoveredWindow.windowBounds
      }

      return {
        left: `${bounds.x - offsetX}px`,
        top: `${bounds.y - offsetY}px`,
        width: `${bounds.width}px`,
        height: `${bounds.height}px`,
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
                left: `${hoveredWindow.windowBounds.x - (windowBounds?.x || 0) + hoveredWindow.windowBounds.width / 2}px`,
                top: `${hoveredWindow.windowBounds.y - (windowBounds?.y || 0)}px`,
                transform: 'translate(-50%, calc(-100% - 1rem))'
              }}
            >
              <div className="rounded-xl bg-white/90 dark:bg-zinc-900/90 backdrop-blur border border-black/5 dark:border-white/10 shadow-lg shadow-black/10 px-4 py-3 text-sm text-zinc-900 dark:text-zinc-100 min-w-50">
                <div className="font-medium leading-snug truncate max-w-sm">
                  {hoveredWindow.title || '(No title)'}
                </div>
                <div className="mt-1.5 text-xs text-zinc-500 dark:text-zinc-400 flex flex-col gap-1">
                  <div className="flex items-center gap-2">
                    <span>
                      {cursorRegion === 'client'
                        ? `${hoveredWindow.clientBounds.width} × ${hoveredWindow.clientBounds.height}`
                        : `${hoveredWindow.windowBounds.width} × ${hoveredWindow.windowBounds.height}`}
                    </span>
                    <span className="opacity-40">•</span>
                    {cursorRegion === 'client' && (
                      <span className="text-green-600 dark:text-green-400 font-medium">
                        📄 Content Only
                      </span>
                    )}
                    {cursorRegion === 'title-bar' && (
                      <span className="text-blue-600 dark:text-blue-400 font-medium">
                        🖼️ Full Window
                      </span>
                    )}
                  </div>
                  <div className="text-blue-600 dark:text-blue-400 font-medium">
                    Click to capture
                  </div>
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
