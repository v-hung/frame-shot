<!--
Sync Impact Report - Constitution Update
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Version Change: TEMPLATE → 1.0.0 (MAJOR - Initial adoption)
Date: 2026-01-14

Modified Principles:
  ✓ Created I. Type Safety & Code Quality
  ✓ Created II. Testing Standards
  ✓ Created III. User Experience Consistency
  ✓ Created IV. Performance Requirements

Added Sections:
  ✓ Development Workflow Gates
  ✓ Quality Metrics

Template Consistency Updates:
  ✅ .specify/templates/plan-template.md - Updated Constitution Check section
  ✅ .specify/templates/spec-template.md - Aligned requirements structure
  ✅ .specify/templates/tasks-template.md - Updated phase organization
  ✅ .github/copilot-instructions.md - Referenced in governance

Follow-up Actions:
  None - All principles fully defined and integrated

Rationale:
  Initial constitution adoption for FrameShot project. Establishes foundational
  principles for code quality, testing, UX consistency, and performance based on
  the Electron/React/TypeScript technology stack. Sets measurable standards for
  type safety (95%+ coverage), test requirements (unit, integration, E2E), UX
  consistency (design system compliance), and performance targets (startup <3s,
  capture <200ms, memory <150MB idle).
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
-->

# FrameShot Constitution

## Core Principles

### I. Type Safety & Code Quality

**MUST Requirements:**

- All TypeScript code MUST pass `npm run typecheck` with zero errors before merging
- Type coverage MUST be ≥95% (no excessive `any`, `unknown` usage without justification)
- ESLint violations MUST be resolved (no `eslint-disable` without documented rationale)
- Code formatting MUST conform to Prettier configuration (singleQuote, no semicolons, printWidth 100)
- Empty functions MUST contain minimal implementation or clear TODO comments

**Path Aliases:**

- Renderer imports MUST use `@renderer/*` alias (not relative paths outside component directories)
- shadcn/ui components MUST use configured aliases: `@/components`, `@/utils`, `@/ui`, `@/lib`, `@/hooks`

**Rationale:** TypeScript's static analysis prevents runtime errors in Electron's multi-process
architecture. Strict type checking ensures IPC contracts between main/renderer processes are
validated at compile time. Consistent formatting reduces cognitive load during code reviews.

### II. Testing Standards

**Test Requirements by Layer:**

- **Unit Tests (MUST)**: All utility functions, stores (Zustand), and isolated services
- **Integration Tests (SHOULD)**: IPC handlers, database operations (Drizzle ORM), file operations
- **E2E Tests (SHOULD for critical paths)**: Screen capture workflows, annotation tools, save/share features

**Electron-Specific Testing:**

- Main process: Node.js test environment (Jest/Vitest with `@electron/remote` mocks)
- Renderer process: Browser environment (React Testing Library + Vitest)
- Preload bridge: Test both Node and Web contexts (IPC contract validation)

**Test Execution Gates:**

- New features MUST include tests before implementation (Test-Driven Development encouraged)
- Breaking changes in IPC contracts MUST include contract tests
- Database schema changes MUST include migration tests

**Rationale:** Electron's multi-process architecture creates complex failure modes. Tests prevent
regressions in IPC communication, window lifecycle management, and native OS integrations. TDD
ensures testable design and prevents technical debt accumulation.

### III. User Experience Consistency

**Design System Compliance:**

- UI components MUST use shadcn/ui "new-york" variant from `src/renderer/src/shared/components/ui/`
- Color schemes MUST use CSS variables defined in `index.css` (light/dark mode support)
- Icons MUST use unplugin-icons (Lucide React collection, 24x24px default size)
- Spacing MUST follow Tailwind CSS v4 spacing scale

**Accessibility Requirements:**

- Keyboard shortcuts MUST be documented and non-conflicting
- Screen capture modes MUST provide clear visual feedback (crosshair, dimensions, countdown)
- Error messages MUST be user-friendly (no raw stack traces in production)
- Loading states MUST show progress indicators for operations >500ms

**Routing & Navigation:**

- MUST use hash routing (`createHashRouter`) for Electron compatibility
- Navigation MUST preserve window state (position, size) across routes
- ErrorBoundary MUST handle renderer crashes gracefully

