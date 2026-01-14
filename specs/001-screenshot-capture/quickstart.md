# Quick Start: Screenshot Capture Implementation

**Feature**: 001-screenshot-capture
**Date**: 2026-01-14
**Purpose**: Developer guide for implementing screenshot capture modes

## Prerequisites

- FrameShot development environment set up (Node.js ~20.x, Electron 39.2.6)
- Familiarity with Electron multi-process architecture (main/renderer/preload)
- TypeScript 5.9.3, React 19.2.1, Zustand 5.0.9
- Review [data-model.md](./data-model.md) and [contracts/ipc-contracts.md](./contracts/ipc-contracts.md)

## Implementation Order

Follow this sequence to build independently testable increments:

### Phase 1: Foundation (Setup & Infrastructure)

1. Type definitions (`capture.types.ts`)
2. IPC handler registration (`capture.handlers.ts`)
3. Preload bridge (`capture.preload.ts`)
4. Basic Zustand store (`captureStore.ts`)

### Phase 2: User Story 1 - Region Capture (P1 - MVP)

1. Screen enumeration service
2. Capture overlay component
3. Region selection UI with dimensions
4. Capture execution with file save
5. Clipboard + notification
6. ESC handling (clear vs exit)

### Phase 3: User Story 2 - Full Screen Capture (P2)

1. Cursor position detection
2. Full screen capture logic
3. Multi-monitor selection (if >1 display)

### Phase 4: User Story 3 - Window Capture (P3)

1. Window enumeration service
2. Window highlight overlay
3. Window boundary detection
4. Click-to-capture

### Phase 5: Polish & Testing

1. Unit tests for utilities
2. Integration tests for IPC
3. E2E tests for each user story
4. Performance validation (<200ms captures)
5. Constitution compliance check

---

## Step-by-Step Implementation

### Step 1: Type Definitions

**File**: `src/main/types/capture.types.ts`

```typescript
export type CaptureModeType = 'region' | 'fullscreen' | 'window'

export interface CaptureRegion {
  x: number
  y: number
  width: number
  height: number
  displayId: string
  scaleFactor: number
}

export interface CaptureWindow {
  id: string
  name: string
  bounds: { x: number; y: number; width: number; height: number }
  thumbnail: string // Base64 PNG
  appName: string
  isVisible: boolean
}

export interface Display {
  id: string
  bounds: { x: number; y: number; width: number; height: number }
  scaleFactor: number
  rotation: number
  internal: boolean
  label: string
}

export interface CaptureExecuteParams {
  mode: CaptureModeType
  region?: CaptureRegion
  window?: { id: string }
  display?: { id: string }
}

export interface CaptureExecuteResponse {
  success: boolean
  filePath?: string
  error?: string
  timestamp: string
  dimensions: { width: number; height: number }
}
```

**Validation**: `npm run typecheck` should pass.

---

### Step 2: Screen Service (Main Process)

**File**: `src/main/services/screen.service.ts`

```typescript
import { screen, desktopCapturer } from 'electron'
import type { Display } from '../types/capture.types'

export class ScreenService {
  async listDisplays(): Promise<Display[]> {
    const displays = screen.getAllDisplays()

    return displays.map((display, index) => ({
      id: display.id.toString(),
      bounds: display.bounds,
      scaleFactor: display.scaleFactor,
      rotation: display.rotation,
      internal: display.internal,
      label: `Monitor ${index + 1}`
    }))
  }

  async getCursorDisplay(): Promise<Display | null> {
    const cursorPoint = screen.getCursorScreenPoint()
    const display = screen.getDisplayNearestPoint(cursorPoint)

    if (!display) return null

    return {
      id: display.id.toString(),
      bounds: display.bounds,
      scaleFactor: display.scaleFactor,
      rotation: display.rotation,
      internal: display.internal,
      label: 'Active Display'
    }
  }

  async captureScreen(displayId: string): Promise<Electron.NativeImage | null> {
    const sources = await desktopCapturer.getSources({
      types: ['screen'],
      thumbnailSize: { width: 3840, height: 2160 } // Support up to 4K
    })

    const source = sources.find((s) => s.display_id === displayId)
    if (!source) return null

    // Note: Thumbnail is full-res capture for screens
    return source.thumbnail
  }

  captureRegion(image: Electron.NativeImage, region: CaptureRegion): Electron.NativeImage {
    // Scale coordinates by DPI factor
    const scaledRegion = {
      x: Math.round(region.x * region.scaleFactor),
      y: Math.round(region.y * region.scaleFactor),
      width: Math.round(region.width * region.scaleFactor),
      height: Math.round(region.height * region.scaleFactor)
    }

    return image.crop(scaledRegion)
  }
}
```

