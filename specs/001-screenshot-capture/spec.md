# Feature Specification: Screenshot Capture Modes

**Feature Branch**: `001-screenshot-capture`
**Created**: 2026-01-14
**Status**: Draft
**Input**: User description: "Please help me build a screenshot application that can capture the entire screen, capture a window, and capture a specific area."

## Clarifications

### Session 2026-01-14

- Q: After a region capture is taken (mouse button released), what should happen to the captured image? → A: Automatically copy to clipboard AND save to default folder (like Snagit, ShareX)
- Q: What notification should users receive after a successful capture to confirm the action completed? → A: Flash effect + system notification with thumbnail and file path
- Q: When user presses ESC during region selection, should the application return to idle state or stay ready for another capture attempt? → A: Stay in capture mode (overlay remains, user can immediately start new selection)
- Q: What file naming pattern should be used for automatically saved screenshots? → A: Timestamp-based: YYYY-MM-DD_HH-MM-SS.png (e.g., 2026-01-12_09-20-06.png)

## User Scenarios & Testing _(mandatory)_

<!--
  IMPORTANT: User stories should be PRIORITIZED as user journeys ordered by importance.
  Each user story/journey must be INDEPENDENTLY TESTABLE - meaning if you implement just ONE of them,
  you should still have a viable MVP (Minimum Viable Product) that delivers value.

  Assign priorities (P1, P2, P3, etc.) to each story, where P1 is the most critical.
  Think of each story as a standalone slice of functionality that can be:
  - Developed independently
  - Tested independently
  - Deployed independently
  - Demonstrated to users independently
-->

### User Story 1 - Region Capture with Selection Tool (Priority: P1)

As a user, I want to select a specific rectangular area of my screen to capture, so I can focus on exactly what I need without capturing unnecessary content.

**Why this priority**: Region capture is the most frequently used capture mode for creating documentation, tutorials, and sharing specific content. It provides the most flexibility and control, making it the essential foundation for a screenshot tool.

**Independent Test**: Can be fully tested by triggering region capture, drawing a selection rectangle on screen, and verifying the captured image matches the selected region boundaries. Delivers immediate value as a standalone screenshot tool.

**Acceptance Scenarios**:

1. **Given** the application is running in system tray, **When** user triggers region capture (via hotkey or tray menu), **Then** screen overlay appears with crosshair cursor and dimmed background
2. **Given** region selection mode is active, **When** user clicks and drags to draw rectangle, **Then** selection rectangle shows with real-time dimension display (width x height in pixels)
3. **Given** user has drawn selection rectangle, **When** user releases mouse button, **Then** capture is taken and simultaneously copied to clipboard and saved to default folder
4. **Given** region selection mode is active with drawn rectangle, **When** user presses ESC key, **Then** selection is cleared but overlay remains active for immediate retry
5. **Given** user is drawing selection rectangle, **When** user adjusts rectangle by dragging edges or corners, **Then** selection updates smoothly at 60fps with updated dimensions
6. **Given** selection rectangle is drawn, **When** user presses Enter key, **Then** capture is confirmed and taken of the selected region
7. **Given** region capture overlay is active with no selection, **When** user presses ESC key twice, **Then** overlay closes and application returns to idle state

---

### User Story 2 - Full Screen Capture (Priority: P2)

As a user, I want to capture my entire screen (or a specific monitor in multi-monitor setups) with a single action, so I can quickly capture complete screen states for presentations or documentation.

**Why this priority**: Full screen capture is simpler to implement than region capture and provides quick utility for users who need complete screen captures. Common for capturing application states, system configurations, or entire workflows.

**Independent Test**: Can be tested independently by triggering full screen capture and verifying the captured image matches the entire display dimensions. In multi-monitor setups, verify each monitor can be captured separately.

**Acceptance Scenarios**:

1. **Given** the application is running, **When** user triggers full screen capture (via hotkey or menu), **Then** entire active monitor is captured within 200ms
2. **Given** user has multiple monitors, **When** full screen capture is triggered, **Then** system captures the monitor where the cursor is located
3. **Given** user has multiple monitors, **When** user accesses monitor selection menu, **Then** system shows numbered list of all available displays
4. **Given** user selects a specific monitor from the menu, **When** capture is triggered, **Then** only the selected monitor is captured
5. **Given** full screen capture completes, **When** image is saved, **Then** visual flash effect and system notification with thumbnail appear
6. **Given** user triggers full screen capture on high-DPI display (4K, Retina), **When** capture completes, **Then** full native resolution is preserved

