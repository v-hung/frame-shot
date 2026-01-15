/**
 * Window Picker Handlers
 * IPC handlers for native window detection
 */

import { ipcMain, BrowserWindow } from 'electron'
import { NativeProcessService } from '../services/native-process.service'

const nativeService = new NativeProcessService()

export function registerWindowPickerHandlers(getCaptureWindow: () => BrowserWindow | null): void {
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

      if (result.success && result.data) {
        // Get current capture window HWND dynamically
        const currentCaptureWindow = getCaptureWindow()
        const captureHwnd = currentCaptureWindow?.getNativeWindowHandle()?.readInt32LE(0)

        console.log('[WindowPicker] Capture window HWND:', captureHwnd)
        console.log('[WindowPicker] Total windows before filter:', result.data.windows.length)

        result.data.windows = result.data.windows.filter((win: any) => {
          // Exclude capture window by HWND
          if (captureHwnd && win.hwnd === captureHwnd) {
            console.log('[WindowPicker] Filtering out capture window:', win.title, win.hwnd)
            return false
          }

          // Exclude system windows by title
          const title = win.title.toLowerCase()
          if (title.includes('windows input experience')) return false
          if (title === 'program manager') return false

          return true
        })

        console.log('[WindowPicker] Windows after filter:', result.data.windows.length)
      }

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
