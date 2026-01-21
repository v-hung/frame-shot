/**
 * Screenshot Capture Type Definitions
 * Feature: 001-screenshot-capture
 */

export type CaptureModeType = 'region' | 'fullscreen' | 'window'

export interface CaptureRegion {
  x: number
  y: number
  width: number
  height: number
  displayId: string
  scaleFactor: number
}

export interface CaptureWindow {
  id: string
  name: string
  bounds: { x: number; y: number; width: number; height: number } // Deprecated: use windowBounds
  windowBounds: { x: number; y: number; width: number; height: number } // Full window including title bar
  clientBounds: { x: number; y: number; width: number; height: number } // Content area (browsers: web content only; apps: client area)
  titleBarBounds: { x: number; y: number; width: number; height: number } // Title bar area
  thumbnail: string // Base64 PNG
  appName: string
  isVisible: boolean
}

export interface Display {
  id: string
  bounds: { x: number; y: number; width: number; height: number }
  scaleFactor: number
  rotation: number
  internal: boolean
  label: string
}

export interface CaptureExecuteParams {
  mode: CaptureModeType
  region?: CaptureRegion
  window?: { id: string }
  display?: { id: string }
}

export interface CaptureExecuteResponse {
  success: boolean
  filePath?: string
  error?: string
  timestamp: string
  dimensions: { width: number; height: number }
}

export interface CaptureSettings {
  defaultSaveLocation: string
  fileFormat: 'png'
  hotkeys: {
    region: string
    fullscreen: string
    window: string
  }
  postCaptureAction: 'clipboard-and-save'
  fileNamingPattern: 'timestamp'
}
