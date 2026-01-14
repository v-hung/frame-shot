/**
 * Capture Utilities
 * Helper functions for capture operations
 */

import type { CaptureRegion } from '../types/capture.types'

/**
 * Calculate scaled region coordinates for high-DPI displays
 */
export function scaleRegionCoordinates(
  region: CaptureRegion,
  scaleFactor: number
): CaptureRegion {
  return {
    ...region,
    x: Math.round(region.x * scaleFactor),
    y: Math.round(region.y * scaleFactor),
    width: Math.round(region.width * scaleFactor),
    height: Math.round(region.height * scaleFactor),
    scaleFactor
  }
}

/**
 * Validate region boundaries
 */
export function isValidRegion(region: CaptureRegion): boolean {
  return (
    region.x >= 0 &&
    region.y >= 0 &&
    region.width > 0 &&
    region.height > 0 &&
    region.scaleFactor > 0
  )
}

/**
 * Normalize region to ensure positive width/height
 * Handles cases where user drags from bottom-right to top-left
 */
export function normalizeRegion(
  startX: number,
  startY: number,
  endX: number,
  endY: number,
  displayId: string,
  scaleFactor: number
): CaptureRegion {
  return {
    x: Math.min(startX, endX),
    y: Math.min(startY, endY),
    width: Math.abs(endX - startX),
    height: Math.abs(endY - startY),
    displayId,
    scaleFactor
  }
}

/**
 * Check if a point is inside a region
 */
export function isPointInRegion(
  x: number,
  y: number,
  region: CaptureRegion
): boolean {
  return (
    x >= region.x &&
    x <= region.x + region.width &&
    y >= region.y &&
    y <= region.y + region.height
  )
}

/**
 * Calculate edge proximity for resize cursor
 * Returns which edge is close (top, bottom, left, right, corner)
 */
export function getEdgeProximity(
  x: number,
  y: number,
  region: CaptureRegion,
  threshold = 10
): string | null {
  const { x: rx, y: ry, width, height } = region

  const nearTop = Math.abs(y - ry) <= threshold
  const nearBottom = Math.abs(y - (ry + height)) <= threshold
  const nearLeft = Math.abs(x - rx) <= threshold
  const nearRight = Math.abs(x - (rx + width)) <= threshold

  if (nearTop && nearLeft) return 'nw' // northwest
  if (nearTop && nearRight) return 'ne' // northeast
  if (nearBottom && nearLeft) return 'sw' // southwest
  if (nearBottom && nearRight) return 'se' // southeast
  if (nearTop) return 'n' // north
  if (nearBottom) return 's' // south
  if (nearLeft) return 'w' // west
  if (nearRight) return 'e' // east

  return null
}
