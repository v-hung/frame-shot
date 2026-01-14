/**
 * Capture Store
 * Zustand store for managing screenshot capture state
 */

import { create } from 'zustand'

interface CaptureRegion {
  x: number
  y: number
  width: number
  height: number
  displayId: string
  scaleFactor: number
}

interface CaptureState {
  isActive: boolean
  mode: 'region' | 'fullscreen' | 'window' | null
  currentRegion: CaptureRegion | null

  startCapture: (mode: 'region' | 'fullscreen' | 'window') => void
  cancelCapture: () => void
  setRegion: (region: CaptureRegion) => void
  clearRegion: () => void
  executeCapture: () => Promise<void>
}

export const useCaptureStore = create<CaptureState>((set, get) => ({
  isActive: false,
  mode: null,
  currentRegion: null,

  startCapture: (mode) => set({ isActive: true, mode }),

  cancelCapture: () => set({ isActive: false, mode: null, currentRegion: null }),

  setRegion: (region) => set({ currentRegion: region }),

  clearRegion: () => set({ currentRegion: null }),

  executeCapture: async () => {
    const { mode, currentRegion } = get()
    if (!mode) return

    try {
      const result = await window.captureAPI.execute({
        mode,
        region: currentRegion || undefined
      })

      console.log('[CaptureStore] Capture result:', result)

      if (result.success) {
        // Success! Reset state and close capture window
        set({ isActive: false, mode: null, currentRegion: null })
        window.captureAPI.closeCaptureWindow()
      } else {
        console.error('Capture failed:', result.error)
      }
    } catch (error) {
      console.error('Capture error:', error)
    }
  }
}))
