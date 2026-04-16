# AGENTS.md

Client-side SQLite editor: React 19 + TypeScript + Vite 8 + Tailwind 4 +
Zustand + `sql.js` in a web worker.

## Read this first

- Start with `README.md`, `package.json`, `biome.json`, `vite.config.ts`, and
  `tsconfig*.json`.
- Then read the nearest scoped instructions when working under:
  - `src/AGENTS.md`
  - `src/components/AGENTS.md`
  - `src/components/browseTab/AGENTS.md`
  - `src/components/executeTab/AGENTS.md`
  - `src/components/structureTab/AGENTS.md`
  - `src/components/ui/AGENTS.md`
  - `src/hooks/AGENTS.md`
  - `src/lib/AGENTS.md`
  - `src/providers/worker/AGENTS.md`
  - `src/sqlite/AGENTS.md`
  - `src/store/AGENTS.md`

## Commands that matter

- Install: `npm install`
- Dev server: `npm run dev`
- Tests: `npm test` (single run) / `npm run test:watch` (watch mode)
- Full check: `npm run check`
- Build app: `npm run build` (`typecheck` runs first)
- Build GitHub Pages variant: `npm run build:pages`
- Unused-file/deps check: `npm run knip`
- React diagnostics: `npm run doctor`

## Narrow validation

- Preferred for small edits: `npx biome check <changed-files>`
- Run related tests: `npx vitest run <path>` or `npm test` for the full suite
- Format-only check for one file:
  `npx biome check --formatter-enabled=true --linter-enabled=false --assist-enabled=false <file>`
- Lint one file/folder: `npx biome lint <path>`
- Typecheck only: `npm run typecheck`
- Recommended sequence after edits:
  1. `npx biome check <changed-files>`
  2. `npx vitest run <changed-files>` (if a `.test.` file exists alongside)
  3. `npm run build`
- If you changed entrypoints, imports, or dead code boundaries, also run
  `npm run knip`.

## Verified constraints

- Vitest is the test runner (jsdom environment, setup in `src/test/setup.ts`).
  Test files follow `*.test.ts(x)` naming alongside their source files.
  Run the full suite with `npm test`, or target files with
  `npx vitest run <path>`.
- Biome is the formatter and linter. Let Biome own import organization.
- TypeScript is strict; `build` and `build:pages` both run `tsc -b` first.
- `vite.config.ts` sets `base` to `/sqlite-online/` only in `pages` mode.

## Architecture you need to know

- App entrypoint is `src/main.tsx`: it initializes API key storage, then mounts
  `ErrorBoundary > ThemeProvider > PanelProvider > DatabaseWorkerProvider > App`.
- `src/App.tsx` is the top-level tab shell. `ExecuteTab` is lazy-loaded; keep it
  lazy unless the task requires otherwise.
- Browser UI never talks to SQLite directly. UI actions go through
  `src/providers/worker/WorkerProvider.tsx` into `src/sqlite/sqliteWorker.ts`.
- `src/types.ts` is the source of truth for worker protocol and shared domain
  types.
- `src/store/useDatabaseStore.ts` is the main app state store. Use selectors and
  existing store actions before adding new state.

## Repo-specific coding rules

- Prefer `@/` imports across directories; use relative imports within the same
  folder.
- Keep CSS side-effect imports first, matching `src/main.tsx`.
- `sqliteWorker.ts` is protocol glue; avoid changing it unless the worker
  message contract changes.
- Add SQL helpers in `src/sqlite/sqlUtils.ts`, not inline in `src/sqlite/core.ts`.
- Keep worker/store/provider changes aligned: protocol updates usually require
  coordinated edits across `@/types`, worker runtime, message handler, and
  provider actions.
