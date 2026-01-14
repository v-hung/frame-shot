# Copilot Instructions for FrameShot

## Project Overview

**FrameShot** is a lightweight screen capture tool built with Electron, React, and TypeScript. It helps users quickly take screenshots, annotate images, and share them with ease.

**Tech Stack:**

- **Runtime:** Electron v39.2.6 (Node.js-based desktop application)
- **Frontend:** React 19.2.1 with TypeScript 5.9.3
- **Build Tool:** electron-vite v5.0.0 (Vite 7.2.6)
- **Styling:** Tailwind CSS v4.1.18 with shadcn/ui components
- **Database:** Drizzle ORM with SQLite/MySQL2
- **Routing:** React Router v7.10.1 (hash routing)
- **State Management:** Zustand v5.0.9
- **Icons:** unplugin-icons with Lucide React

**Project Size:** Small to medium (~50 source files)

## Critical Build & Validation Steps

### ⚠️ ALWAYS Run Commands in This Order

1. **Install Dependencies (REQUIRED FIRST):**

   ```bash
   npm install
   ```

   Run `npm install` BEFORE any other command. The `postinstall` script runs `electron-builder install-app-deps` automatically.

2. **Type Checking (Run Before Building):**

   ```bash
   npm run typecheck
   ```

   - Checks both Node.js and web TypeScript code
   - Runs: `typecheck:node` → `typecheck:web`
   - **Known Issues:** May fail if page components referenced in router.tsx don't exist yet. Create placeholder components or comment out routes temporarily.
   - Exit code 1 means type errors exist - DO NOT proceed to build until fixed

3. **Linting:**

   ```bash
   npm run lint
   ```

   - Uses ESLint with electron-toolkit config
   - Cache stored in `.eslintcache`
   - **Known Issue:** Empty functions trigger `@typescript-eslint/no-empty-function` error
   - **Workaround:** Add `// eslint-disable-next-line` comment or add minimal implementation

4. **Formatting:**
   ```bash
   npm run format
   ```

   - Runs Prettier across all files
   - Config: `.prettierrc.yaml` (singleQuote, no semicolons, printWidth 100)
   - Always run before committing

### Development Workflow

```bash
npm run dev
```

- Starts Electron in development mode with hot reload
- Opens DevTools automatically (check `src/main/index.ts` line 37)
- Watches for changes in main, preload, and renderer processes
- Uses `electron-vite dev --watch`

### Production Build

```bash
# Windows
npm run build:win

# macOS
npm run build:mac

# Linux
npm run build:linux
```

**Build Process:**

1. Runs `npm run typecheck` automatically
2. Runs `electron-vite build` to compile all processes
3. Runs `electron-builder` with platform-specific config
4. Output: `out/` directory (gitignored)

**Build Time:** ~30-60 seconds depending on system

### Preview (Test Production Build Locally)

```bash
npm run start
```

- Previews built app without packaging
- Useful for testing production behavior

## Project Architecture

### Directory Structure

```
src/
├── main/              # Electron main process (Node.js)
│   ├── index.ts      # Main entry point, window creation
│   ├── constants/    # App constants
│   ├── database/     # Drizzle ORM setup and schemas
│   │   ├── index.ts
│   │   └── schema/
│   ├── handlers/     # IPC handlers (currently empty)
│   │   └── index.ts
│   ├── services/     # Business logic services
│   ├── types/        # TypeScript types
│   │   ├── env.d.ts
│   │   └── response.type.ts
│   └── utils/        # Utility functions
│       └── file.utils.ts
│
├── preload/           # Electron preload scripts (bridge)
│   ├── index.ts      # Preload entry
│   └── index.d.ts    # Type definitions
│
└── renderer/          # React frontend (Browser)
    ├── index.html    # HTML entry point
    └── src/
        ├── main.tsx          # React entry point
        ├── App.tsx           # Root component (RouterProvider)
        ├── router.tsx        # React Router config (hash routing)
        ├── index.css         # Tailwind + CSS variables
        ├── contexts/         # React contexts
        ├── features/         # Feature modules
        ├── layouts/          # Layout components
        │   └── RootLayout.tsx
        ├── pages/            # Page components
        │   └── error/        # Error pages
        │       ├── ErrorBoundary.tsx
        │       └── NotFoundPage.tsx
        ├── shared/           # Shared components
        │   └── components/
        │       ├── ui/              # shadcn/ui components
        │       ├── elements/        # Custom elements
        │       ├── form/            # Form components
        │       └── navigation/      # Navigation components
        ├── stores/           # Zustand stores
        ├── types/            # TypeScript types
        │   └── components.d.ts  # Auto-generated icon types
        └── utils/            # Utility functions
            ├── date.utils.ts
            └── style.utils.ts
```

### Configuration Files

**Root Directory:**

