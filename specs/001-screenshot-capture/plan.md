# Implementation Plan: Screenshot Capture Modes

**Branch**: `001-screenshot-capture` | **Date**: 2026-01-14 | **Spec**: [spec.md](./spec.md)
**Input**: Feature specification from `/specs/001-screenshot-capture/spec.md`

**Note**: This template is filled in by the `/speckit.plan` command. See `.specify/templates/commands/plan.md` for the execution workflow.

## Summary

Implement three screenshot capture modes for FrameShot: Region Capture (P1), Full Screen Capture (P2), and Window Capture (P3). Region capture enables pixel-perfect area selection with crosshair cursor and real-time dimension display. Full screen capture supports multi-monitor setups with DPI awareness. Window capture auto-detects window boundaries excluding OS decorations. All captures simultaneously copy to clipboard and save to timestamped files. Technical approach: Electron desktopCapturer API for screen/window enumeration, native overlay window for selection UI, IPC communication for main↔renderer coordination, file system operations for auto-save.

## Technical Context

**Language/Version**: TypeScript 5.9.3 with Node.js ~20.x (Electron 39.2.6 compatible)
**Primary Dependencies**: Electron 39.2.6, React 19.2.1, Zustand 5.0.9 (state management), Tailwind CSS 4.1.18
**Storage**: File system (user-configured default save location), OS clipboard (via Electron clipboard API)
**Testing**: Vitest (unit tests for utilities/stores), React Testing Library (renderer components), Electron test environment for IPC
**Target Platform**: Desktop cross-platform (Windows, macOS, Linux) with Electron 39.2.6 runtime
**Project Type**: Electron desktop application (multi-process: main, renderer, preload)
**Performance Goals**: Capture completion <200ms, overlay rendering 60fps, startup impact <10% increase
**Constraints**: Memory idle <150MB / active <300MB, clipboard + file save simultaneous, native overlay above all windows
**Scale/Scope**: 3 capture modes, 17 functional requirements, system tray integration, global hotkey support

## Constitution Check

_GATE: Must pass before Phase 0 research. Re-check after Phase 1 design._

**Reference**: `.specify/memory/constitution.md` (v1.0.0)

### I. Type Safety & Code Quality ✓

- [x] All new TypeScript files pass `npm run typecheck` without errors
- [x] Type coverage ≥95% (minimal `any`/`unknown` usage)
- [x] ESLint compliant (no violations without documented rationale)
- [x] Prettier formatted (singleQuote, no semicolons, printWidth 100)
- [x] Path aliases used: `@renderer/*` for renderer, shadcn aliases for UI

**Initial Evaluation**: PASS - Feature uses existing TypeScript infrastructure. Capture logic (main process), overlay UI (renderer), and IPC contracts all strongly typed. Path aliases already configured in project.

**Post-Phase 1 Re-evaluation** (2026-01-14): ✓ CONFIRMED

- data-model.md: 100% TypeScript interfaces (CaptureMode, CaptureRegion, CaptureWindow, Display, CaptureResult, CaptureSettings)
- contracts/ipc-contracts.md: Full type definitions for all 6 IPC channels
- quickstart.md: Sample implementations use strict TypeScript, explicit return types
- Zero `any` usage in design artifacts
- Path aliases: `@renderer/*` and shadcn `@/` prefixes used throughout quickstart examples

### II. Testing Standards ✓

- [x] Unit tests planned for: utilities, stores, services
- [x] Integration tests planned for: IPC handlers, database ops, file operations
- [x] E2E tests planned for: critical user workflows (capture, save, share)
- [x] Test environment specified: main (Node.js) vs renderer (browser)
- [x] Contract tests included for any IPC or database schema changes

**Initial Evaluation**: PASS - Unit tests for capture utilities (region calculation, file naming, clipboard ops). Integration tests for IPC capture triggers and file save operations. E2E tests for each capture mode P1-P3. Clear separation: main process (Node), renderer (browser), IPC contracts validated.

