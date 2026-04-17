# src/hooks

Custom React hooks. All use `useX` naming. Consumer hooks for context providers
throw descriptive errors when used outside their provider.

## Files

| File                | Export                        | Role                                                                                                                              |
| ------------------- | ----------------------------- | --------------------------------------------------------------------------------------------------------------------------------- |
| `useWorker.ts`      | `useDatabaseWorker` (default) | Consumer for `DatabaseWorkerContext`. Returns `DatabaseWorkerApi`.                                                                |
| `usePanel.ts`       | `usePanelManager` (default)   | Consumer for `PanelContext`. Returns edit panel state and handlers.                                                               |
| `useTheme.ts`       | `useTheme` (default)          | Consumer for `ThemeProviderContext`. Returns `{ theme, setTheme }`.                                                               |
| `useFileDrop.ts`    | `useFileDrop` (default)       | Global drag-and-drop. Attaches window listeners, validates files, delegates to `handleFileUpload`. Returns `{ isDragging }`.      |
| `useGeminiAI.ts`    | `useGeminiAI` (named)         | Wraps Gemini SQL generation. Provides `generateSqlQuery()` that calls `requestGeminiSql` and updates store.                       |
| `useKeyPress.ts`    | `useKeyPress` (default)       | Keyboard shortcut hook. Takes key combo string (e.g. `"ctrl+s"`), callback, optional case sensitivity. Prevents default on match. |
| `usePanelSizing.ts` | `usePanelSizing`              | Convenience hook for panel store. Returns data/schema panel sizes and setters via `useShallow(selectPanelSizes)`.                 |
| `useTableLimit.ts`  | `useTableLimit`               | Measures available DOM height to compute how many table rows fit. Recalculates on mount and resize.                               |

## Guidelines

- Context consumer hooks must throw if the context value is `undefined`
  (i.e., used outside the provider). Match the existing error message pattern.
- New hooks that wrap context should follow the `useWorker`/`usePanel`/`useTheme`
  pattern: simple `useContext` + throw guard.
- Keep `useKeyPress` generic. Do not add specific hotkey logic here;
  that belongs in `@/providers/worker/useWorkerHotkeys.ts` or
  `@/providers/panel/PanelProvider.tsx`.
