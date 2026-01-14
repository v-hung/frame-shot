# Tasks: Screenshot Capture Modes

**Feature**: 001-screenshot-capture
**Input**: Design documents from `/specs/001-screenshot-capture/`
**Prerequisites**: plan.md, spec.md, research.md, data-model.md, contracts/, quickstart.md
**Constitution**: `.specify/memory/constitution.md` v1.0.0

**Organization**: Tasks are grouped by user story (P1 → P2 → P3) to enable independent implementation and testing.

**Tests**: Constitution requires unit/integration/E2E tests for critical paths. Tests are included per user story.

## Format: `[ID] [P?] [Story?] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (e.g., US1, US2, US3)
- Include exact file paths in descriptions

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Project initialization and type definitions

- [ ] T001 Create feature branch `001-screenshot-capture` from main
- [ ] T002 [P] Create type definitions in src/main/types/capture.types.ts
- [ ] T003 [P] Add date-fns dependency to package.json for timestamp generation
- [ ] T004 Verify `npm run typecheck` passes with zero errors

**Validation**: Run `npm run typecheck` - must pass before proceeding to Phase 2

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Core services and IPC infrastructure that ALL user stories depend on

**⚠️ CRITICAL**: No user story work can begin until this phase is complete

- [ ] T005 [P] Implement ScreenService in src/main/services/screen.service.ts
- [ ] T006 [P] Implement FileService in src/main/services/file.service.ts
- [ ] T007 Implement CaptureService core logic in src/main/services/capture.service.ts
- [ ] T008 [P] Create capture IPC handlers in src/main/handlers/capture.handlers.ts
- [ ] T009 [P] Register capture handlers in src/main/handlers/index.ts
- [ ] T010 [P] Expose capture API in src/preload/index.ts with contextBridge
- [ ] T011 [P] Add capture API type definitions to src/preload/index.d.ts
- [ ] T012 Create Zustand capture store in src/renderer/src/stores/captureStore.ts
- [ ] T013 [P] Implement capture utilities in src/main/utils/capture.utils.ts
- [ ] T014 Register global hotkeys in src/main/index.ts (Ctrl+Shift+1/2/3)

**Checkpoint**: Foundation ready - user story implementation can now begin in parallel

---

## Phase 3: User Story 1 - Region Capture with Selection Tool (Priority: P1) 🎯 MVP

**Goal**: Enable users to select and capture a specific rectangular area of their screen with real-time dimension display

**Independent Test**: Trigger region capture via Ctrl+Shift+1, draw selection rectangle, verify captured image matches selected region and is saved to Pictures/FrameShot/

### Tests for User Story 1

> **NOTE: Write these tests FIRST, ensure they FAIL before implementation**

- [ ] T015 [P] [US1] Unit test for region coordinate scaling logic in tests/unit/capture.utils.test.ts
- [ ] T016 [P] [US1] Unit test for filename generation in tests/unit/file.service.test.ts
- [ ] T017 [P] [US1] Integration test for capture:execute IPC with region mode in tests/integration/capture.ipc.test.ts
- [ ] T018 [US1] E2E test for complete region capture workflow in tests/e2e/region-capture.test.ts

### Implementation for User Story 1

- [ ] T019 [P] [US1] Create CaptureOverlay component in src/renderer/src/features/capture/components/CaptureOverlay.tsx
- [ ] T020 [P] [US1] Create RegionSelector component with rectangle drawing in src/renderer/src/features/capture/components/RegionSelector.tsx
- [ ] T021 [US1] Implement real-time dimension display in src/renderer/src/features/capture/components/DimensionDisplay.tsx
- [ ] T022 [US1] Add crosshair cursor styling to src/renderer/src/features/capture/components/CaptureOverlay.css
- [ ] T023 [US1] Implement ESC key handling (clear selection/exit mode) in CaptureOverlay
- [ ] T024 [US1] Implement Enter key handling (confirm capture) in RegionSelector
- [ ] T024.5 [US1] Implement arrow key nudging for selection adjustment (1px default, 10px with Shift modifier)
- [ ] T025 [US1] Add region capture to CaptureService.execute() for mode='region'
- [ ] T026 [US1] Implement simultaneous clipboard + file save with Promise.all in CaptureService
- [ ] T027 [US1] Add flash effect animation in src/renderer/src/features/capture/components/FlashEffect.tsx
- [ ] T028 [US1] Implement system notification with thumbnail in CaptureService
- [ ] T029 [US1] Add click-to-open file location in notification handler
- [ ] T030 [US1] Implement selection rectangle edge/corner dragging for fine adjustment

**Story Validation**: Can trigger Ctrl+Shift+1 → draw rectangle → release mouse → verify image saved + copied + notification shown

---

## Phase 4: User Story 2 - Full Screen Capture (Priority: P2)

**Goal**: Enable users to capture entire screen or specific monitor in multi-monitor setups with a single action

