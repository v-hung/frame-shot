# FrameShot - Screen Capture Application

**Version:** 1.0.0
**Status:** In Development

A lightweight, cross-platform desktop screenshot tool built with Electron, React, and TypeScript.

## Features

### Screenshot Capture Modes

FrameShot supports three capture modes, each accessible via global hotkeys:

#### 1. Region Capture (Ctrl+Shift+1 / Cmd+Shift+1)

- **Interactive Selection**: Click and drag to select any rectangular area on your screen
- **Live Dimensions**: Real-time width × height display while selecting
- **Keyboard Controls**:
  - **Arrow Keys**: Nudge selection by 1px (hold Shift for 10px)
  - **Enter**: Confirm capture
  - **Escape**: Cancel capture or clear current selection
- **Visual Feedback**: Semi-transparent overlay with crosshair cursor for precision

#### 2. Fullscreen Capture (Ctrl+Shift+2 / Cmd+Shift+2)

- **Instant Capture**: Captures the entire screen of the monitor where your cursor is located
- **Multi-Monitor**: Automatically detects and captures the active display
- **No UI Interruption**: Executes immediately with flash animation feedback

#### 3. Window Capture (Ctrl+Shift+3 / Cmd+Shift+3)

- **Window Picker**: Grid view of all capturable windows with live thumbnails
- **Smart Filtering**: Excludes FrameShot's own windows and minimized windows
- **Click to Capture**: Select any window thumbnail to capture it at full resolution

### Core Capabilities

- **Clipboard Integration**: All captures automatically copied to clipboard (FR-010)
- **File Auto-Save**: Screenshots saved to `~/Pictures/FrameShot` with timestamp naming (FR-004)
  - Format: `YYYY-MM-DD_HH-MM-SS.png`
  - Collision handling: Adds `_N` suffix if filename exists
- **System Notifications**: Success notification with thumbnail and click-to-open file location (FR-007, FR-016)
- **Flash Animation**: 200ms white flash confirms capture completion (FR-006)
- **High DPI Support**: Handles mixed DPI multi-monitor setups (FR-009)

### Technical Stack

- **Runtime**: Electron 39.2.6 (Node.js ~20.x)
- **Frontend**: React 19.2.1 with TypeScript 5.9.3
- **Build**: electron-vite 5.0.0 (Vite 7.2.6)
- **Styling**: Tailwind CSS 4.1.18
- **State**: Zustand 5.0.9
- **Date Handling**: date-fns 4.1.0

## Project Goal (Original Brief)

Build a cross-platform desktop application for screen capture and video recording, similar to Snagit. Target platforms: Windows, macOS, and Linux.

## Target Users

- Content creators who need to capture and annotate screenshots
- Developers creating documentation and tutorials
- Technical writers and educators
- Business professionals for presentations and reports

## Planned Features (Future Roadmap)

### Additional Screenshot Modes

## Quick Start

### Installation (Development)

```bash
# Install dependencies
npm install

# Run in development mode
npm run dev

# Build for production
npm run build:win  # Windows
npm run build:mac  # macOS
npm run build:linux  # Linux
```

### Usage

**Global Hotkeys** (registered at startup):

- **Ctrl+Shift+1** (Cmd+Shift+1 on macOS): Region Capture
- **Ctrl+Shift+2** (Cmd+Shift+2 on macOS): Fullscreen Capture
- **Ctrl+Shift+3** (Cmd+Shift+3 on macOS): Window Capture

**Region Capture Workflow**:

1. Press Ctrl+Shift+1
2. Click and drag to select area
3. Use arrow keys to fine-tune (Shift = 10px nudge)
4. Press Enter to capture (or Escape to cancel)
5. Image automatically copied to clipboard and saved to file

**Screenshots Folder**: `~/Pictures/FrameShot` (Windows/macOS/Linux)

### Permissions (macOS)

On first launch, macOS will prompt for **Screen Recording** permission. Grant access in:

```
System Settings → Privacy & Security → Screen Recording
```

Enable FrameShot in the list and restart the app.

## Architecture

### Multi-Process Structure

- **Main Process** (Node.js): Screen/window capture, file I/O, global hotkeys
- **Renderer Process** (React): Capture overlay UI, user interactions
- **Preload Bridge**: Secure IPC communication between main and renderer

### Key Components

**Main Process**:

- `CaptureService`: Orchestrates capture operations (execute, clipboard, notifications)
- `ScreenService`: Display enumeration, screen capture via desktopCapturer
- `WindowService`: Window enumeration and capture
- `FileService`: File save with collision handling
- `capture.handlers.ts`: IPC request handlers

