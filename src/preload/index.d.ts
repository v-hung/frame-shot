import { ElectronAPI } from '@electron-toolkit/preload'
import type {
  CaptureExecuteParams,
  CaptureExecuteResponse,
  Display
} from '../main/types/capture.types'

interface CaptureAPI {
  listDisplays: () => Promise<{ displays: Display[] }>
  getCursorPosition: () => Promise<{ x: number; y: number; displayId: string }>
  execute: (params: CaptureExecuteParams) => Promise<CaptureExecuteResponse>
}

declare global {
  interface Window {
    electron: ElectronAPI
    api: unknown
    captureAPI: CaptureAPI
  }
}
