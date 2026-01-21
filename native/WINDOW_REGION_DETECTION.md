# Window Region Detection

## Overview

This feature detects and distinguishes different areas within the window (Title Bar vs Client Area) to allow for more accurate image capture.

## Architecture

### 1. Native C++ Module (`main.cpp`)

**API Output:**

```json
{
  "success": true,
  "hwnd": 12345678,
  "title": "Google Chrome",
  "processName": "chrome.exe",
  "windowBounds": {
    "x": 100,
    "y": 100,
    "width": 1200,
    "height": 800
  },
  "clientBounds": {
    "x": 100,
    "y": 140, // Offset by title bar height
    "width": 1200,
    "height": 760
  },
  "titleBarBounds": {
    "x": 100,
    "y": 100,
    "width": 1200,
    "height": 40
  },
  "cursor": {
    "x": 500,
    "y": 120
  },
  "isVisible": true
}
```

**Key Changes:**

- Added `GetClientRect()` to get content area dimensions
- Added `ClientToScreen()` to convert client coordinates to screen coordinates
- Calculate title bar height: `titleBarHeight = clientTopLeft.y - windowRect.top`
- Return 3 separate bounds: window, client, titleBar

### 2. TypeScript Types

**CaptureWindow Interface:**

```typescript
export interface CaptureWindow {
  windowBounds: { x: number; y: number; width: number; height: number } // Full window
  clientBounds: { x: number; y: number; width: number; height: number } // Content only
  titleBarBounds: { x: number; y: number; width: number; height: number } // Title bar only
  // ... other fields
}
```

### 3. Region Detection Logic

**Algorithm:**

```typescript
detectCursorRegion(cursor, titleBar, client) {
  // Check title bar first (higher priority)
  if (cursor inside titleBar bounds) {
    return 'title-bar'
  }

  // Check client area
  if (cursor inside client bounds) {
    return 'client'
  }

  return 'outside'
}
```

### 4. UI Visualization

**Color Coding:**

- 🔵 **Blue** - Full Window Bounds
- 🟡 **Yellow** - Title Bar (capture entire window)
- 🟢 **Green** - Client Area (capture content only)

**Live Indicator:**

```
📍 Title Bar (Full Window Capture)    ← When hovering title bar
📍 Client Area (Content Only Capture) ← When hovering content
```

## Use Cases

### Example 1: Chrome Browser

**Cursor on Title Bar (tabs area):**

- Captures: Full browser window including tabs, address bar, and content
- Use Case: Showing the entire Chrome UI

**Cursor on Client Area (web page):**

- Captures: Only the web page content
- Use Case: Capturing just the website, without browser chrome

### Example 2: Microsoft Word

**Cursor on Title Bar (with document name):**

- Captures: Full Word window including ribbon, title bar, status bar
- Use Case: Showing the entire app interface

**Cursor on Client Area (document):**

- Captures: Only the document content area
- Use Case: Capturing just the text/document content

### Example 3: VS Code

**Cursor on Title Bar:**

- Captures: Full VS Code with all panels, sidebars
- Use Case: Tutorial showing entire IDE

**Cursor on Client Area (editor):**

- Captures: Code editor pane only
- Use Case: Focusing on code without distractions

## Build & Test

### Build Native Module

```bash
cd native/frameshot-native
.\build.bat
```

### Run Test Page

```bash
npm run dev
```

Navigate to `#/window-picker` to test:

1. Click "Start Live Tracking"
2. Move mouse over different windows
3. Watch the region indicator change as you hover over title bar vs content
4. See the visual representation update in real-time

## API Reference

### Native Process Service

```typescript
nativeService.getWindowAtCursor()
// Returns: { success, data: { windowBounds, clientBounds, titleBarBounds, ... } }
```

### IPC Handlers

```typescript
ipcMain.handle('window-picker:get-at-cursor', async () => {
  const result = await nativeService.getWindowAtCursor()
  return result
})
```

### Preload API

```typescript
window.windowPickerAPI.getAtCursor()
// Returns Promise<{ success, data, error }>
```

## Technical Details

### Windows API Calls

1. **GetWindowRect(hwnd, &windowRect)**
   - Gets full window bounds including invisible borders
   - Includes title bar, borders, drop shadow

2. **GetClientRect(hwnd, &clientRect)**
   - Gets client area dimensions (relative to window)
   - Content area only, excludes title bar and borders

3. **ClientToScreen(hwnd, &point)**
   - Converts client coordinates to screen coordinates
   - Used to get absolute position of client area

4. **DwmGetWindowAttribute()**
   - Gets visible frame bounds (excluding invisible borders)
   - More accurate than GetWindowRect for modern windows

### Coordinate Systems

**Screen Coordinates:**

- Origin: Top-left of primary monitor
- Used for: windowBounds, titleBarBounds, cursor position

**Client Coordinates:**

- Origin: Top-left of window's client area
- GetClientRect returns: (0, 0, width, height)
- Must convert to screen coords for absolute positioning

### Title Bar Height Calculation

```cpp
POINT clientTopLeft = {0, 0};
ClientToScreen(hwnd, &clientTopLeft);  // Convert (0,0) of client to screen
int titleBarHeight = clientTopLeft.y - windowRect.top;
```

This handles:

- Windows with thick borders
- Windows with transparent glass frames
- Maximized windows (where borders change)
- Different DPI scales

## Future Enhancements

1. **Smart Region Selection**
   - Auto-select best region based on content
   - Machine learning to detect important UI elements

2. **Multi-Region Capture**
   - Capture multiple regions simultaneously
   - Stitch different regions together

3. **Region Presets**
   - Save common region selections
   - Quick switch between presets

4. **Visual Overlay**
   - Show real-time overlay on screen
   - Highlight detected regions as you move cursor

5. **Edge Detection**
   - Detect window borders more accurately
   - Handle rounded corners, shadows

## Known Limitations

1. **Title Bar Height Varies:**
   - Different apps have different title bar heights
   - Some apps have custom title bars (e.g., VS Code)
   - Maximized windows may have no visible title bar

2. **Client Area Detection:**
   - Some apps draw in title bar area (Chrome tabs)
   - Some have custom window chrome
   - Fullscreen apps may have no title bar

3. **DPI Scaling:**
   - Need to account for DPI scale factor
   - High DPI displays may have coordinate offset

4. **Multi-Monitor:**
   - Coordinates must be screen-relative
   - Virtual screen spans multiple monitors

## References

- [GetWindowRect - Microsoft Docs](https://docs.microsoft.com/en-us/windows/win32/api/winuser/nf-winuser-getwindowrect)
- [GetClientRect - Microsoft Docs](https://docs.microsoft.com/en-us/windows/win32/api/winuser/nf-winuser-getclientrect)
- [ClientToScreen - Microsoft Docs](https://docs.microsoft.com/en-us/windows/win32/api/winuser/nf-winuser-clienttoscreen)
- [DwmGetWindowAttribute - Microsoft Docs](https://docs.microsoft.com/en-us/windows/win32/api/dwmapi/nf-dwmapi-dwmgetwindowattribute)

---

**Last Updated:** January 20, 2026
**Version:** 1.0.0
