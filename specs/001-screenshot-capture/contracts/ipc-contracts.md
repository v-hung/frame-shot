# IPC Contracts: Screenshot Capture

**Feature**: 001-screenshot-capture
**Date**: 2026-01-14
**Purpose**: Define IPC communication contracts between main and renderer processes

## Contract Overview

All IPC channels follow Electron's `ipcMain.handle()` / `ipcRenderer.invoke()` pattern for async request-response.

**Channel Naming Convention**: `{domain}:{action}`

- Domain: `capture` for all screenshot operations
- Action: Verb describing the operation

---

## Contract 1: List Available Displays

**Channel**: `capture:list-displays`

**Direction**: Renderer → Main

**Request**:

```typescript
// No parameters
```

**Response**:

```typescript
{
  displays: Display[];
}

interface Display {
  id: string;           // Unique display identifier
  bounds: Rectangle;    // {x, y, width, height}
  scaleFactor: number;  // DPI scaling (1.0, 1.5, 2.0, etc.)
  rotation: number;     // 0, 90, 180, 270
  internal: boolean;    // True for laptop screens
  label: string;        // "Monitor 1", "Monitor 2", etc.
}
```

**Usage**: Called when overlay opens to enumerate available monitors for region/fullscreen capture.

**Error Handling**: Returns empty array if no displays detected (should never happen in practice).

---

## Contract 2: List Capturable Windows

**Channel**: `capture:list-windows`

**Direction**: Renderer → Main

**Request**:

```typescript
{
  includeMinimized?: boolean;  // Default: false
}
```

**Response**:

```typescript
{
  windows: CaptureWindow[];
}

interface CaptureWindow {
  id: string;                   // Unique window ID for capture
  name: string;                 // Window title
  bounds: Rectangle;            // Window boundaries
  thumbnail: string;            // Base64-encoded thumbnail PNG
  appName: string;              // Application name
  isVisible: boolean;           // Not minimized/hidden
}
```

**Usage**: Called when window capture mode triggered to show window picker overlay.

**Error Handling**:

- Returns empty array if no capturable windows found
- Excludes FrameShot's own windows from results

**Performance Note**: Thumbnail generation may take 50-100ms per window. Limit to visible windows only by default.

---

## Contract 3: Execute Capture

**Channel**: `capture:execute`

**Direction**: Renderer → Main

**Request**:

```typescript
{
  mode: 'region' | 'fullscreen' | 'window';
  region?: CaptureRegion;    // Required if mode='region'
  window?: {                 // Required if mode='window'
    id: string;
  };
  display?: {                // Required if mode='fullscreen', optional for others
    id: string;
  };
}

interface CaptureRegion {
  x: number;
  y: number;
  width: number;
  height: number;
  displayId: string;
  scaleFactor: number;
}
```

**Response**:

```typescript
{
  success: boolean;
  filePath?: string;         // Set if success=true
  error?: string;            // Set if success=false
  timestamp: string;         // ISO 8601 format
  dimensions: {
    width: number;
    height: number;
  };
}
```

**Usage**: Called when user confirms capture (mouse release, Enter key, or immediate for fullscreen).

**Side Effects**:

- Captures screenshot
- Copies to clipboard (if enabled in settings)
- Saves to file with timestamp filename
- Shows system notification

**Error Handling**:

- Returns `success: false` with error message if:
  - Invalid region (out of bounds)
  - Window not found or hidden
  - File save permission denied
  - Clipboard operation failed (non-fatal, continues with file save)

**Performance**: Must complete <200ms for full capture + save operations.

---

## Contract 4: Get Cursor Position

**Channel**: `capture:get-cursor-position`

**Direction**: Renderer → Main

**Request**:

```typescript
// No parameters
```

**Response**:

```typescript
{
  x: number // Global screen X coordinate
  y: number // Global screen Y coordinate
  displayId: string // Which display cursor is on
}
```

**Usage**: Determine active display for fullscreen capture (capture where cursor is located).

**Error Handling**: Returns primary display if cursor position cannot be determined.

---

## Contract 5: Register Global Hotkeys

**Channel**: `capture:register-hotkeys`

**Direction**: Renderer → Main (called on app startup)

**Request**:

```typescript
{
  hotkeys: {
    region: string // e.g., "Ctrl+Shift+1"
    fullscreen: string // e.g., "Ctrl+Shift+2"
    window: string // e.g., "Ctrl+Shift+3"
  }
}
```

**Response**:

```typescript
{
  success: boolean;
  registered: string[];    // Successfully registered shortcuts
  failed: string[];        // Failed shortcuts (already in use)
}
```

**Usage**: Register global hotkeys on app launch. Triggers IPC events back to renderer when pressed.