**Independent Test**: Trigger Ctrl+Shift+2, verify entire active monitor captured within 200ms, file saved with correct dimensions

### Tests for User Story 2

- [ ] T031 [P] [US2] Unit test for cursor display detection in tests/unit/screen.service.test.ts
- [ ] T032 [US2] Integration test for capture:list-displays IPC in tests/integration/display-enumeration.test.ts
- [ ] T033 [US2] E2E test for fullscreen capture on primary monitor in tests/e2e/fullscreen-capture.test.ts
- [ ] T034 [US2] E2E test for multi-monitor capture selection in tests/e2e/multi-monitor.test.ts

### Implementation for User Story 2

- [ ] T035 [P] [US2] Implement capture:get-cursor-position IPC handler in src/main/handlers/capture.handlers.ts
- [ ] T036 [P] [US2] Add cursor display detection to ScreenService.getCursorDisplay()
- [ ] T037 [US2] Implement fullscreen capture mode in CaptureService.execute() for mode='fullscreen'
- [ ] T038 [US2] Add high-DPI awareness (4K/5K support) to ScreenService.captureScreen()
- [ ] T039 [US2] Create monitor selection menu component in src/renderer/src/features/capture/components/MonitorPicker.tsx
- [ ] T040 [US2] Add monitor selection to Zustand store (selectedDisplayId)
- [ ] T041 [US2] Wire Ctrl+Shift+2 hotkey to fullscreen capture trigger

**Story Validation**: Trigger Ctrl+Shift+2 → verify current monitor captured → test with 2+ monitors → verify correct monitor selection

---

## Phase 5: User Story 3 - Window Capture with Picker (Priority: P3)

**Goal**: Enable users to capture a specific application window with auto-detected boundaries (no shadows/decorations)

**Independent Test**: Open multiple windows, trigger Ctrl+Shift+3, hover to highlight, click to capture, verify only target window captured

### Tests for User Story 3

- [ ] T042 [P] [US3] Unit test for window boundary detection in tests/unit/window.service.test.ts
- [ ] T043 [US3] Integration test for capture:list-windows IPC in tests/integration/window-enumeration.test.ts
- [ ] T044 [US3] E2E test for window capture with multiple open windows in tests/e2e/window-capture.test.ts
- [ ] T045 [US3] E2E test for window transparency/rounded corners preservation in tests/e2e/window-styling.test.ts

### Implementation for User Story 3

- [ ] T046 [P] [US3] Create WindowService in src/main/services/window.service.ts
- [ ] T047 [P] [US3] Implement window enumeration using desktopCapturer type='window'
- [ ] T048 [US3] Implement window boundary detection (exclude shadows) in WindowService
- [ ] T049 [US3] Implement capture:list-windows IPC handler
- [ ] T050 [US3] Add window capture mode to CaptureService.execute() for mode='window'
- [ ] T051 [P] [US3] Create WindowPicker component in src/renderer/src/features/capture/components/WindowPicker.tsx
- [ ] T052 [US3] Implement hover highlight overlay for window preview
- [ ] T053 [US3] Add window title display on hover
- [ ] T054 [US3] Implement click-to-capture window selection
- [ ] T055 [US3] Add error handling for minimized/hidden windows
- [ ] T056 [US3] Wire Ctrl+Shift+3 hotkey to window capture trigger

**Story Validation**: Trigger Ctrl+Shift+3 → hover over window → verify highlight → click → verify window-only capture with clean boundaries

---

## Phase 6: Polish & Cross-Cutting Concerns

**Purpose**: Quality validation, performance optimization, and constitution compliance

### Constitution Validation

- [ ] T057 Run `npm run typecheck` and verify zero errors (QR-001)
- [ ] T058 Run `npm run lint` and verify zero violations (QR-003)
- [ ] T059 Run `npm run format` to ensure consistent code style
- [ ] T060 Verify type coverage ≥95% with no undocumented `any` usage (QR-002)

### Performance & Quality

- [ ] T061 Performance test: Verify capture operations complete <200ms (QR-012, SC-003)
- [ ] T062 Performance test: Verify selection rectangle renders at 60fps (SC-002)
- [ ] T063 Memory test: Verify active capture stays <300MB (QR-013, SC-007)
- [ ] T064 Startup test: Verify feature adds <10% to app startup time (QR-011)
- [ ] T065 Test multi-monitor with mixed DPI (100%/150%/200%) (SC-009)
- [ ] T066 Test macOS screen recording permission flow (FR-011, SC-010)

### Error Handling & Edge Cases

- [ ] T067 [P] Implement permission denied error handling in CaptureService
- [ ] T068 [P] Add file save collision handling (filename_N.png suffix) in FileService
- [ ] T069 [P] Handle capture timeout (>500ms) with error message
- [ ] T070 [P] Add validation for extremely large capture areas (>16384x16384)
- [ ] T071 Handle rapid consecutive capture attempts (queue or disable)
- [ ] T072 Test partial window visibility and off-screen windows

