# src

Application root: entry point, provider composition, routing, global types, and
global styles.

## Files

| File                | Export             | Role                                                                                                                                                                                                                                            |
| ------------------- | ------------------ | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `main.tsx`          | none (side-effect) | Entry point. Initializes API key storage, mounts provider tree: `ErrorBoundary > ThemeProvider > PanelProvider > DatabaseWorkerProvider > App`. Also mounts `AppToaster` inside ThemeProvider but outside PanelProvider/DatabaseWorkerProvider. |
| `App.tsx`           | `App` (default)    | Root component. Three-tab layout (Browse Data, Execute SQL, Database Structure). Lazy-loads `ExecuteTab`. Wraps in `FileDropHandler`, `SkipLinks`, `LiveRegion`.                                                                                |
| `types.ts`          | named types        | Central type definitions: `TableSchema`, `TableSchemaRow`, `IndexSchema`, `Sorters`, `Filters`, `EditResultType`, `CustomQueryResult`, `TableQueryPayload`, `EditTypes`, `ExportTypes`, `WorkerEvent`, `WorkerResponseEvent`.                   |
| `index.css`         | none (side-effect) | Global CSS. Imports Tailwind v4. Defines light/dark/high-contrast themes in OKLCH. Custom scroll utilities. `prefers-reduced-motion` support.                                                                                                   |
| `vite-env.d.ts`     | none               | Vite client type reference.                                                                                                                                                                                                                     |
| `types/window.d.ts` | none               | Augments `Window` with `loadDatabaseBuffer` for iframe embedding.                                                                                                                                                                               |

## Provider Tree

```
main.tsx
  ErrorBoundary
    ThemeProvider (defaultTheme="dark")
      PanelProvider
        DatabaseWorkerProvider
          App
      AppToaster
```

## Guidelines

- `types.ts` is the single source of truth for worker protocol types and domain
  types. Do not duplicate these definitions elsewhere.
- `index.css` manages three theme modes via CSS custom properties. Theme tokens
  use OKLCH color space. High-contrast mode is toggled via `.high-contrast` class.
- New top-level components should be added to `App.tsx` tab structure or as
  standalone routes if navigation grows.
- `ExecuteTab` is lazy-loaded; keep it that way to reduce initial bundle.