**Post-Phase 1 Re-evaluation** (2026-01-14): ✓ CONFIRMED

- quickstart.md specifies test strategy in "Testing Checklist" section:
  - Unit: `capture.utils.ts` (region calculations), `file.service.ts` (filename generation)
  - Integration: `capture:execute` IPC end-to-end
  - E2E: Region capture (P1), Fullscreen (P2) user workflows
  - Performance: <200ms capture latency, <300MB active memory
- Test environments documented: Vitest (main process), React Testing Library (renderer)
- IPC contracts specify error cases and response validation (contracts/ipc-contracts.md)
- Implementation order (quickstart.md Phase 2-5) aligns with test-first principles

### III. User Experience Consistency ✓

- [x] UI components use shadcn/ui "new-york" variant
- [x] Color schemes use CSS variables (light/dark mode support)
- [x] Icons use unplugin-icons (Lucide React, 24x24px)
- [x] Keyboard shortcuts documented and non-conflicting
- [x] Loading states for operations >500ms
- [x] Error handling provides user-friendly messages
- [x] Hash routing used (Electron compatibility)

**Initial Evaluation**: PASS - Overlay UI uses shadcn/ui components, CSS variables for theming. System notification uses Lucide icons. Keyboard shortcuts (ESC, Enter, arrows) documented in FR-008, FR-009. Capture >500ms shows progress (not expected per SC-003 <200ms target). Error messages user-friendly per FR-011 (permission handling). No routing needed (capture is modal overlay, not page navigation).

**Post-Phase 1 Re-evaluation** (2026-01-14): ✓ CONFIRMED

- quickstart.md CaptureOverlay component uses Tailwind CSS classes (`fixed inset-0 bg-black/50 cursor-crosshair`)
- Notification design (quickstart.md CaptureService.showNotification) uses system notifications with thumbnail icon
- ESC key handling documented in quickstart Step 8 (addEventListener pattern)
- Error messages user-friendly: "Failed to capture image", "No display found" (contracts/ipc-contracts.md)
- Hash routing N/A for this feature (overlay modal, not route-based)
- Loading states: Captures target <200ms, no loading UI needed per performance requirement

### IV. Performance Requirements ✓

- [x] Feature does not increase startup time >10%
- [x] Capture operations complete in <200ms
- [x] Memory impact estimated and within idle <150MB, active <300MB
- [x] No unnecessary polling/timers (CPU idle target <2%)
- [x] Bundle size impact documented (no >10% increase without justification)

**Initial Evaluation**: PASS - Minimal startup impact (only registers global hotkeys). Capture operations target <200ms (FR-012, SC-003). Memory budget: overlay rendering + image buffer <300MB active (SC-007). Event-driven architecture (no polling). Bundle impact: overlay component + capture utilities estimated <2MB (native Electron APIs, minimal dependencies).

**Post-Phase 1 Re-evaluation** (2026-01-14): ✓ CONFIRMED

- Startup impact: Global hotkey registration only (research.md Decision 5), <10ms overhead
- Capture latency breakdown (research.md Decision 1):
  - desktopCapturer.getSources: ~50-100ms
  - Image processing (crop/scale): ~20-50ms
  - File save + clipboard (parallel): ~50-100ms
  - **Total: <200ms target achievable**
- Memory estimate:
  - 4K thumbnail buffer: ~32MB (3840x2160x4 bytes)
  - Overlay React components: ~5MB
  - Service instances: ~2MB
  - **Total: ~40MB active (well under 300MB limit)**
- Event-driven: Zero polling (IPC invoke/handle pattern, keyboard event listeners)
- Bundle size: Native Electron APIs (desktopCapturer, clipboard, Notification), date-fns (~5KB), zero additional image processing libraries
- **No violations, no justifications needed**

**Violations Requiring Justification**: None - All constitution gates passed.

