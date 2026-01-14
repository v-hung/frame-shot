# Implementation Plan: [FEATURE]

**Branch**: `[###-feature-name]` | **Date**: [DATE] | **Spec**: [link]
**Input**: Feature specification from `/specs/[###-feature-name]/spec.md`

**Note**: This template is filled in by the `/speckit.plan` command. See `.specify/templates/commands/plan.md` for the execution workflow.

## Summary

[Extract from feature spec: primary requirement + technical approach from research]

## Technical Context

<!--
  ACTION REQUIRED: Replace the content in this section with the technical details
  for the project. The structure here is presented in advisory capacity to guide
  the iteration process.
-->

**Language/Version**: [e.g., Python 3.11, Swift 5.9, Rust 1.75 or NEEDS CLARIFICATION]
**Primary Dependencies**: [e.g., FastAPI, UIKit, LLVM or NEEDS CLARIFICATION]
**Storage**: [if applicable, e.g., PostgreSQL, CoreData, files or N/A]
**Testing**: [e.g., pytest, XCTest, cargo test or NEEDS CLARIFICATION]
**Target Platform**: [e.g., Linux server, iOS 15+, WASM or NEEDS CLARIFICATION]
**Project Type**: [single/web/mobile - determines source structure]
**Performance Goals**: [domain-specific, e.g., 1000 req/s, 10k lines/sec, 60 fps or NEEDS CLARIFICATION]
**Constraints**: [domain-specific, e.g., <200ms p95, <100MB memory, offline-capable or NEEDS CLARIFICATION]
**Scale/Scope**: [domain-specific, e.g., 10k users, 1M LOC, 50 screens or NEEDS CLARIFICATION]

## Constitution Check

_GATE: Must pass before Phase 0 research. Re-check after Phase 1 design._

**Reference**: `.specify/memory/constitution.md` (v1.0.0)

### I. Type Safety & Code Quality ✓/✗

- [ ] All new TypeScript files pass `npm run typecheck` without errors
- [ ] Type coverage ≥95% (minimal `any`/`unknown` usage)
- [ ] ESLint compliant (no violations without documented rationale)
- [ ] Prettier formatted (singleQuote, no semicolons, printWidth 100)
- [ ] Path aliases used: `@renderer/*` for renderer, shadcn aliases for UI

### II. Testing Standards ✓/✗

- [ ] Unit tests planned for: utilities, stores, services
- [ ] Integration tests planned for: IPC handlers, database ops, file operations
- [ ] E2E tests planned for: critical user workflows (capture, save, share)
- [ ] Test environment specified: main (Node.js) vs renderer (browser)
- [ ] Contract tests included for any IPC or database schema changes

### III. User Experience Consistency ✓/✗

- [ ] UI components use shadcn/ui "new-york" variant
- [ ] Color schemes use CSS variables (light/dark mode support)
- [ ] Icons use unplugin-icons (Lucide React, 24x24px)
- [ ] Keyboard shortcuts documented and non-conflicting
- [ ] Loading states for operations >500ms
- [ ] Error handling provides user-friendly messages
- [ ] Hash routing used (Electron compatibility)

### IV. Performance Requirements ✓/✗

- [ ] Feature does not increase startup time >10%
- [ ] Capture operations complete in <200ms
- [ ] Memory impact estimated and within idle <150MB, active <300MB
- [ ] No unnecessary polling/timers (CPU idle target <2%)
- [ ] Bundle size impact documented (no >10% increase without justification)

**Violations Requiring Justification**: [List any ✗ items and document in Complexity Tracking]

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

<!--
  ACTION REQUIRED: Replace the placeholder tree below with the concrete layout
  for this feature. Delete unused options and expand the chosen structure with
  real paths (e.g., apps/admin, packages/something). The delivered plan must
  not include Option labels.
-->

```text
# [REMOVE IF UNUSED] Option 1: Single project (DEFAULT)
src/
├── models/
├── services/
├── cli/
└── lib/

tests/
├── contract/
├── integration/
└── unit/

# [REMOVE IF UNUSED] Option 2: Web application (when "frontend" + "backend" detected)
backend/
├── src/
│   ├── models/
│   ├── services/
│   └── api/
└── tests/

frontend/
├── src/
│   ├── components/
│   ├── pages/
│   └── services/
└── tests/

# [REMOVE IF UNUSED] Option 3: Mobile + API (when "iOS/Android" detected)
api/
└── [same as backend above]

ios/ or android/
└── [platform-specific structure: feature modules, UI flows, platform tests]
```

**Structure Decision**: [Document the selected structure and reference the real
directories captured above]

## Complexity Tracking

> **Fill ONLY if Constitution Check has violations that must be justified**

| Violation                  | Why Needed         | Simpler Alternative Rejected Because |
| -------------------------- | ------------------ | ------------------------------------ |
| [e.g., 4th project]        | [current need]     | [why 3 projects insufficient]        |
| [e.g., Repository pattern] | [specific problem] | [why direct DB access insufficient]  |
