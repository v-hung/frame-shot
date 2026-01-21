/**
 * Dimension Display Component
 * Shows real-time width x height dimensions during selection
 * Feature: 001-screenshot-capture (User Story 1 - FR-003)
 */

interface DimensionDisplayProps {
  width: number
  height: number
  x: number
  y: number
}

export function DimensionDisplay({ width, height, x, y }: DimensionDisplayProps) {
  // Position above the selection rectangle, or below if near top of screen
  const displayY = y > 40 ? y - 30 : y + 10
  const displayX = x + width / 2 - 50 // Center above rectangle

  return (
    <div
      className="absolute px-2 py-1 bg-black/80 text-white text-xs font-mono rounded whitespace-nowrap pointer-events-none z-3"
      style={{
        left: `${displayX}px`,
        top: `${displayY}px`
      }}
    >
      {Math.round(width)} × {Math.round(height)}
    </div>
  )
}
