/**
 * Window Picker Test Page
 * Test native window detection at cursor
 */

import { useState } from 'react'
import * as logger from '@renderer/utils/logger.utils'

interface WindowInfo {
  hwnd: number
  title: string
  processName: string
  bounds: { x: number; y: number; width: number; height: number }
  cursor: { x: number; y: number }
  isVisible: boolean
}

export function Component() {
  const [windowInfo, setWindowInfo] = useState<WindowInfo | null>(null)
  const [isPolling, setIsPolling] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const getWindowAtCursor = async () => {
    try {
      const result = await window.windowPickerAPI.getAtCursor()

      if (result.success && result.data) {
        setWindowInfo(result.data)
        setError(null)
      } else {
        setError(result.error || 'Unknown error')
        setWindowInfo(null)
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to get window')
      setWindowInfo(null)
    }
  }

  const startPolling = () => {
    setIsPolling(true)
    const interval = setInterval(() => {
      getWindowAtCursor()
    }, 100) // Poll every 100ms

    // Store interval ID to clear later
    ;(window as any)._windowPickerInterval = interval
  }

  const stopPolling = () => {
    setIsPolling(false)
    if ((window as any)._windowPickerInterval) {
      clearInterval((window as any)._windowPickerInterval)
      ;(window as any)._windowPickerInterval = null
    }
  }

  const listAllWindows = async () => {
    try {
      const result = await window.windowPickerAPI.listAll()

      if (result.success && result.data) {
        logger.log('All windows:', result)
        alert(`Found ${result.data.windows.length} windows. Check console for details.`)
      } else {
        setError(result.error || 'Unknown error')
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to list windows')
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold mb-2">Window Picker Test</h1>
        <p className="text-gray-600 mb-8">
          Test native C++ module for detecting windows at cursor position
        </p>

        {/* Controls */}
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4">Controls</h2>

          <div className="flex gap-3">
            <button
              onClick={getWindowAtCursor}
              disabled={isPolling}
              className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 disabled:bg-gray-300 disabled:cursor-not-allowed"
            >
              Get Window (Once)
            </button>

            {!isPolling ? (
              <button
                onClick={startPolling}
                className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600"
              >
                Start Live Tracking
              </button>
            ) : (
              <button
                onClick={stopPolling}
                className="px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600"
              >
                Stop Tracking
              </button>
            )}

            <button
              onClick={listAllWindows}
              disabled={isPolling}
              className="px-4 py-2 bg-purple-500 text-white rounded hover:bg-purple-600 disabled:bg-gray-300 disabled:cursor-not-allowed"
            >
              List All Windows
            </button>
          </div>

          {isPolling && (
            <div className="mt-4 text-sm text-green-600 flex items-center gap-2">
              <span className="inline-block w-2 h-2 bg-green-600 rounded-full animate-pulse"></span>
              Live tracking active - Move your mouse around
            </div>
          )}
        </div>

        {/* Error Display */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
            <h3 className="text-red-800 font-semibold mb-1">Error</h3>
            <p className="text-red-600 text-sm">{error}</p>
          </div>
        )}

        {/* Window Info Display */}
        {windowInfo && (
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-semibold mb-4">Window Information</h2>

            <div className="space-y-3">
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <p className="text-sm text-gray-500">Title</p>
                  <p className="font-medium">{windowInfo.title || '(No title)'}</p>
                </div>

                <div>
                  <p className="text-sm text-gray-500">Process</p>
                  <p className="font-medium font-mono text-sm">{windowInfo.processName}</p>
                </div>

                <div>
                  <p className="text-sm text-gray-500">Handle</p>
                  <p className="font-medium font-mono text-sm">
                    0x{windowInfo.hwnd.toString(16).toUpperCase()}
                  </p>
                </div>
              </div>

              <div className="border-t pt-3">
                <p className="text-sm text-gray-500 mb-2">Window Bounds</p>
                <div className="grid grid-cols-4 gap-3">
                  <div className="bg-gray-50 p-2 rounded">
                    <p className="text-xs text-gray-500">X</p>
                    <p className="font-mono text-sm">{windowInfo.bounds.x}px</p>
                  </div>
                  <div className="bg-gray-50 p-2 rounded">
                    <p className="text-xs text-gray-500">Y</p>
                    <p className="font-mono text-sm">{windowInfo.bounds.y}px</p>
                  </div>
                  <div className="bg-gray-50 p-2 rounded">
                    <p className="text-xs text-gray-500">Width</p>
                    <p className="font-mono text-sm">{windowInfo.bounds.width}px</p>
                  </div>
                  <div className="bg-gray-50 p-2 rounded">
                    <p className="text-xs text-gray-500">Height</p>
                    <p className="font-mono text-sm">{windowInfo.bounds.height}px</p>
                  </div>
                </div>
              </div>

              <div className="border-t pt-3">
                <p className="text-sm text-gray-500 mb-2">Cursor Position</p>
                <div className="grid grid-cols-3 gap-3">
                  <div className="bg-gray-50 p-2 rounded">
                    <p className="text-xs text-gray-500">X</p>
                    <p className="font-mono text-sm">{windowInfo.cursor.x}px</p>
                  </div>
                  <div className="bg-gray-50 p-2 rounded">
                    <p className="text-xs text-gray-500">Y</p>
                    <p className="font-mono text-sm">{windowInfo.cursor.y}px</p>
                  </div>
                  <div className="bg-gray-50 p-2 rounded">
                    <p className="text-xs text-gray-500">Visible</p>
                    <p className="font-mono text-sm">{windowInfo.isVisible ? '✓ Yes' : '✗ No'}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Instructions */}
        {!windowInfo && !error && (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
            <h3 className="text-blue-900 font-semibold mb-2">How to Test</h3>
            <ol className="list-decimal list-inside space-y-1 text-blue-800 text-sm">
              <li>
                Build the native module first:{' '}
                <code className="bg-blue-100 px-2 py-0.5 rounded">npm run build:native</code>
              </li>
              <li>Click "Get Window (Once)" to detect window at current cursor position</li>
              <li>Click "Start Live Tracking" to continuously track window under cursor</li>
              <li>Move your mouse over different windows to see real-time detection</li>
              <li>Click "List All Windows" to see all visible windows in console</li>
            </ol>
          </div>
        )}
      </div>
    </div>
  )
}
