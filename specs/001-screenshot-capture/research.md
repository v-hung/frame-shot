# Research: Screenshot Capture Modes

**Feature**: 001-screenshot-capture
**Date**: 2026-01-14
**Purpose**: Resolve technical unknowns and establish implementation patterns

## Research Tasks

### 1. Electron desktopCapturer API for Screen/Window Enumeration

**Question**: How does Electron's desktopCapturer API handle multi-monitor setups with mixed DPI settings?

**Findings**:

- `desktopCapturer.getSources({ types: ['screen', 'window'] })` returns array of `DesktopCapturerSource` objects
- Each source includes: `id`, `name`, `thumbnail` (NativeImage), `display_id` (for screens)
- DPI scaling handled automatically via `display_id` mapping to `screen.getAllDisplays()`
- Each Display object provides `scaleFactor` property (1.0 = 100%, 1.5 = 150%, 2.0 = 200%)
- Capture resolution = physical pixels (already scaled), no manual calculation needed
- Window boundaries from `appBounds` property (already DPI-aware)

**Decision**: Use `desktopCapturer.getSources()` + `screen.getAllDisplays()` combination for DPI-aware capture.

**Rationale**: Native Electron APIs handle DPI complexity. No need for manual scaling calculations.

**Alternatives Considered**:

- Manual DPI calculation via Win32 API / macOS CGWindow - Rejected: increases complexity, platform-specific code
- Third-party screen capture libraries - Rejected: unnecessary dependency, Electron built-in sufficient

---

### 2. Overlay Window for Selection UI

**Question**: How to create a full-screen overlay window that appears above all other applications?

**Findings**:

- `BrowserWindow` with options: `transparent: true`, `frame: false`, `alwaysOnTop: true`, `skipTaskbar: true`
- Set `type: 'panel'` (macOS) or `type: 'toolbar'` (Windows/Linux) for always-on-top behavior
- Use `setAlwaysOnTop(true, 'screen-saver')` for highest z-order
- Set bounds to match target display: `setBounds(display.bounds)`
- Enable click-through for dimmed areas: `setIgnoreMouseEvents(true, { forward: true })` with regions
- Cursor change via CSS: `cursor: crosshair` in overlay component

**Decision**: Create dedicated overlay BrowserWindow per capture session with `alwaysOnTop` and `transparent` properties.

**Rationale**: Native Electron window provides OS-level always-on-top guarantee. Transparency enables dimmed background effect.

**Alternatives Considered**:

- Chromeless div overlay in main window - Rejected: cannot appear above other apps, limited to app boundaries
- System-level canvas/layer - Rejected: platform-specific, high complexity

---

### 3. Real-time Region Selection Rendering at 60fps

**Question**: What rendering approach ensures smooth 60fps selection rectangle updates during mouse drag?

**Findings**:

- React state updates with `useCallback` for mouse handlers to prevent re-renders
- CSS transforms for position updates (GPU-accelerated): `transform: translate3d(x, y, 0)`
- `requestAnimationFrame` for batched dimension updates
- Canvas element alternative: `<canvas>` with 2D context for direct pixel manipulation
- Measure performance: React DevTools Profiler to track render times

**Decision**: Use React components with CSS transforms for rectangle rendering. Canvas as fallback if performance insufficient.

**Rationale**: React + CSS transforms leverage GPU acceleration while maintaining component architecture. Canvas adds complexity without proven need.

**Alternatives Considered**:

- Pure canvas rendering - Rejected: lose component reusability, harder to style/theme
- WebGL - Rejected: overkill for 2D rectangle, increases bundle size

---

### 4. Window Boundary Detection Excluding Shadows

**Question**: How to detect true window boundaries excluding OS-applied shadows and decorations?

**Findings**:

- **Windows**: `DwmGetWindowAttribute(DWMWA_EXTENDED_FRAME_BOUNDS)` via native module
- **macOS**: `CGWindowListCopyWindowInfo` provides `kCGWindowBounds` (true bounds without shadow)
- **Linux**: X11 `XGetWindowAttributes` or Wayland compositor APIs
- Electron `desktopCapturer` provides `appBounds` but may include shadows on some platforms
- Native modules required: `node-window-manager` or custom N-API addon

**Decision**: Start with Electron's `appBounds` for MVP (P1-P2). Add native window bounds detection for P3 (Window Capture) if shadow issue confirmed.

**Rationale**: Electron's built-in bounds sufficient for initial implementation. Native modules add complexity and platform-specific maintenance burden.

**Alternatives Considered**:

- Immediate native module integration - Rejected: premature optimization, increases setup complexity
- Manual shadow detection via image analysis - Rejected: unreliable, performance intensive

