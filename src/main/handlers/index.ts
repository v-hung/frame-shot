import { registerCaptureHandlers } from './capture.handlers'
import { registerWindowPickerHandlers } from './window-picker.handlers'

export function registerHandlers(): void {
  // Register capture-related IPC handlers
  registerCaptureHandlers()

  // Register window picker IPC handlers
  registerWindowPickerHandlers()
}
