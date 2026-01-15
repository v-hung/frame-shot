import { app, shell, BrowserWindow, ipcMain, globalShortcut, screen } from 'electron'
import { join } from 'path'
import { electronApp, optimizer, is } from '@electron-toolkit/utils'
import icon from '../../resources/icon.png?asset'
import { registerHandlers } from './handlers'

let mainWindow: BrowserWindow | null = null
let captureWindow: BrowserWindow | null = null

// Export getter for captureWindow (used by handlers)
export function getCaptureWindow(): BrowserWindow | null {
  return captureWindow
}

function createWindow(): void {
  // Create the browser window.
  mainWindow = new BrowserWindow({
    width: 1200,
    height: 700,
    show: false,
    autoHideMenuBar: true,
    ...(process.platform === 'linux' ? { icon } : {}),
    webPreferences: {
      preload: join(__dirname, '../preload/index.js'),
      sandbox: false
      // backgroundThrottling: false // Keep animations smooth even when hidden
    }
  })

  mainWindow.on('ready-to-show', () => {
    mainWindow?.show()
  })

  mainWindow.webContents.setWindowOpenHandler((details) => {
    shell.openExternal(details.url)
    return { action: 'deny' }
  })

  // HMR for renderer base on electron-vite cli.
  // Load the remote URL for development or the local html file for production.
  if (is.dev && process.env['ELECTRON_RENDERER_URL']) {
    mainWindow.loadURL(process.env['ELECTRON_RENDERER_URL'])
  } else {
    mainWindow.loadFile(join(__dirname, '../renderer/index.html'))
  }

  // Open DevTools
  mainWindow.webContents.openDevTools()
}

/**
 * Create capture window
 * Full-screen transparent overlay for region selection
 */
function createCaptureWindow(): void {
  // Close existing capture window if any
  if (captureWindow && !captureWindow.isDestroyed()) {
    captureWindow.close()
  }

  // Calculate bounds that cover all displays
  const allDisplays = screen.getAllDisplays()
  let minX = 0
  let minY = 0
  let maxX = allDisplays[0].bounds.width
  let maxY = allDisplays[0].bounds.height

  allDisplays.forEach((display) => {
    const { x, y, width, height } = display.bounds
    minX = Math.min(minX, x)
    minY = Math.min(minY, y)
    maxX = Math.max(maxX, x + width)
    maxY = Math.max(maxY, y + height)

    console.log(
      '[Main] Display:',
      display.id,
      'bounds:',
      display.bounds,
      'workArea:',
      display.workArea
    )
  })

  const captureBounds = {
    x: minX,
    y: minY,
    width: maxX - minX,
    height: maxY - minY
  }

  console.log('[Main] Creating capture window, bounds:', captureBounds)
  console.log('[Main] Total displays:', allDisplays.length)

  // Create capture window
  captureWindow = new BrowserWindow({
    ...captureBounds,
    show: false,
    frame: false,
    transparent: true,
    resizable: true,
    movable: false,
    minimizable: false,
    maximizable: false,
    closable: true,
    skipTaskbar: true,
    alwaysOnTop: true,
    opacity: 0.9999999,
    fullscreenable: false,
    hasShadow: false,
    enableLargerThanScreen: true,
    ...(process.platform === 'linux' ? { icon } : {}),
    webPreferences: {
      preload: join(__dirname, '../preload/capture.js'),
      sandbox: false,
      backgroundThrottling: false
    }
  })

  // Force set bounds again to ensure it covers all monitors
  captureWindow.setBounds(captureBounds)
  captureWindow.setResizable(false)

  // Set window level to screen-saver (above all other windows)
  captureWindow.setAlwaysOnTop(true, 'screen-saver')
  captureWindow.setVisibleOnAllWorkspaces(true, { visibleOnFullScreen: true })

  // Load capture HTML
  if (is.dev && process.env['ELECTRON_RENDERER_URL']) {
    captureWindow.loadURL(`${process.env['ELECTRON_RENDERER_URL']}/capture.html`)
  } else {
    captureWindow.loadFile(join(__dirname, '../renderer/capture.html'))
  }

  captureWindow.once('ready-to-show', () => {
    if (!captureWindow) return

    const displays = allDisplays.map((d) => ({
      id: d.id.toString(),
      bounds: d.bounds,
      scaleFactor: d.scaleFactor
    }))

    // Send capture info to renderer (no mode needed - always region selection)
    captureWindow.webContents.send('capture:bounds', captureBounds)
    captureWindow.webContents.send('capture:displays', displays)

    // Show window
    captureWindow.show()
    captureWindow.focus()

    console.log('[Main] Capture window shown and focused')
  })

  captureWindow.on('closed', () => {
    captureWindow = null
    console.log('[Main] Capture window closed')
  })

  // Open DevTools for debugging (optional)
  // captureWindow.webContents.openDevTools({ mode: 'detach' })
}

