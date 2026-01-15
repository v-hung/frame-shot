import { Link } from 'react-router'

export function Component() {
  return (
    <div className="w-full h-full p-8 bg-gray-50">
      <h1 className="text-3xl font-bold mb-6">FrameShot</h1>

      <div className="space-y-4 max-w-md">
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-semibold mb-2">Hotkeys</h2>
          <ul className="space-y-2 text-sm">
            <li>
              <kbd className="px-2 py-1 bg-gray-100 rounded">Ctrl+Shift+1</kbd> - Region Capture
            </li>
            <li>
              <kbd className="px-2 py-1 bg-gray-100 rounded">Ctrl+Shift+2</kbd> - Fullscreen Capture
            </li>
            <li>
              <kbd className="px-2 py-1 bg-gray-100 rounded">Ctrl+Shift+3</kbd> - Window Capture
            </li>
          </ul>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-semibold mb-2">Test Pages</h2>
          <ul className="space-y-2">
            <li>
              <Link
                to="/window-picker"
                className="text-blue-500 hover:text-blue-600 hover:underline"
              >
                → Window Picker Test (Native C++)
              </Link>
            </li>
          </ul>
        </div>
      </div>
    </div>
  )
}