### Documentation & Cleanup

- [ ] T073 [P] Add capture feature documentation to README.md
- [ ] T074 [P] Document hotkey configuration in user guide
- [ ] T075 [P] Add JSDoc comments to all public service methods
- [ ] T076 Update .github/copilot-instructions.md with capture patterns learned
- [ ] T077 Run final constitution compliance check against .specify/memory/constitution.md
- [ ] T078 Generate feature summary report with metrics (tasks completed, test coverage, performance)

---

## Implementation Strategy

**MVP First**: Phase 3 (User Story 1 - Region Capture) provides complete standalone value

**Incremental Delivery**:

1. **Milestone 1**: Region Capture (P1) - Can ship independently as MVP
2. **Milestone 2**: + Full Screen (P2) - Adds quick capture convenience
3. **Milestone 3**: + Window Capture (P3) - Feature complete

**Parallel Opportunities**: Tasks marked [P] can be worked simultaneously by different developers

---

## Dependencies & Execution Order

### Story Dependencies

- **US1 (Region Capture)**: Independent - depends only on Foundation (Phase 2)
- **US2 (Full Screen)**: Independent - depends only on Foundation (Phase 2)
- **US3 (Window Capture)**: Independent - depends only on Foundation (Phase 2)

**Critical Path**: Phase 1 Setup → Phase 2 Foundation → Phase 3/4/5 (can run in parallel) → Phase 6 Polish

### Dependency Graph

```
Phase 1 (Setup)
    ↓
Phase 2 (Foundation)
    ├─→ Phase 3 (US1 - Region) ────┐
    ├─→ Phase 4 (US2 - Fullscreen) ┼→ Phase 6 (Polish)
    └─→ Phase 5 (US3 - Window) ────┘
```

### Parallel Execution Examples

**After Foundation Complete**:

- Developer A: Works on US1 (Region Capture)
- Developer B: Works on US2 (Full Screen)
- Developer C: Works on US3 (Window Capture)

**Within User Story 1**:

- T019 (CaptureOverlay) + T020 (RegionSelector) + T021 (DimensionDisplay) can be built simultaneously
- T015-T018 (all tests) can be written in parallel before implementation

---

## Task Summary

**Total Tasks**: 78

**Breakdown by Phase**:

- Phase 1 (Setup): 4 tasks
- Phase 2 (Foundation): 10 tasks
- Phase 3 (US1 - Region): 16 tasks (4 tests + 12 implementation)
- Phase 4 (US2 - Fullscreen): 11 tasks (4 tests + 7 implementation)
- Phase 5 (US3 - Window): 11 tasks (4 tests + 7 implementation)
- Phase 6 (Polish): 22 tasks (validation + testing + docs)

**Test Tasks**: 12 (15% of total)

**Parallel Opportunities**: 35 tasks marked [P] (45%)

**Independent Stories**: All 3 user stories can be developed/tested/shipped independently after Foundation

---

## Validation Checklist

Before marking feature complete:

- [ ] All 78 tasks completed
- [ ] `npm run typecheck` passes (zero errors)
- [ ] `npm run lint` passes (zero violations)
- [ ] All unit tests pass (utilities, stores, services)
- [ ] All integration tests pass (IPC contracts)
- [ ] All E2E tests pass (region, fullscreen, window captures)
- [ ] Performance: Captures <200ms, overlay 60fps, memory <300MB
- [ ] Constitution compliance: All 4 principles verified
- [ ] Documentation complete (README, JSDoc, user guide)
- [ ] Each user story independently testable and shippable

---

## Quick Reference: File Paths

**Main Process**:

- Types: `src/main/types/capture.types.ts`
- Services: `src/main/services/{capture,screen,window,file}.service.ts`
- Handlers: `src/main/handlers/capture.handlers.ts`
- Utils: `src/main/utils/capture.utils.ts`

**Renderer Process**:

- Store: `src/renderer/src/stores/captureStore.ts`
- Components: `src/renderer/src/features/capture/components/{CaptureOverlay,RegionSelector,WindowPicker,MonitorPicker,DimensionDisplay,FlashEffect}.tsx`
- Styles: `src/renderer/src/features/capture/components/CaptureOverlay.css`

**Preload**:

- Bridge: `src/preload/index.ts` (exposeInMainWorld)
- Types: `src/preload/index.d.ts`

**Tests**:

- Unit: `tests/unit/{capture.utils,screen.service,file.service,window.service}.test.ts`
- Integration: `tests/integration/{capture.ipc,display-enumeration,window-enumeration}.test.ts`
- E2E: `tests/e2e/{region-capture,fullscreen-capture,window-capture,multi-monitor,window-styling}.test.ts`

---

**Generated**: 2026-01-14
**Command**: `/speckit.tasks`
**Next Step**: Begin implementation with Phase 1 (Setup), then Phase 2 (Foundation), then choose any user story to implement first (recommend P1 for MVP)