/**
 * Start capture mode
 * Only region mode needs UI overlay, others execute directly
 */
function startCaptureMode(mode: string): void {
  console.log('[Main] Starting capture mode:', mode)

  if (mode === 'region') {
    // Region mode needs overlay UI
    createCaptureWindow()
  } else if (mode === 'fullscreen' || mode === 'window') {
    // Fullscreen and window modes execute directly
    executeDirectCapture(mode)
  }
}

/**
 * Execute capture directly without UI
 */
async function executeDirectCapture(mode: 'fullscreen' | 'window'): Promise<void> {
  try {
    const { CaptureService } = await import('./services/capture.service')
    const captureService = new CaptureService()

    const result = await captureService.execute({
      mode,
      region: undefined,
      window: undefined
    })

    if (result.success) {
      console.log('[Main] Direct capture successful:', result.filePath)
      // TODO: Show notification
    } else {
      console.error('[Main] Direct capture failed:', result.error)
      // TODO: Show error notification
    }
  } catch (error) {
    console.error('[Main] Direct capture error:', error)
  }
}

/**
 * Exit capture mode - close capture window
 */
function exitCaptureMode(): void {
  console.log('[Main] Exiting capture mode')

  if (captureWindow && !captureWindow.isDestroyed()) {
    captureWindow.close()
  }

  // Focus back to main window
  if (mainWindow && !mainWindow.isDestroyed()) {
    mainWindow.show()
    mainWindow.focus()
  }
}

// Listen for capture completion/cancellation
ipcMain.on('capture:close', () => {
  exitCaptureMode()
})

/**
 * Register global hotkeys for screenshot capture
 * FR-001: System MUST provide three capture modes accessible via global hotkeys
 */
function registerGlobalHotkeys(): void {
  // Ctrl+Shift+1: Region capture
  globalShortcut.register('CommandOrControl+Shift+1', () => {
    startCaptureMode('region')
  })

  // Ctrl+Shift+2: Full screen capture
  globalShortcut.register('CommandOrControl+Shift+2', () => {
    startCaptureMode('fullscreen')
  })

  // Ctrl+Shift+3: Window capture
  globalShortcut.register('CommandOrControl+Shift+3', () => {
    startCaptureMode('window')
  })
}

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
app.whenReady().then(() => {
  // Disable hardware acceleration features to allow capturing DRM/protected content
  // This helps capture video content that would otherwise show as white/black
  app.commandLine.appendSwitch('disable-features', 'HardwareMediaKeyHandling')

  // Set app user model id for windows
  electronApp.setAppUserModelId('com.electron')

  // Default open or close DevTools by F12 in development
  // and ignore CommandOrControl + R in production.
  // see https://github.com/alex8088/electron-toolkit/tree/master/packages/utils
  app.on('browser-window-created', (_, window) => {
    optimizer.watchWindowShortcuts(window)
  })

  // IPC test
  ipcMain.on('ping', () => console.log('pong'))

  // Register IPC handlers
  registerHandlers(() => captureWindow)

  // Register global hotkeys
  registerGlobalHotkeys()

  createWindow()

  app.on('activate', function () {
    // On macOS it's common to re-create a window in the app when the
    // dock icon is clicked and there are no other windows open.
    if (BrowserWindow.getAllWindows().length === 0) createWindow()
  })
})

// Quit when all windows are closed, except on macOS. There, it's common
// for applications and their menu bar to stay active until the user quits
// explicitly with Cmd + Q.
app.on('window-all-closed', () => {
  // Unregister all global shortcuts
  globalShortcut.unregisterAll()

  if (process.platform !== 'darwin') {
    app.quit()
  }
})
