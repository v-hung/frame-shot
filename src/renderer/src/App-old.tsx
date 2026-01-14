import { RouterProvider } from 'react-router'
import router from './router'

function App(): React.JSX.Element {
  // CaptureOverlay now renders in separate capture window (see src/main/index.ts)
  // Main window shows normal app UI via RouterProvider
  return <RouterProvider router={router} />
}

export default App