---

### User Story 3 - Window Capture with Picker (Priority: P3)

As a user, I want to capture a specific application window, so I can share or document exactly one application without including my desktop or other windows.

**Why this priority**: Window capture is valuable for clean documentation and tutorials where you want to focus on one application without desktop clutter. Slightly less common than region capture but provides professional-looking results with clean boundaries.

**Independent Test**: Can be tested by opening multiple application windows, triggering window capture, selecting a window from the picker, and verifying the captured image contains only that window with proper boundary detection.

**Acceptance Scenarios**:

1. **Given** multiple application windows are open, **When** user triggers window capture mode, **Then** system displays overlay showing all capturable windows
2. **Given** window capture mode is active, **When** user hovers over a window, **Then** that window is highlighted with a colored border and window title is shown
3. **Given** user hovers over a window, **When** user clicks, **Then** that window is captured with auto-detected boundaries (excluding shadows and decorations)
4. **Given** window capture mode is active, **When** user presses ESC, **Then** capture is cancelled
5. **Given** user captures a window, **When** window has transparency or rounded corners, **Then** captured image preserves the window's visual style
6. **Given** window capture is triggered, **When** target window is minimized or hidden, **Then** system displays error message "Cannot capture hidden windows"

---

### Edge Cases

- **Multi-monitor with different DPI settings**: What happens when user has monitors with different scaling (100%, 150%, 200%)? System must detect and handle DPI correctly for each monitor.
- **Partial window visibility**: What happens when a window is partially off-screen or overlapped? Region capture should capture visible pixels only; window capture should attempt to bring window to front or warn user.
- **Permission denied (macOS)**: How does system handle screen recording permission denial? System must detect permission status and show clear instructions to enable in System Preferences.
- **No screens detected**: What happens on systems with no active display output? System should show error dialog and disable capture functionality until display is available.
- **Extremely large capture areas**: How does system handle captures exceeding 16384x16384 pixels (common GPU texture limit)? System should warn user and offer to downscale or split capture.
- **Rapid consecutive captures**: What happens when user triggers multiple captures in quick succession? System should queue captures or disable triggers until previous capture completes.
- **Capture during window animations**: How does system handle captures during window minimize/maximize animations? System should wait for animation completion or capture mid-animation state consistently.

## Requirements _(mandatory)_

<!--
  ACTION REQUIRED: The content in this section represents placeholders.
  Fill them out with the right functional requirements.
-->

### Functional Requirements

- **FR-001**: System MUST provide three capture modes accessible via global hotkeys: region capture, full screen capture, and window capture
- **FR-002**: Region capture MUST display crosshair cursor with pixel-perfect accuracy for selection
- **FR-003**: Region selection overlay MUST show real-time dimensions (width x height) during rectangle drawing
- **FR-004**: System MUST support multi-monitor setups with ability to capture from any connected display
- **FR-005**: Window capture MUST auto-detect window boundaries excluding system shadows and decorations
- **FR-006**: All capture modes MUST preserve native screen resolution including high-DPI displays (4K, 5K, Retina)
- **FR-007**: System MUST provide visual feedback for capture completion via flash effect AND system notification displaying thumbnail preview with file path
- **FR-008**: Users MUST be able to clear current selection by pressing ESC once (overlay remains) or exit capture mode entirely by pressing ESC twice when no selection exists
- **FR-009**: System MUST support keyboard-only operation (Enter to confirm, ESC to cancel, arrow keys to adjust selection)
- **FR-010**: Captured images MUST be automatically copied to clipboard AND saved to user-configured default location simultaneously
- **FR-011**: System MUST handle permission requests gracefully on macOS (screen recording permission)
- **FR-012**: Region capture MUST allow fine adjustment of selection rectangle by dragging edges and corners
- **FR-013**: Full screen capture MUST detect and respect the active monitor (where cursor is located)
- **FR-014**: Window capture MUST show preview highlight when hovering over capturable windows
- **FR-015**: System MUST support PNG format as default with lossless quality
- **FR-016**: System notification MUST allow users to click thumbnail to open saved file location
- **FR-017**: Saved screenshot files MUST be named using timestamp pattern: YYYY-MM-DD_HH-MM-SS.png (e.g., 2026-01-14_15-30-45.png)

### Quality Requirements (Constitution v1.0.0)

**Type Safety & Code Quality:**

