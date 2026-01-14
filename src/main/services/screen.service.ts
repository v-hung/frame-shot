/**
 * Screen Service
 * Handles screen enumeration and capture using Electron desktopCapturer API
 */

import { screen, desktopCapturer } from 'electron'
import type { Display, CaptureRegion } from '../types/capture.types'

export class ScreenService {
  /**
   * List all available displays
   */
  async listDisplays(): Promise<Display[]> {
    const displays = screen.getAllDisplays()

    return displays.map((display, index) => ({
      id: display.id.toString(),
      bounds: display.bounds,
      scaleFactor: display.scaleFactor,
      rotation: display.rotation,
      internal: display.internal,
      label: `Monitor ${index + 1}`
    }))
  }

  /**
   * Get the display where the cursor is currently located
   */
  async getCursorDisplay(): Promise<Display | null> {
    const cursorPoint = screen.getCursorScreenPoint()
    const display = screen.getDisplayNearestPoint(cursorPoint)

    if (!display) return null

    return {
      id: display.id.toString(),
      bounds: display.bounds,
      scaleFactor: display.scaleFactor,
      rotation: display.rotation,
      internal: display.internal,
      label: 'Active Display'
    }
  }

  /**
   * Capture the entire screen for a specific display
   * @param displayId The display ID to capture
   * @returns NativeImage or null if capture fails
   */
  async captureScreen(displayId: string): Promise<Electron.NativeImage | null> {
    const sources = await desktopCapturer.getSources({
      types: ['screen'],
      thumbnailSize: { width: 3840, height: 2160 } // Support up to 4K
    })

    const source = sources.find((s) => s.display_id === displayId)
    if (!source) return null

    // Note: Thumbnail is full-res capture for screens
    return source.thumbnail
  }

  /**
   * Crop a region from a captured image
   * @param image The full screen capture
   * @param region The region to crop
   * @returns Cropped NativeImage
   */
  captureRegion(image: Electron.NativeImage, region: CaptureRegion): Electron.NativeImage {
    // Scale coordinates by DPI factor
    const scaledRegion = {
      x: Math.round(region.x * region.scaleFactor),
      y: Math.round(region.y * region.scaleFactor),
      width: Math.round(region.width * region.scaleFactor),
      height: Math.round(region.height * region.scaleFactor)
    }

    return image.crop(scaledRegion)
  }

  /**
   * Get cursor position for display detection
   */
  getCursorPosition(): { x: number; y: number } {
    const point = screen.getCursorScreenPoint()
    return { x: point.x, y: point.y }
  }
}