**Test**: Unit test for coordinate scaling logic, integration test for screen enumeration.

---

### Step 3: File Service (Main Process)

**File**: `src/main/services/file.service.ts`

```typescript
import fs from 'fs/promises'
import path from 'path'
import { app } from 'electron'
import { format } from 'date-fns'

export class FileService {
  private defaultSaveLocation: string

  constructor() {
    // Default to Pictures/FrameShot
    this.defaultSaveLocation = path.join(app.getPath('pictures'), 'FrameShot')
  }

  async ensureSaveDirectoryExists(): Promise<void> {
    await fs.mkdir(this.defaultSaveLocation, { recursive: true })
  }

  generateTimestampFilename(): string {
    // Format: YYYY-MM-DD_HH-MM-SS.png
    return format(new Date(), 'yyyy-MM-dd_HH-mm-ss') + '.png'
  }

  async saveImage(buffer: Buffer, customFilename?: string): Promise<string> {
    await this.ensureSaveDirectoryExists()

    let filename = customFilename || this.generateTimestampFilename()
    let fullPath = path.join(this.defaultSaveLocation, filename)

    // Handle collisions with _N suffix
    let counter = 1
    while (await this.fileExists(fullPath)) {
      const basename = path.basename(filename, '.png')
      filename = `${basename}_${counter}.png`
      fullPath = path.join(this.defaultSaveLocation, filename)
      counter++
    }

    await fs.writeFile(fullPath, buffer)
    return fullPath
  }

  private async fileExists(filePath: string): Promise<boolean> {
    try {
      await fs.access(filePath)
      return true
    } catch {
      return false
    }
  }
}
```

**Test**: Unit test for filename generation and collision handling.

---

### Step 4: Capture Service (Main Process)

**File**: `src/main/services/capture.service.ts`

```typescript
import { clipboard, Notification, nativeImage } from 'electron'
import { ScreenService } from './screen.service'
import { FileService } from './file.service'
import type { CaptureExecuteParams, CaptureExecuteResponse } from '../types/capture.types'

export class CaptureService {
  private screenService = new ScreenService()
  private fileService = new FileService()

  async execute(params: CaptureExecuteParams): Promise<CaptureExecuteResponse> {
    try {
      const image = await this.captureImage(params)
      if (!image) {
        return {
          success: false,
          error: 'Failed to capture image',
          timestamp: new Date().toISOString(),
          dimensions: { width: 0, height: 0 }
        }
      }

      // Parallel execution: clipboard + file save
      const buffer = image.toPNG()
      const [_, filePath] = await Promise.all([
        this.copyToClipboard(image),
        this.fileService.saveImage(buffer)
      ])

      // Show notification
      this.showNotification(filePath, image)

      return {
        success: true,
        filePath,
        timestamp: new Date().toISOString(),
        dimensions: image.getSize()
      }
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString(),
        dimensions: { width: 0, height: 0 }
      }
    }
  }

  private async captureImage(params: CaptureExecuteParams): Promise<Electron.NativeImage | null> {
    switch (params.mode) {
      case 'fullscreen': {
        const display = params.display
          ? await this.getDisplayById(params.display.id)
          : await this.screenService.getCursorDisplay()

        if (!display) return null
        return this.screenService.captureScreen(display.id)
      }

      case 'region': {
        if (!params.region) return null
        const display = await this.getDisplayById(params.region.displayId)
        if (!display) return null

        const fullImage = await this.screenService.captureScreen(display.id)
        if (!fullImage) return null

        return this.screenService.captureRegion(fullImage, params.region)
      }

      case 'window': {
        // TODO: Implement in Phase 4 (User Story 3)
        throw new Error('Window capture not yet implemented')
      }
    }
  }

  private async getDisplayById(id: string) {
    const displays = await this.screenService.listDisplays()
    return displays.find((d) => d.id === id)
  }

  private async copyToClipboard(image: Electron.NativeImage): Promise<void> {
    clipboard.writeImage(image)
  }

  private showNotification(filePath: string, image: Electron.NativeImage): void {
    const thumbnail = image.resize({ width: 64, height: 64 })

    const notification = new Notification({
      title: 'Screenshot captured',
      body: `Saved to ${filePath}`,
      icon: thumbnail
    })

    notification.on('click', () => {
      // Open file location
      import('electron').then(({ shell }) => {
        shell.showItemInFolder(filePath)
      })
    })

    notification.show()
  }
}
```

**Test**: Integration test for full capture flow, mock file system and clipboard.

---

### Step 5: IPC Handlers