- **QR-001**: All TypeScript code MUST pass `npm run typecheck` with zero errors
- **QR-002**: Type coverage MUST be ≥95% (document any necessary `any`/`unknown` usage)
- **QR-003**: Code MUST pass ESLint with zero violations (document any required disables)

**Testing Standards:**

- **QR-004**: Feature MUST include unit tests for utilities, stores, and services
- **QR-005**: Feature SHOULD include integration tests for IPC/database/file operations
- **QR-006**: Critical user workflows SHOULD include E2E tests

**User Experience:**

- **QR-007**: UI components MUST use shadcn/ui "new-york" variant
- **QR-008**: Feature MUST support both light and dark modes (CSS variables)
- **QR-009**: Loading states MUST be shown for operations >500ms
- **QR-010**: Error messages MUST be user-friendly (no stack traces in production)

**Performance:**

- **QR-011**: Feature MUST NOT increase startup time by >10%
- **QR-012**: Capture operations MUST complete in <200ms
- **QR-013**: Memory impact MUST stay within limits (idle <150MB, active <300MB)
- **QR-014**: Bundle size increase MUST be <10% or documented

### Key Entities _(include if feature involves data)_

- **CaptureMode**: Enumeration representing capture types (Region, FullScreen, Window) with associated hotkey bindings
- **CaptureRegion**: Represents a rectangular selection area with x, y, width, height coordinates and source monitor reference
- **CaptureWindow**: Represents a target window with handle/ID, title, bounds, and visibility state
- **Display**: Represents a physical monitor with ID, bounds, DPI scaling factor, and primary/secondary designation
- **CaptureResult**: Contains captured image data (buffer), dimensions, format, timestamp, and source information
- **CaptureSettings**: User preferences including default save location, file format, quality, hotkey mappings, post-capture behavior (default: copy to clipboard + save to folder), and auto-naming pattern (timestamp-based: YYYY-MM-DD_HH-MM-SS)

## Success Criteria _(mandatory)_

<!--
  ACTION REQUIRED: Define measurable success criteria.
  These must be technology-agnostic and measurable.
-->

### Measurable Outcomes

- **SC-001**: Users can complete a region capture from trigger to saved image in under 3 seconds
- **SC-002**: Selection rectangle rendering maintains 60fps during drawing and adjustment on mid-range hardware
- **SC-003**: Capture operations complete in under 200ms from trigger to image buffer ready
- **SC-004**: 95% of captures on first attempt succeed without errors or permission issues
- **SC-005**: Window boundary detection accuracy is >98% (correctly excludes shadows/decorations)
- **SC-006**: System supports monitors up to 5120x2880 (5K) resolution without downscaling
- **SC-007**: Memory usage during active capture stays under 300MB including overlay rendering
- **SC-008**: All three capture modes can be triggered and completed using keyboard only (no mouse required)
- **SC-009**: Users can successfully capture on multi-monitor setups with mixed DPI settings (100%, 150%, 200%)
- **SC-010**: Error recovery succeeds in 100% of cases where user grants permissions after initial denial

## Assumptions

- Users have granted necessary permissions (screen recording on macOS, window capture on Windows/Linux)
- Default file format is PNG for lossless quality (JPG/WebP support deferred to future enhancement)
- Screenshot files are automatically named using timestamp pattern YYYY-MM-DD_HH-MM-SS.png for chronological sorting
- Hotkeys are configurable but sensible defaults provided (e.g., Ctrl+Shift+1 for region, Ctrl+Shift+2 for full screen)
- Keyboard-only operation (SC-008) achieved via global hotkeys for capture initiation; menu-based keyboard navigation deferred to accessibility phase
- Capture overlay uses system-level window that can appear above all other applications
- Electron's native screen capture APIs (`desktopCapturer`) provide sufficient performance for real-time preview
- Window detection uses platform-specific APIs (Windows: Win32 API, macOS: CGWindowList, Linux: X11/Wayland)

## Dependencies

- Electron `desktopCapturer` API for screen/window enumeration and capture
- Native modules may be required for low-level window detection and boundary calculation
- System tray integration for quick access menu (Electron tray API)
- Global hotkey registration (Electron `globalShortcut` API)
- Canvas API or native image processing for overlay rendering and image manipulation

## Out of Scope (Future Enhancements)

- Scrolling capture (auto-scroll and stitch)
- Timed/delayed capture with countdown
- Annotation tools (arrows, text, shapes)
- Video recording capabilities
- OCR text extraction
- Cloud upload integration
- GIF creation
- Batch processing
- Capture history browser
