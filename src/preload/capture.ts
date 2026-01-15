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

// Expose API to renderer
if (process.contextIsolated) {
  try {
    contextBridge.exposeInMainWorld('captureAPI', captureAPI)
  } catch (error) {
    console.error('Failed to expose captureAPI:', error)
  }
} else {
  // @ts-ignore (define in dts)
  window.captureAPI = captureAPI
}
