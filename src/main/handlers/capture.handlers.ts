/**
 * Capture IPC Handlers
 * Handles IPC communication for screenshot capture operations
 */

import { ipcMain, BrowserWindow } from 'electron'
import { CaptureService } from '../services/capture.service'
import { ScreenService } from '../services/screen.service'
import { WindowService } from '../services/window.service'
import { NativeProcessService } from '../services/native-process.service'
import type { CaptureExecuteParams } from '../types/capture.types'

const captureService = new CaptureService()
const screenService = new ScreenService()
const windowService = new WindowService()
const nativeService = new NativeProcessService()

/**
 * Register all capture-related IPC handlers
 */
export function registerCaptureHandlers(): void {
  // List all available displays
  ipcMain.handle('capture:list-displays', async () => {
    const displays = await screenService.listDisplays()
    return { displays }
  })

  // Get cursor position and active display
  ipcMain.handle('capture:get-cursor-position', async () => {
    const position = screenService.getCursorPosition()
    const display = await screenService.getCursorDisplay()

    if (!display) {
      throw new Error('No display found')
    }

    return {
      x: position.x,
      y: position.y,
      displayId: display.id
    }
  })

  // List all capturable windows
  ipcMain.handle('capture:list-windows', async (_, { includeMinimized = false }) => {
    const windows = await windowService.listWindows(includeMinimized)
    return { windows }
  })

  // Execute capture
  ipcMain.handle('capture:execute', async (event, params: CaptureExecuteParams) => {
    console.log('[CaptureHandler] Execute capture with params:', params)

    // Hide capture window IMMEDIATELY to prevent it appearing in screenshot
    const captureWindow = BrowserWindow.getAllWindows().find((w) => w.webContents === event.sender)
    if (captureWindow) {
      captureWindow.hide()
    }

    // Short delay to ensure window is hidden
    await new Promise((resolve) => setTimeout(resolve, 50))

    const result = await captureService.execute(params)

    console.log('[CaptureHandler] Capture result:', result)

    return result
  })
}
