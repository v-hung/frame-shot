import { registerCaptureHandlers } from './capture.handlers'

export function registerHandlers(): void {
  // Register capture-related IPC handlers
  registerCaptureHandlers()
}
