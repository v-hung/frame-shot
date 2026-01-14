/**
 * Capture Service
 * Core orchestration for screenshot capture operations
 */

import { clipboard, Notification } from 'electron'
import { ScreenService } from './screen.service'
import { WindowService } from './window.service'
import { FileService } from './file.service'
import type { CaptureExecuteParams, CaptureExecuteResponse, Display } from '../types/capture.types'

export class CaptureService {
  private screenService = new ScreenService()
  private windowService = new WindowService()
  private fileService = new FileService()

  /**
   * Execute a screenshot capture
   * @param params Capture parameters (mode, region, window, display)
   * @returns Capture result with file path and metadata
   */
  async execute(params: CaptureExecuteParams): Promise<CaptureExecuteResponse> {
    try {
      // T070: Validate capture dimensions
      if (params.region) {
        const { width, height } = params.region
        if (width > 16384 || height > 16384) {
          return {
            success: false,
            error: 'Capture area too large. Maximum size is 16384x16384 pixels.',
            timestamp: new Date().toISOString(),
            dimensions: { width, height }
          }
        }
      }

      // T069: Capture with timeout
      const capturePromise = this.captureImage(params)
      const timeoutPromise = new Promise<null>((_, reject) =>
        setTimeout(() => reject(new Error('Capture timeout (>500ms)')), 500)
      )

      const image = await Promise.race([capturePromise, timeoutPromise])

      if (!image) {
        return {
          success: false,
          error: 'Failed to capture image',
          timestamp: new Date().toISOString(),
          dimensions: { width: 0, height: 0 }
        }
      }

      // Parallel execution: clipboard + file save (FR-010)
      const buffer = image.toPNG()
      const [_, filePath] = await Promise.all([
        this.copyToClipboard(image),
        this.fileService.saveImage(buffer)
      ])

      // Show notification (FR-007)
      this.showNotification(filePath, image)

      return {
        success: true,
        filePath,
        timestamp: new Date().toISOString(),
        dimensions: image.getSize()
      }
    } catch (error) {
      // T067: Permission denied error handling
      const errorMessage = error instanceof Error ? error.message : 'Unknown error'
      const isPermissionError =
        errorMessage.includes('permission') ||
        errorMessage.includes('denied') ||
        errorMessage.includes('not authorized')

      return {
        success: false,
        error: isPermissionError
          ? 'Screen recording permission denied. Please grant permission in System Settings > Privacy & Security > Screen Recording.'
          : errorMessage,
        timestamp: new Date().toISOString(),
        dimensions: { width: 0, height: 0 }
      }
    }
  }

  /**
   * Capture image based on mode
   */
  private async captureImage(params: CaptureExecuteParams): Promise<Electron.NativeImage | null> {
    switch (params.mode) {
      case 'fullscreen': {
        const display = params.display
          ? await this.getDisplayById(params.display.id)
          : await this.screenService.getCursorDisplay()

        if (!display) return null
        return this.screenService.captureScreen(display.id)
      }

      case 'region': {
        if (!params.region) return null
        const display = await this.getDisplayById(params.region.displayId)
        if (!display) return null

        const fullImage = await this.screenService.captureScreen(display.id)
        if (!fullImage) return null

        // Convert absolute coordinates to display-relative coordinates
        const relativeRegion = {
          ...params.region,
          x: params.region.x - display.bounds.x,
          y: params.region.y - display.bounds.y
        }

        console.log('[CaptureService] Convert coordinates:', {
          absolute: { x: params.region.x, y: params.region.y },
          displayBounds: display.bounds,
          relative: { x: relativeRegion.x, y: relativeRegion.y }
        })

        return this.screenService.captureRegion(fullImage, relativeRegion, display.bounds)
      }

      case 'window': {
        if (!params.window) return null
        return this.windowService.captureWindow(params.window.id)
      }
    }
  }

  /**
   * Get display by ID
   */
  private async getDisplayById(id: string): Promise<Display | null> {
    const displays = await this.screenService.listDisplays()
    return displays.find((d) => d.id === id) || null
  }

  /**
   * Copy image to clipboard
   */
  private async copyToClipboard(image: Electron.NativeImage): Promise<void> {
    clipboard.writeImage(image)
  }

  /**
   * Show system notification with thumbnail
   */
  private showNotification(filePath: string, image: Electron.NativeImage): void {
    const thumbnail = image.resize({ width: 64, height: 64 })

    const notification = new Notification({
      title: 'Screenshot captured',
      body: `Saved to ${filePath}`,
      icon: thumbnail
    })

    // FR-016: Click to open file location
    notification.on('click', () => {
      import('electron').then(({ shell }) => {
        shell.showItemInFolder(filePath)
      })
    })

    notification.show()
  }
}
