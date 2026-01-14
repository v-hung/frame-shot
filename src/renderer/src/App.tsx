import { RouterProvider } from 'react-router'
import { useEffect } from 'react'
import router from './router'
import { CaptureOverlay } from '@renderer/features/capture/components/CaptureOverlay'
import { useCaptureStore } from '@renderer/stores/captureStore'

function App(): React.JSX.Element {
  const startCapture = useCaptureStore((state) => state.startCapture)
  const isActive = useCaptureStore((state) => state.isActive)

  // Listen for capture trigger events
  useEffect(() => {
    const handleHotkey = (mode: string) => {
      console.log('[App] Received capture:trigger event, mode:', mode)
      if (mode === 'region' || mode === 'fullscreen' || mode === 'window') {
        startCapture(mode)
      }
    }

    const handleCaptureExit = () => {
      console.log('[App] Received capture:exit event')
      // Reset capture state when main process exits capture mode
      useCaptureStore.getState().cancelCapture()
    }

    window.captureAPI.onHotkeyTriggered(handleHotkey)
    window.captureAPI.onCaptureExit(handleCaptureExit)

    return () => {
      window.captureAPI.removeHotkeyListener()
    }
  }, [startCapture])

  return (
    <>
      {/* Show capture overlay when active */}
      {isActive && <CaptureOverlay />}

      {/* Show normal app UI when not capturing */}
      {!isActive && <RouterProvider router={router} />}
    </>
  )
}

export default App
