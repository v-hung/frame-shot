/**
 * Capture Window Entry Point
 * Standalone window for screenshot capture overlay
 */

import ReactDOM from 'react-dom/client'
import { CaptureOverlay } from './features/capture/components/CaptureOverlay'
import './index.css'

ReactDOM.createRoot(document.getElementById('capture-root')!).render(<CaptureOverlay />)
