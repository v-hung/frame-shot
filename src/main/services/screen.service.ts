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
   * @param displayBounds Display bounds for scale calculation
   * @returns Cropped NativeImage
   */
  captureRegion(
    image: Electron.NativeImage,
    region: CaptureRegion,
    displayBounds: { width: number; height: number }
  ): Electron.NativeImage {
    const imageSize = image.getSize()
    console.log('[ScreenService] Image size:', imageSize)
    console.log('[ScreenService] Display bounds:', displayBounds)
    console.log('[ScreenService] Region to crop:', region)

    // Calculate scale factor from image size vs display size
    // desktopCapturer returns HiDPI images (e.g., 3840x2160 for 1920x1080 display)
    const scaleX = imageSize.width / displayBounds.width
    const scaleY = imageSize.height / displayBounds.height

    console.log('[ScreenService] Scale factors:', { scaleX, scaleY })

    // Scale coordinates to match image resolution
    const cropRect = {
      x: Math.round(region.x * scaleX),
      y: Math.round(region.y * scaleY),
      width: Math.round(region.width * scaleX),
      height: Math.round(region.height * scaleY)
    }

    console.log('[ScreenService] Crop rect (scaled):', cropRect)

    // Ensure crop rect is within image bounds
    if (
      cropRect.x < 0 ||
      cropRect.y < 0 ||
      cropRect.x + cropRect.width > imageSize.width ||
      cropRect.y + cropRect.height > imageSize.height
    ) {
      console.warn('[ScreenService] Crop rect out of bounds, adjusting...')
      cropRect.x = Math.max(0, cropRect.x)
      cropRect.y = Math.max(0, cropRect.y)
      cropRect.width = Math.min(cropRect.width, imageSize.width - cropRect.x)
      cropRect.height = Math.min(cropRect.height, imageSize.height - cropRect.y)
    }

    return image.crop(cropRect)
  }

  /**
   * Get cursor position for display detection
   */
  getCursorPosition(): { x: number; y: number } {
    const point = screen.getCursorScreenPoint()
    return { x: point.x, y: point.y }
  }
}
