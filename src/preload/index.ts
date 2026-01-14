import { contextBridge, ipcRenderer } from 'electron'
import { electronAPI } from '@electron-toolkit/preload'
import type { CaptureExecuteParams } from '../main/types/capture.types'

// Custom APIs for renderer
const api = {}

// Capture API for screenshot functionality
const captureAPI = {
  listDisplays: () => ipcRenderer.invoke('capture:list-displays'),

  listWindows: (includeMinimized?: boolean) =>
    ipcRenderer.invoke('capture:list-windows', { includeMinimized }),

  getCursorPosition: () => ipcRenderer.invoke('capture:get-cursor-position'),

  execute: (params: CaptureExecuteParams) => ipcRenderer.invoke('capture:execute', params),

  // Event listeners for hotkeys
  onHotkeyTriggered: (callback: (mode: string) => void) => {
    ipcRenderer.on('capture:trigger', (_, mode) => {
      console.log('[Preload] Received capture:trigger, mode:', mode)
      callback(mode)
    })
  },

  onWindowBounds: (
    callback: (bounds: { x: number; y: number; width: number; height: number }) => void
  ) => {
    ipcRenderer.on('capture:bounds', (_, bounds) => {
      console.log('[Preload] Received capture:bounds:', bounds)
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
      console.log('[Preload] Received capture:displays:', displays)
      callback(displays)
    })
  },

  onCaptureExit: (callback: () => void) => {
    ipcRenderer.on('capture:exit', () => {
      console.log('[Preload] Received capture:exit')
      callback()
    })
  },

  removeHotkeyListener: () => {
    ipcRenderer.removeAllListeners('capture:trigger')
    ipcRenderer.removeAllListeners('capture:exit')
    ipcRenderer.removeAllListeners('capture:bounds')
    ipcRenderer.removeAllListeners('capture:displays')
  },

  // Close capture window
  closeCaptureWindow: () => {
    ipcRenderer.send('capture:close')
  }
}

// Use `contextBridge` APIs to expose Electron APIs to
// renderer only if context isolation is enabled, otherwise
// just add to the DOM global.
if (process.contextIsolated) {
  try {
    contextBridge.exposeInMainWorld('electron', electronAPI)
    contextBridge.exposeInMainWorld('api', api)
    contextBridge.exposeInMainWorld('captureAPI', captureAPI)
  } catch (error) {
    console.error(error)
  }
} else {
  // @ts-ignore (define in dts)
  window.electron = electronAPI
  // @ts-ignore (define in dts)
  window.api = api
  // @ts-ignore (define in dts)
  window.captureAPI = captureAPI
}
