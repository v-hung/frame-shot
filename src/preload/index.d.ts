import { ElectronAPI } from '@electron-toolkit/preload'
import type {
  CaptureExecuteParams,
  CaptureExecuteResponse,
  CaptureWindow,
  Display
} from '../main/types/capture.types'

interface CaptureAPI {
  listDisplays: () => Promise<{ displays: Display[] }>
  listWindows: (includeMinimized?: boolean) => Promise<{ windows: CaptureWindow[] }>
  getCursorPosition: () => Promise<{ x: number; y: number; displayId: string }>
  getWindowAtPosition: (
    x: number,
    y: number
  ) => Promise<{
    success: boolean
    window?: {
      hwnd: number
      title: string
      x: number
      y: number
      width: number
      height: number
    }
    error?: string
  }>
  execute: (params: CaptureExecuteParams) => Promise<CaptureExecuteResponse>
  // Capture window specific methods
  onCaptureMode?: (callback: (mode: string) => void) => void
  onWindowBounds?: (
    callback: (bounds: { x: number; y: number; width: number; height: number }) => void
  ) => void
  onDisplays?: (
    callback: (
      displays: Array<{
        id: string
        bounds: { x: number; y: number; width: number; height: number }
        scaleFactor: number
      }>
    ) => void
  ) => void
  closeCaptureWindow?: () => void
  removeListeners?: () => void
}

interface LoggerAPI {
  log: (...args: any[]) => void
  error: (...args: any[]) => void
  warn: (...args: any[]) => void
}

interface WindowPickerAPI {
  listAll: () => Promise<{
    success: boolean
    data?: {
      windows: Array<{
        hwnd: number
        title: string
        processName: string
        windowBounds: { x: number; y: number; width: number; height: number }
        clientBounds: { x: number; y: number; width: number; height: number }
        titleBarBounds: { x: number; y: number; width: number; height: number }
        x: number
        y: number
        width: number
        height: number
        zIndex: number
        isVisible: boolean
      }>
    }
    error?: string
  }>
}

declare global {
  interface Window {
    electron: ElectronAPI
    api: unknown
    captureAPI: CaptureAPI
    loggerAPI: LoggerAPI
    windowPickerAPI: WindowPickerAPI
  }
}
