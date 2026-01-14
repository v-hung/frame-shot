import { contextBridge, ipcRenderer } from 'electron'
import { electronAPI } from '@electron-toolkit/preload'
import type { CaptureExecuteParams } from '../main/types/capture.types'

// Custom APIs for renderer
const api = {}

// Capture API for screenshot functionality
const captureAPI = {
  listDisplays: () => ipcRenderer.invoke('capture:list-displays'),

  getCursorPosition: () => ipcRenderer.invoke('capture:get-cursor-position'),

  execute: (params: CaptureExecuteParams) => ipcRenderer.invoke('capture:execute', params)
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
