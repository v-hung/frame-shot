/**
 * Window Picker Handlers
 * IPC handlers for native window detection
 */

import { ipcMain } from 'electron'
import { NativeProcessService } from '../services/native-process.service'

const nativeService = new NativeProcessService()

export function registerWindowPickerHandlers(): void {
  /**
   * Get window at cursor position
   */
  ipcMain.handle('window-picker:get-at-cursor', async () => {
    try {
      const result = await nativeService.getWindowAtCursor()
      return result
    } catch (error) {
      console.error('[WindowPicker] Error getting window at cursor:', error)
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      }
    }
  })

  /**
   * List all visible windows
   */
  ipcMain.handle('window-picker:list-all', async () => {
    try {
      const result = await nativeService.listWindows()
      return result
    } catch (error) {
      console.error('[WindowPicker] Error listing windows:', error)
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      }
    }
  })
}