**File**: `src/main/handlers/capture.handlers.ts`

```typescript
import { ipcMain } from 'electron'
import { CaptureService } from '../services/capture.service'
import { ScreenService } from '../services/screen.service'

const captureService = new CaptureService()
const screenService = new ScreenService()

export function registerCaptureHandlers(): void {
  ipcMain.handle('capture:list-displays', async () => {
    const displays = await screenService.listDisplays()
    return { displays }
  })

  ipcMain.handle('capture:get-cursor-position', async () => {
    const display = await screenService.getCursorDisplay()
    if (!display) {
      throw new Error('No display found')
    }
    return {
      x: 0, // TODO: Get actual cursor position
      y: 0,
      displayId: display.id
    }
  })

  ipcMain.handle('capture:execute', async (_, params) => {
    return captureService.execute(params)
  })

  // TODO: Add capture:list-windows for Phase 4
}
```

**Register**: Call `registerCaptureHandlers()` in `src/main/handlers/index.ts`.

---

### Step 6: Preload Bridge

**File**: `src/preload/capture.preload.ts`

```typescript
import { contextBridge, ipcRenderer } from 'electron'

export const captureAPI = {
  listDisplays: () => ipcRenderer.invoke('capture:list-displays'),

  getCursorPosition: () => ipcRenderer.invoke('capture:get-cursor-position'),

  execute: (params: any) => ipcRenderer.invoke('capture:execute', params)
}

contextBridge.exposeInMainWorld('captureAPI', captureAPI)
```

**Register**: Import and expose in `src/preload/index.ts`.

---

### Step 7: Zustand Store (Renderer)

**File**: `src/renderer/src/features/capture/stores/captureStore.ts`

```typescript
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

      if (result.success) {
        // Success! Reset state
        set({ isActive: false, mode: null, currentRegion: null })
      } else {
        console.error('Capture failed:', result.error)
      }
    } catch (error) {
      console.error('Capture error:', error)
    }
  }
}))
```

**Test**: Unit test for state transitions.

---

### Step 8: Overlay Component (Renderer)

**File**: `src/renderer/src/features/capture/components/CaptureOverlay.tsx`

```typescript
import { useEffect } from 'react';
import { useCaptureStore } from '../stores/captureStore';
import { RegionSelector } from './RegionSelector';

export function CaptureOverlay() {
  const { isActive, mode, cancelCapture } = useCaptureStore();

  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        cancelCapture();
      }
    };

    if (isActive) {
      window.addEventListener('keydown', handleEscape);
    }

    return () => window.removeEventListener('keydown', handleEscape);
  }, [isActive, cancelCapture]);

  if (!isActive) return null;

  return (
    <div className="fixed inset-0 bg-black/50 cursor-crosshair z-50">
      {mode === 'region' && <RegionSelector />}
      {/* TODO: Add window picker for mode='window' */}
    </div>
  );
}
```

**Styling**: Use Tailwind classes, `cursor-crosshair` for region mode.

---

## Testing Checklist

- [ ] Unit tests for `capture.utils.ts` (region calculations)
- [ ] Unit tests for `file.service.ts` (filename generation)
- [ ] Integration test for `capture:execute` IPC
- [ ] E2E test for region capture (P1)
- [ ] E2E test for fullscreen capture (P2)
- [ ] Performance test: capture <200ms
- [ ] Memory test: active capture <300MB

---

## Validation Commands

```bash
# Type check
npm run typecheck

# Run tests
npm test

# Start development mode
npm run dev

# Test region capture
# 1. Launch app
# 2. Press Ctrl+Shift+1 (default hotkey)
# 3. Draw rectangle
# 4. Release mouse
# 5. Verify file saved to Pictures/FrameShot/
# 6. Verify clipboard has image
# 7. Verify notification shown
```

---

## Common Issues & Solutions

**Issue**: Overlay doesn't appear above other windows
**Solution**: Verify `alwaysOnTop: true` and `type: 'panel'` in BrowserWindow options

**Issue**: DPI scaling incorrect on high-res displays
**Solution**: Multiply coordinates by `scaleFactor` from Display object

**Issue**: Capture takes >200ms
**Solution**: Profile with Chrome DevTools, check thumbnail size in desktopCapturer options

**Issue**: ESC key doesn't cancel
**Solution**: Verify event listener attached when overlay active

---

## Next Steps After Implementation

1. Run constitution compliance check (Phase 5)
2. Generate tasks.md via `/speckit.tasks` command
3. Begin incremental implementation per tasks
4. Update agent context with new patterns learned

**Estimated Implementation Time**: 3-5 days for P1-P3 with tests