**Renderer Process**:

- `CaptureOverlay`: Root capture UI container
- `RegionSelector`: Interactive rectangle selection
- `WindowPicker`: Window selection grid
- `captureStore` (Zustand): Capture state management

**IPC Contracts**:

- `capture:execute` - Execute capture operation
- `capture:list-windows` - Get capturable windows
- `capture:trigger` - Hotkey event notification

## Future Roadmap (Not Implemented)

### Video Recording

**Screen Recording**

- Record full screen or selected region
- Show recording indicator (red dot or border)
- Pause/resume capability

**Audio Options**

- System audio (what's playing on computer)
- Microphone input
- Both simultaneously
- Option to mute

**Webcam Overlay** (optional for v1)

- Picture-in-picture webcam during screen recording
- Adjustable size and position

### 3. Editing & Annotation Tools

**Drawing Tools**

- Arrows (different styles: straight, curved)
- Shapes (rectangle, circle, line)
- Text boxes with custom fonts and sizes
- Highlighter (semi-transparent overlay)
- Freehand pen/pencil

**Image Adjustments**

- Crop and resize
- Blur/pixelate sensitive areas
- Add borders or drop shadows

**Undo/Redo**

- Full editing history
- Keyboard shortcuts (Ctrl+Z, Ctrl+Y)

### 4. Save & Share Options

**File Formats**

- Images: PNG, JPG, WebP, GIF
- Video: MP4, WebM

**Quick Actions**

- Copy to clipboard automatically
- Save to default folder with auto-naming
- Print directly

**Cloud Integration** (future enhancement)

- Upload to Google Drive, Dropbox, etc.
- Generate shareable links

## User Experience Requirements

### Quick Access

- Global keyboard shortcuts (customizable)
- System tray icon with quick capture menu
- Should feel fast - capture within 1-2 seconds

### Intuitive UI

- Minimal interface during capture (don't obstruct)
- Clear visual feedback (flash effect, sound notification)
- Preview before saving option

### Customization

- User can set default save location
- Choose default file format and quality
- Customize hotkeys
- Auto-save vs. prompt for location

## Technical Requirements

### Performance

- Low memory footprint when idle
- Smooth recording at 30+ fps
- No lag during region selection
- Fast image processing (< 1 second for normal screenshots)

### Quality

- Support high-DPI displays (4K, Retina)
- No compression artifacts on PNG
- Adjustable video quality settings

### Cross-Platform

- Look and feel native on each OS
- Handle platform-specific permissions (macOS screen recording)
- Respect OS conventions (menu placement, shortcuts)

### Security

- No telemetry or data collection
- Local-only processing
- Secure storage of user settings

## Non-Functional Requirements

### Reliability

- Don't crash on edge cases (no screens detected, permission denied)
- Graceful error messages
- Auto-recovery from failed captures

### Accessibility

- Keyboard-only operation possible
- Screen reader friendly (for settings and UI)
- High contrast mode support

### Updates

- Easy update mechanism
- Notify user of new versions
- Changelog visible in app

## Nice-to-Have Features (Future Versions)

- OCR text extraction from screenshots
- GIF creation from video clips
- Batch processing multiple captures
- Annotation templates (arrows, common labels)
- Smart crop suggestions using AI
- Browser extension for web capture
- Team collaboration (shared captures)
- Capture history with search

## Success Criteria

The application is successful if:

- User can capture any screen content in < 3 clicks
- Editing tools are intuitive without tutorial
- Performance feels snappy on mid-range hardware
- Users prefer it over built-in OS screenshot tools
- Zero data loss (all captures save reliably)

## Design Preferences

- **Modern UI**: Clean, minimal, not cluttered
- **Dark mode**: Support system theme preference
- **Responsive**: Resize gracefully on different screen sizes
- **Professional**: Suitable for business use, not toy-like

## Constraints

- Must work offline (no internet required for core features)
- Startup time < 2 seconds
- Should work on computers from last 5 years (reasonable hardware requirements)

## Questions for AI Assistant to Consider

When starting this project, please propose:

1. **Technology stack** - What frameworks/libraries best fit these requirements?
2. **Architecture** - How should the app be structured?
3. **Development approach** - What should we build first (MVP)?
4. **Potential challenges** - What technical difficulties do you foresee?
5. **Trade-offs** - Where should we compromise for v1?
