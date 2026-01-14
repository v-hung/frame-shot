# Data Model: Screenshot Capture Modes

**Feature**: 001-screenshot-capture
**Date**: 2026-01-14
**Purpose**: Define entities, relationships, and state management for capture functionality

## Core Entities

### CaptureMode

**Purpose**: Enumeration representing the three capture types

**Fields**:

- `type`: `'region' | 'fullscreen' | 'window'` - Capture mode identifier
- `hotkey`: `string` - Global keyboard shortcut (e.g., "Ctrl+Shift+1")
- `label`: `string` - Human-readable name for UI display
- `icon`: `string` - Icon identifier from Lucide React

**Validation Rules**:

- `type` must be one of three enum values
- `hotkey` must follow Electron globalShortcut format
- Each type has unique hotkey (no conflicts)

**State Transitions**: N/A (immutable enum)

---

### CaptureRegion

**Purpose**: Represents a rectangular selection area for region capture

**Fields**:

- `x`: `number` - Top-left X coordinate (screen pixels)
- `y`: `number` - Top-left Y coordinate (screen pixels)
- `width`: `number` - Rectangle width (pixels)
- `height`: `number` - Rectangle height (pixels)
- `displayId`: `string` - Source monitor identifier (from Electron Display.id)
- `scaleFactor`: `number` - DPI scaling factor (1.0, 1.5, 2.0, etc.)

**Validation Rules**:

- `x`, `y`, `width`, `height` must be non-negative integers
- `width` and `height` must be > 0 (no zero-area captures)
- Coordinates must be within display bounds
- `scaleFactor` must be > 0

**Relationships**:

- References Display via `displayId`
- Used by CaptureResult to record source region

**State Transitions**:

- Initial → Drawing (user clicks and drags)
- Drawing → Adjusting (user drags edges/corners)
- Adjusting → Confirmed (user releases mouse or presses Enter)
- Any → Cancelled (user presses ESC)

---

### CaptureWindow

**Purpose**: Represents a target application window for window capture

**Fields**:

- `id`: `string` - Unique window identifier (from Electron DesktopCapturerSource.id)
- `name`: `string` - Window title
- `bounds`: `Rectangle` - Window boundaries {x, y, width, height}
- `thumbnail`: `NativeImage` - Preview thumbnail from desktopCapturer
- `appName`: `string` - Application name (e.g., "Google Chrome")
- `isVisible`: `boolean` - Whether window is currently visible (not minimized)

**Validation Rules**:

- `id` must be unique
- `bounds` must have positive width and height
- `isVisible` determines if window is capturable

**Relationships**:

- Used by CaptureResult to record source window
- Matches Display for position detection

**State Transitions**:

- Enumerated → Highlighted (user hovers)
- Highlighted → Selected (user clicks)
- Selected → Captured (capture executed)

---

### Display

**Purpose**: Represents a physical monitor in multi-monitor setup

**Fields**:

- `id`: `string` - Unique display identifier (from Electron Display.id)
- `bounds`: `Rectangle` - Display boundaries {x, y, width, height}
- `scaleFactor`: `number` - DPI scaling factor (1.0, 1.5, 2.0, etc.)
- `rotation`: `number` - Display rotation angle (0, 90, 180, 270)
- `internal`: `boolean` - Whether display is internal (laptop screen) vs external
- `label`: `string` - Display label for UI ("Monitor 1", "Monitor 2")

**Validation Rules**:

- `id` must be unique
- `bounds` must not overlap with other displays (system validates)
- `scaleFactor` must be > 0
- `rotation` must be 0, 90, 180, or 270

**Relationships**:

- Referenced by CaptureRegion via `displayId`
- Used by fullscreen capture to target specific monitor

**State Transitions**: N/A (reflects OS display state, read-only)

---

### CaptureResult

**Purpose**: Contains captured image data and metadata

**Fields**:

- `image`: `NativeImage` - Captured screenshot (Electron NativeImage object)
- `buffer`: `Buffer` - PNG-encoded image data (from image.toPNG())
- `width`: `number` - Image width (pixels)
- `height`: `number` - Image height (pixels)
- `format`: `'png'` - File format (PNG only for v1)
- `timestamp`: `Date` - Capture time
- `sourceMode`: `CaptureMode.type` - Which capture mode was used
- `sourceRegion?`: `CaptureRegion` - Optional region data (if mode = 'region')
- `sourceWindow?`: `CaptureWindow` - Optional window data (if mode = 'window')
- `sourceDisplay`: `Display` - Source monitor
- `filePath`: `string` - Saved file path (after save completes)

**Validation Rules**:

- `image` and `buffer` must not be null
- `width` and `height` must match image dimensions
- `sourceMode` determines which source field is populated
- `filePath` set only after successful file save

**Relationships**:

- Contains CaptureRegion (region mode)
- Contains CaptureWindow (window mode)
- References Display (all modes)

**State Transitions**:

- Captured → Encoding (image.toPNG())
- Encoding → Saving (Promise.all clipboard + file)
- Saving → Completed (filePath set, notification shown)
- Any → Failed (error state with message)

---

### CaptureSettings

**Purpose**: User preferences for capture behavior

**Fields**:

- `defaultSaveLocation`: `string` - Folder path for auto-save
- `fileFormat`: `'png'` - Default format (PNG only for v1)
- `quality`: `number` - Compression quality (100 for PNG lossless)
- `hotkeys`: `Map<CaptureMode.type, string>` - Hotkey bindings per mode
- `copyToClipboard`: `boolean` - Whether to copy to clipboard (default: true)
- `saveToFile`: `boolean` - Whether to save to file (default: true)
- `showNotification`: `boolean` - Whether to show system notification (default: true)
- `flashEffect`: `boolean` - Whether to show flash effect (default: true)
- `autoIncrementOnCollision`: `boolean` - Append \_N on filename collision (default: true)

