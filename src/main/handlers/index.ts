import { ipcMain, BrowserWindow } from 'electron'
import { registerCaptureHandlers } from './capture.handlers'
import { registerWindowPickerHandlers } from './window-picker.handlers'

/**
 * Register logger IPC handlers
 */
function registerLoggerHandlers(): void {
  ipcMain.on('logger:log', (_, level: string, ...args) => {
    const prefix = '[Renderer]'
    if (level === 'error') {
      console.error(prefix, ...args)
    } else if (level === 'warn') {
      console.warn(prefix, ...args)
    } else {
      console.log(prefix, ...args)
    }
  })
}

export function registerHandlers(getCaptureWindow: () => BrowserWindow | null): void {
  // Register logger handlers
  registerLoggerHandlers()

  // Register capture-related IPC handlers
  registerCaptureHandlers()

  // Register window picker IPC handlers with captureWindow getter
  registerWindowPickerHandlers(getCaptureWindow)
}