**Event Channel**: Main emits `capture:hotkey-triggered` with `{ mode: CaptureModeType }` when hotkey pressed.

**Error Handling**:

- Returns partial success if some hotkeys fail to register
- Continues with registered hotkeys, notifies user of conflicts

---

## Contract 6: Save Screenshot (Alternative Path)

**Channel**: `capture:save-file`

**Direction**: Renderer → Main

**Request**:

```typescript
{
  imageData: string;         // Base64-encoded PNG
  customFilename?: string;   // Override timestamp naming
  customPath?: string;       // Override default save location
}
```

**Response**:

```typescript
{
  success: boolean;
  filePath?: string;
  error?: string;
}
```

**Usage**: Alternative save path for future annotation feature (save edited image).

**Status**: Not used in v1, defined for future compatibility.

---

## Preload Bridge Exposure

**File**: `src/preload/capture.preload.ts`

```typescript
import { contextBridge, ipcRenderer } from 'electron'

export const captureAPI = {
  // Query operations
  listDisplays: () => ipcRenderer.invoke('capture:list-displays'),

  listWindows: (includeMinimized?: boolean) =>
    ipcRenderer.invoke('capture:list-windows', { includeMinimized }),

  getCursorPosition: () => ipcRenderer.invoke('capture:get-cursor-position'),

  // Capture execution
  execute: (params: {
    mode: 'region' | 'fullscreen' | 'window'
    region?: CaptureRegion
    window?: { id: string }
    display?: { id: string }
  }) => ipcRenderer.invoke('capture:execute', params),

  // Hotkey management
  registerHotkeys: (hotkeys: Record<string, string>) =>
    ipcRenderer.invoke('capture:register-hotkeys', { hotkeys }),

  // Event listeners
  onHotkeyTriggered: (callback: (mode: string) => void) => {
    ipcRenderer.on('capture:hotkey-triggered', (_, { mode }) => callback(mode))
  },

  removeHotkeyListener: () => {
    ipcRenderer.removeAllListeners('capture:hotkey-triggered')
  }
}

// Expose via contextBridge
contextBridge.exposeInMainWorld('captureAPI', captureAPI)
```

**Type Definitions** (for renderer):

```typescript
// src/renderer/src/types/electron.d.ts
export interface CaptureAPI {
  listDisplays(): Promise<{ displays: Display[] }>
  listWindows(includeMinimized?: boolean): Promise<{ windows: CaptureWindow[] }>
  getCursorPosition(): Promise<{ x: number; y: number; displayId: string }>
  execute(params: CaptureExecuteParams): Promise<CaptureExecuteResponse>
  registerHotkeys(hotkeys: Record<string, string>): Promise<RegisterHotkeysResponse>
  onHotkeyTriggered(callback: (mode: string) => void): void
  removeHotkeyListener(): void
}

declare global {
  interface Window {
    captureAPI: CaptureAPI
  }
}
```

---

## Error Response Format

All contracts follow consistent error format:

```typescript
{
  success: false;
  error: string;          // Human-readable error message
  errorCode?: string;     // Machine-readable error code
  details?: unknown;      // Additional error context
}
```

**Error Codes**:

- `PERMISSION_DENIED`: Screen recording permission not granted (macOS)
- `WINDOW_NOT_FOUND`: Target window closed or hidden
- `REGION_OUT_OF_BOUNDS`: Capture region exceeds display bounds
- `FILE_SAVE_FAILED`: Cannot write to save location
- `CLIPBOARD_FAILED`: Clipboard operation failed (non-fatal)
- `HOTKEY_CONFLICT`: Global shortcut already registered by another app

---

## Performance Targets

| Contract             | Target Latency                    |
| -------------------- | --------------------------------- |
| list-displays        | < 10ms                            |
| list-windows         | < 100ms (depends on window count) |
| get-cursor-position  | < 5ms                             |
| execute (region)     | < 200ms                           |
| execute (fullscreen) | < 150ms                           |
| execute (window)     | < 200ms                           |
| register-hotkeys     | < 50ms                            |

---

## Testing Strategy

**Contract Tests** (integration tests):

1. Mock Electron APIs in test environment
2. Validate request/response type contracts
3. Test error conditions (invalid params, missing windows, etc.)
4. Verify side effects (file created, clipboard populated)
5. Performance benchmarks for all contracts

**Test Framework**: Vitest with Electron test environment

---

## Summary

- **6 IPC contracts** defined for capture operations
- **Type-safe** request/response definitions
- **Error handling** with consistent format
- **Performance targets** for each contract
- **Preload bridge** with contextBridge for security
- **Test strategy** outlined for contract validation

**Next Steps**: Generate quickstart.md with implementation examples.
