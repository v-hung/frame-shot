/**
 * Capture Window Preload Script
 * Isolated preload for capture overlay window
 */

import { contextBridge, ipcRenderer } from 'electron'
import type { CaptureExecuteParams } from '../main/types/capture.types'

// Capture API for capture window
const captureAPI = {
  listDisplays: () => ipcRenderer.invoke('capture:list-displays'),

  listWindows: (includeMinimized?: boolean) =>
    ipcRenderer.invoke('capture:list-windows', { includeMinimized }),

  getCursorPosition: () => ipcRenderer.invoke('capture:get-cursor-position'),

  execute: (params: CaptureExecuteParams) => ipcRenderer.invoke('capture:execute', params),

  // Event listeners
  onWindowBounds: (
    callback: (bounds: { x: number; y: number; width: number; height: number }) => void
  ) => {
    ipcRenderer.on('capture:bounds', (_, bounds) => {
      console.log('[Capture Preload] Received window bounds:', bounds)
      callback(bounds)
    })
  },

  onDisplays: (
    callback: (
      displays: Array<{
        id: string
        bounds: { x: number; y: number; width: number; height: number }
        scaleFactor: number
      }>
    ) => void
  ) => {
    ipcRenderer.on('capture:displays', (_, displays) => {
      console.log('[Capture Preload] Received displays:', displays)
      callback(displays)
    })
  },

  // Close capture window
  closeCaptureWindow: () => {
    ipcRenderer.send('capture:close')
  },

  removeListeners: () => {
    ipcRenderer.removeAllListeners('capture:bounds')
    ipcRenderer.removeAllListeners('capture:displays')
  }
}

// Logger API (separate from capture)
const loggerAPI = {
  log: (...args: any[]) => ipcRenderer.send('logger:log', 'log', ...args),
  error: (...args: any[]) => ipcRenderer.send('logger:log', 'error', ...args),
  warn: (...args: any[]) => ipcRenderer.send('logger:log', 'warn', ...args)
}

// Window Picker API for native window detection
const windowPickerAPI = {
  getAtCursor: () => ipcRenderer.invoke('window-picker:get-at-cursor'),
  listAll: () => ipcRenderer.invoke('window-picker:list-all')
}

// Expose APIs to renderer
if (process.contextIsolated) {
  try {
    contextBridge.exposeInMainWorld('captureAPI', captureAPI)
    contextBridge.exposeInMainWorld('loggerAPI', loggerAPI)
    contextBridge.exposeInMainWorld('windowPickerAPI', windowPickerAPI)
  } catch (error) {
    console.error('Failed to expose APIs:', error)
  }
} else {
  // @ts-ignore (define in dts)
  window.captureAPI = captureAPI
  // @ts-ignore (define in dts)
  window.loggerAPI = loggerAPI
  // @ts-ignore (define in dts)
  window.windowPickerAPI = windowPickerAPI
}