**Rationale:** Consistent UX reduces user training time and prevents confusion. Electron apps
competing with native tools (Snagit) require polished interactions. Accessibility ensures broad
usability across user capabilities. Hash routing prevents `file://` protocol issues.

### IV. Performance Requirements

**Startup Performance:**

- Cold start (first launch) MUST complete in <3 seconds
- Warm start (subsequent launches) MUST complete in <1.5 seconds
- Window creation (main → visible) MUST occur in <500ms

**Capture Performance:**

- Screenshot capture MUST trigger in <200ms from hotkey press
- Region selection overlay MUST render at 60fps (smooth crosshair tracking)
- Scrolling capture MUST stitch images in <100ms per screen

**Resource Constraints:**

- Idle memory usage MUST stay <150MB (main + renderer processes combined)
- Active capture memory MUST stay <300MB (including image buffers)
- CPU usage during idle MUST be <2% (no unnecessary polling/timers)

**Build Performance:**

- Development mode (`npm run dev`) MUST start in <10 seconds
- Production build (`npm run build:win`) MUST complete in <60 seconds
- Type checking (`npm run typecheck`) MUST complete in <30 seconds

**Rationale:** Screen capture tools are utility apps that must stay out of the user's way. Slow
startup or capture lag breaks the user's flow state. Memory constraints prevent background
resource hogging. Fast builds maintain developer productivity during rapid iteration.

## Development Workflow Gates

**Pre-Commit Checklist (Manual - No Pre-Commit Hooks):**

1. Format: `npm run format` (Prettier)
2. Lint: `npm run lint` (ESLint with cache)
3. Type Check: `npm run typecheck` (both node + web)
4. Test Dev Mode: `npm run dev` (verify app starts)

**Pre-Build Checklist:**

1. All pre-commit checks passed
2. Production build test: `npm run build:unpack` (faster than full build)
3. Manual smoke test of packaged app

**Pre-Merge Requirements:**

- All CI/CD gates passed (currently manual - no GitHub Actions)
- Constitution compliance verified (reference this document)
- Code review approved by at least one maintainer
- Feature documented in relevant spec files (`.specify/specs/`)

## Quality Metrics

**Code Coverage Targets:**

- Type coverage: ≥95% (measured by TypeScript compiler)
- Test coverage: ≥80% for critical paths (capture, save, share)
- Lint rule compliance: 100% (zero warnings in `npm run lint`)

**Performance Monitoring:**

- Track startup time in build artifacts (compare across versions)
- Monitor bundle size: `dist/` output should not increase >10% without justification
- Track memory usage: Profile with Chrome DevTools during development

**Dependency Health:**

- Security audits: `npm audit` MUST show zero high/critical vulnerabilities
- Outdated dependencies: Review quarterly (avoid breaking changes mid-sprint)
- Electron version: Stay within 2 major versions of latest stable

## Governance

**Constitution Authority:**

- This constitution supersedes all other development practices and style guides
- All feature specifications in `.specify/specs/` MUST comply with these principles
- Complexity violations MUST be documented in `plan.md` Complexity Tracking section

**Amendment Process:**

1. Propose changes via pull request with rationale
2. Discuss impact on existing codebase and templates
3. Update affected templates: `plan-template.md`, `spec-template.md`, `tasks-template.md`
4. Update `.github/copilot-instructions.md` if agent guidance changes
5. Increment version number according to semantic versioning
6. Document migration plan for breaking changes

**Version Semantics:**

- **MAJOR**: Principle removal/redefinition, breaking workflow changes
- **MINOR**: New principle added, expanded requirements
- **PATCH**: Clarifications, typo fixes, non-semantic improvements

**Compliance Verification:**

- All pull requests MUST reference this constitution in review checklist
- Feature plans MUST include "Constitution Check" section (see `plan-template.md`)
- Spec files MUST align requirements with principles (see `spec-template.md`)

**Runtime Guidance:**

- Development agent guidance stored in `.github/copilot-instructions.md`
- Agent-specific execution workflows in `.specify/templates/commands/*.md`
- This constitution defines WHAT to build; agent guidance defines HOW to assist

**Version**: 1.0.0 | **Ratified**: 2026-01-14 | **Last Amended**: 2026-01-14
