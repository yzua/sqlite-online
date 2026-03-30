# AGENTS.md

## Purpose

This repository is a client-side SQLite editor built with React 19, TypeScript,
Vite 6, Tailwind CSS 4, Zustand, Radix UI, and `sql.js` running inside a web
worker.

This file is for coding agents working in `/home/yz/Documents/sqlite-online`.
It documents the commands, constraints, and code conventions that are actually
used in this repo.

## Instruction Sources

- No repository-local `CLAUDE.md` was found.
- No Cursor rules were found in `.cursor/rules/`.
- No `.cursorrules` file was found.
- No Copilot instructions were found at `.github/copilot-instructions.md`.
- CI currently enforces formatting and linting through GitHub Actions.

## Environment And Tooling

- Primary package manager: `npm`
- Runtime used in CI: Node.js `20`
- Build tool: Vite
- Language: TypeScript with `strict: true`
- Linting and formatting: Biome (`biome.json`)
- Type checking: performed through `tsc -b` inside the build script
- Tests: no automated test runner is configured right now

## Development Commands

- Install dependencies: `npm install`
- Start dev server: `npm run dev`
- Run full code quality checks: `npm run check`
- Fix all biome issues: `npm run check:fix`
- Build production app: `npm run build`
- Build GitHub Pages variant: `npm run build:pages`
- Preview normal build: `npm run preview`
- Preview Pages build: `npm run preview:pages`
- Deploy `dist/` to GitHub Pages: `npm run deploy`
- Run type checking only: `npm run typecheck`
- Run lint only: `npm run lint`
- Fix lint issues: `npm run lint:fix`
- Format source files: `npm run format`
- Check formatting only: `npm run format:check`
- Detect unused files / deps: `npm run knip`
- Run diagnostics: `npm run doctor`

## Single-File And Narrow Checks

- Lint one file: `npx biome lint src/path/to/file.tsx`
- Lint a folder: `npx biome lint src/components/browseTab`
- Check formatting for one file: `npx biome check --formatter-enabled=true --linter-enabled=false --assist-enabled=false src/path/to/file.tsx`
- Format one file: `npx biome format --write src/path/to/file.tsx`
- There is no dedicated standalone typecheck script; use `npm run build` to run
  the repo's TypeScript project references.

## Test Status

- There are currently no `*.test.*` or `*.spec.*` files in the repository.
- There is no Vitest, Jest, Playwright, or other test runner configured in
  `package.json`.
- Because no test framework exists yet, there is no valid "run a single test"
  command today.
- If you add tests in the future, also add package scripts and update this file.

## Recommended Validation Sequence

1. `npx biome check <changed files>`
2. `npm run build`

If you touch dependency boundaries or dead code, also run `npm run knip`.

## Project Structure

- `src/components/ui/` - shadcn/Radix UI primitives
- `src/store/` - Zustand stores (useXStore named exports)
- `src/providers/` - React context providers
- `src/hooks/` - Custom React hooks (useX naming)
- `src/types.ts` - Domain types for worker payloads and data
- `src/lib/utils.ts` - Shared utilities including `cn()` for class composition

## Import Conventions

- Prefer `@/` aliases for imports from `src/` across directory boundaries.
- Use relative imports for same-folder files such as `./ThemeContext` or
  `./buttonVariants`.
- Keep CSS side-effect imports first when present, as in `src/main.tsx`.
- Group imports with blank lines between logical sections.
- Typical grouping order: side effects, React/platform, third-party, `@/`
  imports, relative imports, then `import type`.
- Prefer `import type` for type-only imports.
- Match nearby files instead of reordering unrelated imports.

## Formatting Rules

- Biome is authoritative.
- Use 2-space indentation.
- Use semicolons.
- Use double quotes, including JSX attributes.
- Keep `printWidth` near 80 columns.
- Trailing commas are disabled.
- Arrow functions should keep parentheses even for one parameter.

## TypeScript Rules

- `strict` mode is enabled. Do not weaken types to get code through build.
- `noUnusedLocals` and `noUnusedParameters` are enabled.
- `noFallthroughCasesInSwitch` is enabled.
- `noUncheckedSideEffectImports` is enabled.
- Prefer explicit domain types from `src/types.ts` for worker payloads and data.
- Use `interface` for object-shaped contracts that may grow.
- Use `type` aliases for unions, records, and composed utility types.
- Preserve readonly intent where it already exists.
- Avoid `any`; if unavoidable, isolate it and justify it locally.

## Naming Conventions

- React components: PascalCase file names and PascalCase component names.
- Hooks: camelCase starting with `use`, for example `useFileDrop`.
- Providers and contexts: `XProvider` and `XContext`.
- Zustand stores: `useXStore` named exports.
- Props types: `XProps`.
- Store internals commonly use `State`, `Actions`, and `Store` suffixes.
- Constants use `UPPER_SNAKE_CASE` when module-level and stable.
- Helper functions use clear verb names like `handleDownload` and
  `initializeApiKey`.

## React And State Conventions

- This repo uses React 19 and the React Compiler Babel plugin.
- Keep React Compiler-friendly patterns even though the repo no longer uses ESLint.
- Use hooks and functional components by default.
- Class components exist only where they provide value, such as `ErrorBoundary`.
- Memoization with `useCallback` and `useMemo` is common in heavy UI and
  provider code; keep dependency arrays correct.
- Zustand selectors are typically read one field at a time:
  `useDatabaseStore((state) => state.currentTable)`.
- Direct store access through `useDatabaseStore.getState()` is used for event
  handlers and other non-reactive flows.

## Error Handling

- Fail loudly on true invariants, for example missing provider context hooks.
- Prefer `try/catch` around async browser APIs, worker setup, storage, crypto,
  fetches, and SQL initialization.
- When catching unknown errors, normalize with
  `error instanceof Error ? error.message : String(error)`.
- Use `console.error` for operational failures and `console.warn` for degraded fallbacks.
- Surface user-visible problems through store error state or toast messages.
- Do not silently swallow errors unless the file already intentionally does so.

## UI And Styling Conventions

- Prefer existing shadcn/Radix primitives from `src/components/ui/`.
- Use the shared `cn()` utility from `@/lib/utils` for class composition.
- For variant-based styling, follow the existing `cva` pattern.
- Preserve accessibility attributes already common in the repo: `role`,
  `aria-label`, `aria-live`, `aria-describedby`, and keyboard support.
- Keep styling in Tailwind utility classes inside components; there is very
  little component-scoped CSS.

## File Change Guidelines

- Make minimal, localized changes.
- Reuse existing helpers, stores, and provider wiring before introducing new
  abstractions.
- Match the export style already used nearby: default exports are common for
  components, hooks, providers, and classes; named exports are common for
  stores and small shared utilities.
- Do not introduce a test framework, state library, or styling approach unless
  the task explicitly requires it.
- If you add new commands or repo-wide rules, update this `AGENTS.md`.