---

### 5. Simultaneous Clipboard Copy + File Save

**Question**: What is the optimal pattern for executing clipboard copy and file save operations simultaneously?

**Findings**:

- Electron `clipboard.writeImage(nativeImage)` is synchronous (blocks until complete)
- File save `fs.writeFile()` is async (returns Promise)
- Capture image in NativeImage format from `desktopCapturer`
- PNG encoding: `nativeImage.toPNG()` returns Buffer (sync operation)
- Parallel execution: Start both operations, await both: `await Promise.all([clipboard, fileSave])`

**Decision**: Execute clipboard write and file save in parallel using Promise.all after capture completes.

**Rationale**: Minimizes perceived latency. Both operations can proceed independently. Total time = max(clipboard_time, file_time) instead of sum.

**Alternatives Considered**:

- Sequential execution (clipboard first, then file) - Rejected: slower, unnecessary ordering dependency
- Background thread for file save - Rejected: Node.js main thread sufficient for file I/O, added complexity

---

### 6. File Naming with Timestamp Pattern

**Question**: What is the most reliable approach for generating timestamp-based filenames with collision avoidance?

**Findings**:

- Format: `YYYY-MM-DD_HH-MM-SS.png` (user requirement from clarifications)
- JavaScript `Date` object precision: milliseconds (1000 captures/sec theoretical max)
- Collision risk: Low for typical usage (1 capture every few seconds)
- Collision handling: Append counter suffix if file exists: `2026-01-14_15-30-45_1.png`
- Timezone: Use local time (user's machine timezone) via `new Date().toLocaleString()`
- Format library: `date-fns` already in dependencies for consistent formatting

**Decision**: Use `date-fns` `format(new Date(), 'yyyy-MM-dd_HH-mm-ss')` with collision checking via `fs.existsSync()`. Append `_N` suffix if collision detected.

**Rationale**: date-fns provides reliable cross-platform date formatting. Collision checking prevents overwrites. Local timezone matches user expectation.

**Alternatives Considered**:

- UUID/GUID filenames - Rejected: user explicitly requested timestamp pattern
- Millisecond precision in filename - Rejected: unnecessary verbosity, collision risk still extremely low
- UTC timezone - Rejected: local time more intuitive for users

---

### 7. System Notification with Thumbnail

**Question**: How to display system notification with capture thumbnail and clickable file path?

**Findings**:

- Electron `Notification` API: `new Notification({ title, body, icon, actions })`
- Thumbnail as icon: `icon: nativeImage.resize({ width: 64, height: 64 })` (scaled thumbnail)
- Click handler: `notification.on('click', () => shell.showItemInFolder(filePath))`
- Platform differences: Windows shows thumbnail, macOS shows icon, Linux varies by DE
- Flash effect: Animate overlay window opacity: `window.setOpacity(1) → 0.8 → 1` over 200ms

**Decision**: Use Electron Notification with resized capture thumbnail as icon. Click opens file location via `shell.showItemInFolder()`. Flash effect via overlay window opacity animation.

**Rationale**: Native Notification API provides OS-integrated UX. Thumbnail preview gives visual confirmation. Click-to-locate is standard UX pattern.

**Alternatives Considered**:

- Custom in-app notification - Rejected: less native feel, requires additional UI development
- Sound-only feedback - Rejected: less informative, accessibility concerns
- No notification - Rejected: violates user requirement from clarifications

---

## Summary

| Topic             | Decision                                         | Implementation Effort        |
| ----------------- | ------------------------------------------------ | ---------------------------- |
| Screen/Window API | Electron desktopCapturer + screen.getAllDisplays | Low - Built-in               |
| Overlay Window    | Transparent BrowserWindow with alwaysOnTop       | Medium - Window management   |
| 60fps Rendering   | React + CSS transforms (GPU-accelerated)         | Low - Standard React         |
| Window Boundaries | Electron appBounds (MVP), native modules (P3+)   | Low (MVP), High (native)     |
| Clipboard + Save  | Promise.all parallel execution                   | Low - Standard async pattern |
| File Naming       | date-fns timestamp + collision check             | Low - Existing dependency    |
| Notifications     | Electron Notification + thumbnail icon           | Low - Built-in API           |

**Total Complexity**: Medium - Primarily leveraging existing Electron APIs. No custom native modules required for MVP.

**Risk Areas**: Window boundary detection may require native modules for P3. Overlay rendering performance needs validation on lower-end hardware.

**Next Steps**: Proceed to Phase 1 (data-model.md, contracts/, quickstart.md) with decisions above.