**Validation Rules**:

- `defaultSaveLocation` must be writable directory
- `quality` must be 0-100 range
- At least one of `copyToClipboard` or `saveToFile` must be true
- `hotkeys` must not have duplicate shortcuts

**Relationships**: None (global configuration)

**State Transitions**: Modified via settings UI (out of scope for this feature)

**Default Values**:

```typescript
{
  defaultSaveLocation: app.getPath('pictures') + '/FrameShot',
  fileFormat: 'png',
  quality: 100,
  hotkeys: new Map([
    ['region', 'Ctrl+Shift+1'],
    ['fullscreen', 'Ctrl+Shift+2'],
    ['window', 'Ctrl+Shift+3']
  ]),
  copyToClipboard: true,
  saveToFile: true,
  showNotification: true,
  flashEffect: true,
  autoIncrementOnCollision: true
}
```

---

## Relationships Diagram

```
Display (1) ←──┐
               │
               │ references
               │
CaptureRegion ─┼─→ (1) CaptureResult
               │
CaptureWindow ─┘

CaptureMode (enum) ─→ sourceMode in CaptureResult

CaptureSettings (global singleton)
```

---

## State Management (Zustand Store)

### CaptureStore

**Purpose**: Manage capture mode state in renderer process

**State Shape**:

```typescript
interface CaptureStoreState {
  // Current state
  isActive: boolean
  mode: CaptureMode.type | null
  currentRegion: CaptureRegion | null
  currentWindow: CaptureWindow | null
  availableWindows: CaptureWindow[]
  displays: Display[]

  // Actions
  startCapture: (mode: CaptureMode.type) => void
  cancelCapture: () => void
  setRegion: (region: CaptureRegion) => void
  clearRegion: () => void
  selectWindow: (window: CaptureWindow) => void
  executeCapture: () => Promise<void>

  // Derived state
  canCapture: boolean // true if region/window selected
}
```

**Persistence**: No persistence (session-only state)

---

## Data Flow

### Region Capture Flow

1. User triggers hotkey → `startCapture('region')`
2. Overlay window opens → `isActive = true`, `mode = 'region'`
3. User draws rectangle → `setRegion({ x, y, width, height, displayId, scaleFactor })`
4. User releases mouse → `executeCapture()`
5. IPC call to main process → `ipcRenderer.invoke('capture:execute', { mode, region })`
6. Main process captures → Returns `CaptureResult`
7. Renderer receives result → Show notification, reset store

### Full Screen Capture Flow

1. User triggers hotkey → `startCapture('fullscreen')`
2. Detect active display (cursor position)
3. Immediately `executeCapture()` (no overlay)
4. IPC call → `ipcRenderer.invoke('capture:execute', { mode, display })`
5. Main process captures → Returns `CaptureResult`
6. Show notification

### Window Capture Flow

1. User triggers hotkey → `startCapture('window')`
2. Enumerate windows → `availableWindows = await ipcRenderer.invoke('capture:list-windows')`
3. Overlay shows window highlights
4. User hovers/clicks window → `selectWindow(window)`
5. `executeCapture()` → IPC call with selected window
6. Main process captures → Returns `CaptureResult`
7. Show notification

---

## Database Schema

**Status**: Not applicable - No persistent storage required for v1

**Future Enhancement**: Capture history feature would require:

- `captures` table (id, file_path, timestamp, mode, thumbnail_path)
- `tags` table for categorization
- Full-text search on metadata

---

## File System Structure

```
{app.getPath('pictures')}/
└── FrameShot/
    ├── 2026-01-14_09-15-30.png
    ├── 2026-01-14_09-20-45.png
    ├── 2026-01-14_09-20-45_1.png  # Collision with _N suffix
    └── 2026-01-14_15-30-12.png
```

**Naming Pattern**: `YYYY-MM-DD_HH-MM-SS.png`
**Collision Handling**: Append `_N` suffix if file exists

---

## Type Definitions (TypeScript)

```typescript
// src/main/types/capture.types.ts

export type CaptureModeType = 'region' | 'fullscreen' | 'window'

export interface CaptureMode {
  type: CaptureModeType
  hotkey: string
  label: string
  icon: string
}

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
  bounds: Rectangle
  thumbnail: Electron.NativeImage
  appName: string
  isVisible: boolean
}

export interface Display {
  id: string
  bounds: Rectangle
  scaleFactor: number
  rotation: number
  internal: boolean
  label: string
}

export interface CaptureResult {
  image: Electron.NativeImage
  buffer: Buffer
  width: number
  height: number
  format: 'png'
  timestamp: Date
  sourceMode: CaptureModeType
  sourceRegion?: CaptureRegion
  sourceWindow?: CaptureWindow
  sourceDisplay: Display
  filePath: string
}

export interface CaptureSettings {
  defaultSaveLocation: string
  fileFormat: 'png'
  quality: number
  hotkeys: Map<CaptureModeType, string>
  copyToClipboard: boolean
  saveToFile: boolean
  showNotification: boolean
  flashEffect: boolean
  autoIncrementOnCollision: boolean
}

interface Rectangle {
  x: number
  y: number
  width: number
  height: number
}
```

---

## Summary

- **6 core entities**: CaptureMode, CaptureRegion, CaptureWindow, Display, CaptureResult, CaptureSettings
- **State management**: Zustand store for renderer state (CaptureStore)
- **No database**: File system only for v1
- **Type safety**: Full TypeScript definitions for all entities
- **Validation**: Field constraints documented for implementation
- **Relationships**: Minimal coupling, clear data flow

**Next Steps**: Define IPC contracts in `contracts/` directory.
