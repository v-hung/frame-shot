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

interface WindowPickerAPI {
  getAtCursor: () => Promise<{
    success: boolean
    data?: {
      hwnd: number
      title: string
      processName: string
      bounds: { x: number; y: number; width: number; height: number }
      cursor: { x: number; y: number }
      isVisible: boolean
    }
    error?: string
  }>

  listAll: () => Promise<{
    success: boolean
    data?: {
      windows: Array<{
        hwnd: number
        title: string
        x: number
        y: number
        width: number
        height: number
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
    windowPickerAPI: WindowPickerAPI
  }
}
