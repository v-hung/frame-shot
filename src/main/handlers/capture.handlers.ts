/**
 * Capture IPC Handlers
 * Handles IPC communication for screenshot capture operations
 */

import { ipcMain } from 'electron'
import { CaptureService } from '../services/capture.service'
import { ScreenService } from '../services/screen.service'
import type { CaptureExecuteParams } from '../types/capture.types'

const captureService = new CaptureService()
const screenService = new ScreenService()

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

  // Execute capture
  ipcMain.handle('capture:execute', async (_, params: CaptureExecuteParams) => {
    return captureService.execute(params)
  })

  // TODO: Add capture:list-windows for Phase 5 (User Story 3)
  // TODO: Add capture:register-hotkeys for global hotkey management
}