- `package.json` - Dependencies and scripts
- `electron.vite.config.ts` - Vite configuration for all 3 processes
- `electron-builder.yml` - Build/packaging configuration
- `tsconfig.json` - Root TypeScript config (references only)
- `tsconfig.node.json` - Main/preload TypeScript config
- `tsconfig.web.json` - Renderer TypeScript config
- `eslint.config.mjs` - ESLint configuration
- `.prettierrc.yaml` - Prettier configuration
- `drizzle.config.ts` - Database ORM configuration
- `components.json` - shadcn/ui configuration
- `.gitignore` - Ignores: node_modules, dist, out, .eslintcache, _.log_, \*.env

### Key Architectural Patterns

1. **Electron Multi-Process:**
   - Main process: Node.js backend (`src/main/`)
   - Renderer process: React frontend (`src/renderer/`)
   - Preload: Secure IPC bridge (`src/preload/`)

2. **Path Aliases:**
   - `@renderer/*` → `src/renderer/src/*` (configured in tsconfig.web.json and electron.vite.config.ts)
   - shadcn/ui aliases: `@/components`, `@/utils`, `@/ui`, `@/lib`, `@/hooks`

3. **Routing:**
   - Hash routing (`createHashRouter`) for Electron compatibility
   - Lazy loading: `lazy: () => import('./pages/SomePage')`
   - ErrorBoundary for error handling

4. **Styling:**
   - Tailwind CSS v4 with inline theme
   - CSS variables for theming (light/dark modes)
   - shadcn/ui components in `src/renderer/src/shared/components/ui/`

5. **Icons:**
   - Auto-imports icons: `<IconName />` (from `unplugin-icons`)
   - Types auto-generated to `src/types/components.d.ts`
   - Default size: 24x24px

6. **Database:**
   - SQLite database stored in Electron's userData directory
   - Drizzle ORM for type-safe queries
   - Migrations: `src/main/database/migrations/`
   - Schemas: `src/main/database/schema/`

## Common Issues & Workarounds

### Issue: TypeScript Errors for Missing Pages

**Symptom:** `npm run typecheck` fails with "Cannot find module" errors for pages in `router.tsx`

**Cause:** Router references pages that don't exist yet

**Solution:**

1. Create placeholder page components, OR
2. Temporarily comment out the routes, OR
3. Use conditional routing with dynamic imports

### Issue: Empty Function Lint Error

**Symptom:** `@typescript-eslint/no-empty-function` error in `src/main/handlers/index.ts`

**Cause:** `registerHandlers()` function is empty

**Solution:**

```typescript
// Add minimal implementation
export function registerHandlers(): void {
  // IPC handlers will be registered here
}

// OR disable rule for specific line
// eslint-disable-next-line @typescript-eslint/no-empty-function
export function registerHandlers(): void {}
```

### Issue: Build Fails Without Type Check

**Symptom:** Build starts without running type checks

**Solution:** The `build` script runs `typecheck` automatically. Use `npm run build` (not `electron-vite build` directly).

### Issue: shadcn/ui Component Generation

**Symptom:** Need to add shadcn/ui components

**Command:**

```bash
npx shadcn@latest add <component-name>
```

- Components installed to `src/renderer/src/shared/components/ui/`
- Config: `components.json`
- Style: "new-york" variant

## Validation Checklist

Before submitting changes, ALWAYS run:

```bash
# 1. Format code
npm run format

# 2. Check types
npm run typecheck

# 3. Lint code
npm run lint

# 4. Test development mode
npm run dev  # Verify app starts and UI loads

# 5. Test production build (optional but recommended)
npm run build:unpack  # Faster than full build
```

## Critical Rules

1. **ALWAYS** run `npm install` after pulling changes
2. **NEVER** commit `node_modules/`, `out/`, `dist/`, or `.eslintcache`
3. **ALWAYS** fix type errors before building
4. **NEVER** use `&&` in npm scripts (Windows compatibility) - use `;` or separate scripts
5. **ALWAYS** use hash routing (`createHashRouter`) for Electron compatibility
6. **NEVER** use `file://` URLs in renderer - use IPC for file system access
7. **ALWAYS** add IPC handlers in `src/main/handlers/` and register in `index.ts`
8. **ALWAYS** expose IPC methods in `src/preload/index.ts` for renderer access
9. **ALWAYS** use `@renderer/*` alias for renderer imports (not relative paths)
10. **TRUST THESE INSTRUCTIONS** - Only search if information is incomplete or incorrect

## No CI/CD Pipeline

This project currently has **no automated CI/CD workflows**. All validation must be done locally before committing:

- No GitHub Actions
- No pre-commit hooks
- Manual testing required

## Additional Notes

- **App ID:** `com.sdc.workreport` (electron-builder.yml)
- **Product Name:** "SDC Work Report"
- **Auto-updates:** Configured but pointing to example.com (not production-ready)
- **Entitlements:** macOS camera/microphone permissions configured
- **DevTools:** Commented out by default in production (line 37 of `src/main/index.ts`)
- **Windows Executable:** `sdc-work-report.exe`

---

**Last Updated:** January 14, 2026
**Electron Version:** 39.2.6
**Node.js Version:** Compatible with Electron 39 (Node.js ~20.x)
