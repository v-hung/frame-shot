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
  onHotkeyTriggered: (callback: (mode: string) => void) => void
  removeHotkeyListener: () => void
  onWindowBounds: (
    callback: (bounds: { x: number; y: number; width: number; height: number }) => void
  ) => void
  onDisplays: (
    callback: (
      displays: Array<{
        id: string
        bounds: { x: number; y: number; width: number; height: number }
        scaleFactor: number
      }>
    ) => void
  ) => void
  onCaptureExit: (callback: () => void) => void
  closeCaptureWindow: () => void
}

declare global {
  interface Window {
    electron: ElectronAPI
    api: unknown
    captureAPI: CaptureAPI
  }
}
