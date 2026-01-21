/**
 * Window Service
 * Handles window enumeration and capture using Electron desktopCapturer API
 * Feature: 001-screenshot-capture (User Story 3)
 */

import { desktopCapturer } from 'electron'
import type { CaptureWindow } from '../types/capture.types'

export class WindowService {
  /**
   * List all capturable windows
   * @param includeMinimized Whether to include minimized windows
   * @returns Array of capturable windows with thumbnails
   */
  async listWindows(includeMinimized = false): Promise<CaptureWindow[]> {
    const sources = await desktopCapturer.getSources({
      types: ['window'],
      thumbnailSize: { width: 320, height: 180 } // 16:9 thumbnail
    })

    return sources
      .filter((source) => {
        // Exclude FrameShot's own windows
        if (source.name.includes('FrameShot') || source.name.includes('Frame Shot')) {
          return false
        }

        // Filter minimized windows if requested
        if (!includeMinimized && source.name === '') {
          return false
        }

        return true
      })
      .map((source) => ({
        id: source.id,
        name: source.name,
        bounds: { x: 0, y: 0, width: 0, height: 0 }, // Deprecated: use windowBounds
        windowBounds: { x: 0, y: 0, width: 0, height: 0 }, // Will be populated when needed
        clientBounds: { x: 0, y: 0, width: 0, height: 0 }, // Will be populated when needed
        titleBarBounds: { x: 0, y: 0, width: 0, height: 0 }, // Will be populated when needed
        thumbnail: source.thumbnail.toDataURL(), // Convert to base64
        appName: this.extractAppName(source.name),
        isVisible: source.name !== ''
      }))
  }

  /**
   * Capture a specific window by ID
   */
  async captureWindow(windowId: string): Promise<Electron.NativeImage | null> {
    const sources = await desktopCapturer.getSources({
      types: ['window'],
      thumbnailSize: { width: 3840, height: 2160 } // Full resolution
    })

    const source = sources.find((s) => s.id === windowId)
    if (!source) return null

    return source.thumbnail
  }

  /**
   * Extract application name from window title
   * Example: "Document.docx - Microsoft Word" → "Microsoft Word"
   */
  private extractAppName(windowTitle: string): string {
    // Try to extract app name after last dash
    const parts = windowTitle.split(' - ')
    if (parts.length > 1) {
      return parts[parts.length - 1].trim()
    }

    // Try to extract app name from window title
    const appNameMatch = windowTitle.match(/\(([^)]+)\)$/)
    if (appNameMatch) {
      return appNameMatch[1]
    }

    // Fallback to full title
    return windowTitle
  }
}
