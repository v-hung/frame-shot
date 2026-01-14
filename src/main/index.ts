import { app, shell, BrowserWindow, ipcMain, globalShortcut, screen } from 'electron'
import { join } from 'path'
import { electronApp, optimizer, is } from '@electron-toolkit/utils'
import icon from '../../resources/icon.png?asset'
import { registerHandlers } from './handlers'

let mainWindow: BrowserWindow | null = null

function createWindow(): void {
  // Create the browser window.
  mainWindow = new BrowserWindow({
    width: 1200,
    height: 700,
    show: false,
    frame: false, // Remove window frame
    transparent: true, // Transparent background
    backgroundColor: '#00000000', // Fully transparent (ARGB)
    autoHideMenuBar: true,
    ...(process.platform === 'linux' ? { icon } : {}),
    webPreferences: {
      preload: join(__dirname, '../preload/index.js'),
      sandbox: false,
      backgroundThrottling: false // Keep animations smooth even when hidden
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
  // mainWindow.webContents.openDevTools()
}

/**
 * Switch main window to capture mode
 * Transforms window to full-screen transparent overlay covering all monitors
 */
function enterCaptureMode(mode: string): void {
  if (!mainWindow) return

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
  })

  const captureBounds = {
    x: minX,
    y: minY,
    width: maxX - minX,
    height: maxY - minY
  }

  console.log('[Main] Entering capture mode, bounds:', captureBounds)

  // Transform window to capture mode
  mainWindow.setResizable(true) // Must be resizable to change size
  mainWindow.setBounds(captureBounds)
  mainWindow.setAlwaysOnTop(true, 'screen-saver')
  mainWindow.setVisibleOnAllWorkspaces(true, { visibleOnFullScreen: true })
  mainWindow.setFullScreenable(false)
  mainWindow.setResizable(false)
  mainWindow.setIgnoreMouseEvents(false)

  const displays = allDisplays.map((d) => ({
    id: d.id.toString(),
    bounds: d.bounds,
    scaleFactor: d.scaleFactor
  }))

  // Send capture trigger event to renderer
  mainWindow.webContents.send('capture:trigger', mode)
  mainWindow.webContents.send('capture:bounds', captureBounds)
  mainWindow.webContents.send('capture:displays', displays)
}

/**
 * Exit capture mode and restore normal window
 */
function exitCaptureMode(): void {
  if (!mainWindow) return

  console.log('[Main] Exiting capture mode')

  // Notify renderer to exit capture mode FIRST (before changing window)
  mainWindow.webContents.send('capture:exit')

  // Small delay to ensure renderer receives event before window transformation
  setTimeout(() => {
    if (!mainWindow) return

    // Restore normal window properties
    mainWindow.setAlwaysOnTop(false)
    mainWindow.setVisibleOnAllWorkspaces(false)
    mainWindow.setResizable(true)
    mainWindow.setBounds({ x: 100, y: 100, width: 900, height: 670 })
    mainWindow.center()
    mainWindow.setResizable(false)

    // Ensure window is visible and focused
    mainWindow.show()
    mainWindow.focus()

    console.log('[Main] Window restored and focused')
  }, 50)
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
    enterCaptureMode('region')
  })

  // Ctrl+Shift+2: Full screen capture
  globalShortcut.register('CommandOrControl+Shift+2', () => {
    enterCaptureMode('fullscreen')
  })

  // Ctrl+Shift+3: Window capture
  globalShortcut.register('CommandOrControl+Shift+3', () => {
    enterCaptureMode('window')
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
  registerHandlers()

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
