/**
 * Window Picker Component
 * Shows grid of available windows for selection
 * Feature: 001-screenshot-capture (User Story 3)
 */

import { useEffect, useState } from 'react'
import { useCaptureStore } from '@renderer/stores/captureStore'

interface WindowItem {
  id: string
  name: string
  thumbnail: string
  appName: string
}

export function WindowPicker() {
  const [windows, setWindows] = useState<WindowItem[]>([])
  const [hoveredId, setHoveredId] = useState<string | null>(null)
  const { cancelCapture } = useCaptureStore()

  useEffect(() => {
    // Load available windows
    window.captureAPI.listWindows(false).then(({ windows }) => {
      setWindows(windows)
    })
  }, [])

  const handleWindowClick = (windowId: string) => {
    // Set the selected window and execute capture
    useCaptureStore.setState({
      currentRegion: null // Clear region, we're using window mode
    })

    window.captureAPI
      .execute({
        mode: 'window',
        window: { id: windowId }
      })
      .then(() => {
        cancelCapture()
        window.captureAPI.closeCaptureWindow()
      })
  }

  return (
    <div className="window-picker-overlay">
      <div className="window-picker-container">
        <div className="window-picker-header">
          <h2>Select a window to capture</h2>
          <button onClick={cancelCapture} className="close-button">
            ✕
          </button>
        </div>

        <div className="window-grid">
          {windows.map((window) => (
            <div
              key={window.id}
              className={`window-item ${hoveredId === window.id ? 'hovered' : ''}`}
              onClick={() => handleWindowClick(window.id)}
              onMouseEnter={() => setHoveredId(window.id)}
              onMouseLeave={() => setHoveredId(null)}
            >
              <img src={window.thumbnail} alt={window.name} className="window-thumbnail" />
              <div className="window-info">
                <div className="window-name">{window.name || 'Untitled'}</div>
                <div className="window-app">{window.appName}</div>
              </div>
            </div>
          ))}
        </div>

        {windows.length === 0 && (
          <div className="no-windows">
            <p>No capturable windows found</p>
          </div>
        )}
      </div>
    </div>
  )
}