## Project Structure

### Documentation (this feature)

```text
specs/[###-feature]/
├── plan.md              # This file (/speckit.plan command output)
├── research.md          # Phase 0 output (/speckit.plan command)
├── data-model.md        # Phase 1 output (/speckit.plan command)
├── quickstart.md        # Phase 1 output (/speckit.plan command)
├── contracts/           # Phase 1 output (/speckit.plan command)
└── tasks.md             # Phase 2 output (/speckit.tasks command - NOT created by /speckit.plan)
```

### Source Code (repository root)

```text
src/
├── main/                          # Electron main process (Node.js)
│   ├── handlers/
│   │   ├── index.ts              # IPC handler registration
│   │   └── capture.handlers.ts   # NEW: Capture mode IPC handlers
│   ├── services/
│   │   ├── capture.service.ts    # NEW: Core capture orchestration
│   │   ├── screen.service.ts     # NEW: desktopCapturer wrapper
│   │   ├── window.service.ts     # NEW: Window detection & boundary calc
│   │   └── file.service.ts       # NEW: File save with timestamp naming
│   ├── utils/
│   │   ├── file.utils.ts         # Existing file utilities
│   │   ├── capture.utils.ts      # NEW: Capture region calculations
│   │   └── clipboard.utils.ts    # NEW: Clipboard operations
│   └── types/
│       └── capture.types.ts      # NEW: Capture entities (CaptureMode, CaptureRegion, etc.)
│
├── renderer/
│   └── src/
│       ├── features/
│       │   └── capture/           # NEW: Capture feature module
│       │       ├── components/
│       │       │   ├── CaptureOverlay.tsx        # NEW: Main overlay container
│       │       │   ├── RegionSelector.tsx        # NEW: Rectangle selection UI
│       │       │   ├── WindowHighlight.tsx       # NEW: Window picker highlight
│       │       │   └── DimensionDisplay.tsx      # NEW: Real-time dimensions
│       │       ├── hooks/
│       │       │   ├── useCaptureMode.ts         # NEW: Capture mode state
│       │       │   └── useRegionSelection.ts     # NEW: Region drawing logic
│       │       └── stores/
│       │           └── captureStore.ts           # NEW: Zustand capture state
│       │
│       └── shared/
│           └── components/
│               └── ui/            # Existing shadcn/ui components
│
└── preload/
    ├── index.ts                   # Existing preload bridge
    └── capture.preload.ts         # NEW: Capture IPC exposure

tests/
├── unit/
│   ├── main/
│   │   ├── capture.utils.test.ts # NEW: Region calculation tests
│   │   └── file.service.test.ts  # NEW: File naming tests
│   └── renderer/
│       └── useCaptureMode.test.ts # NEW: Hook logic tests
│
├── integration/
│   ├── capture-ipc.test.ts       # NEW: IPC contract tests
│   └── file-save.test.ts         # NEW: File system integration tests
│
└── e2e/
    ├── region-capture.spec.ts    # NEW: User Story 1 E2E
    ├── fullscreen-capture.spec.ts # NEW: User Story 2 E2E
    └── window-capture.spec.ts    # NEW: User Story 3 E2E
```

**Structure Decision**: Electron desktop application structure with main/renderer/preload separation. Capture feature organized as renderer feature module with Zustand store for state management. Main process services handle native OS APIs (desktopCapturer, clipboard, file system). IPC handlers bridge renderer capture triggers to main process execution. Test structure mirrors source with unit/integration/E2E separation aligned with constitution testing standards.

## Complexity Tracking

> **Fill ONLY if Constitution Check has violations that must be justified**

**Status**: No violations - All constitution gates passed. No complexity justification required.
| -------------------------- | ------------------ | ------------------------------------ |
| [e.g., 4th project] | [current need] | [why 3 projects insufficient] |
| [e.g., Repository pattern] | [specific problem] | [why direct DB access insufficient] |
