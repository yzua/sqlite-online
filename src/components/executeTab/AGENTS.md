# src/components/executeTab

The "Execute SQL" tab. CodeMirror SQL editor with AI-powered generation,
virtualized results grid, and CSV export. Lazy-loaded by `App.tsx`.

## Files

| File                         | Export                                      | Role                                                                                                 |
| ---------------------------- | ------------------------------------------- | ---------------------------------------------------------------------------------------------------- |
| `ExecuteTab.tsx`             | `ExecuteTab`                                | Root orchestrator. Routes Execute button to AI or SQL execution. Manages API key modal.              |
| `ExecuteTabToolbar.tsx`      | `ExecuteTabToolbar`                         | Action bar: Execute SQL, Export data, Gemini buttons. Pure presentational (all via props).           |
| `ExecuteTabEditorPanel.tsx`  | `ExecuteTabEditorPanel`                     | Vertical split: SQL editor (25%) + results grid (75%) via `ResizablePanelGroup`.                     |
| `CustomSQLTextarea.tsx`      | `CustomSQLTextarea`                         | CodeMirror 6 editor. Bound to `customQuery` in store. SQL language + autocomplete extensions.        |
| `CustomQueryDataTable.tsx`   | `CustomQueryDataTable`                      | Virtualized results grid using `react-window` Grid with auto-sized columns and sticky header.        |
| `QueryGridCell.tsx`          | `QueryGridCell`, `QueryGridCellCustomProps` | Single grid cell. Renders NULL as `<Badge>`, stringifies other values.                               |
| `QueryResultsEmptyState.tsx` | `QueryResultsEmptyState`                    | Empty state: different UI for "no query run" vs "zero results".                                      |
| `ApiKeyModal.tsx`            | `ApiKeyModal`                               | Dialog for entering/saving Gemini API key.                                                           |
| `sqlEditorCompletions.ts`    | `createSqlCompletionOptions`                | Builds autocomplete list: 124 SQLite keywords, 23 functions, dynamic table/column names from schema. |
| `useSqlEditorConfig.ts`      | `useSqlEditorConfig`                        | Hook: returns CodeMirror extensions array. Switches to plain-text mode for `/ai` prompts.            |
| `useQueryGridMetrics.ts`     | `useQueryGridMetrics`                       | Hook: per-column width calculation (samples first 100 rows), row height, header scroll sync.         |

## Component Hierarchy

```
ExecuteTab
  +-- ExecuteTabToolbar
  +-- ResizablePanelGroup (horizontal)
        +-- data panel
        |     +-- ExecuteTabEditorPanel
        |           +-- CustomSQLTextarea
        |           +-- CustomQueryDataTable
        |                 +-- QueryGridCell[] (via react-window Grid)
        |                 +-- QueryResultsEmptyState
        +-- schema panel (hidden on mobile)
              +-- SchemaTreePanel (from structureTab)
  +-- ApiKeyModal
```

## Data Sources

- **`useDatabaseStore`**: `customQuery`, `customQueryObject`, `errorMessage`,
  `isDataLoading`, `isDatabaseLoading` (individual selectors in `ExecuteTab`).
  `CustomQueryDataTable` uses `selectExecuteViewState` for
  `customQuery` + `customQueryObject`.
- **`useDatabaseWorker`** (context): `handleQueryExecute`, `handleExport`.
- **`useGeminiAI`** (hook): `generateSqlQuery()`, `isAiLoading`. Internally
  reads `geminiApiKey`, `tablesSchema`, `customQuery` from the store.
- **`usePanelStore`**: `selectPanelSizes` for resizable layout panels.

## AI Integration Flow

1. User types `/ai <natural language>` in the editor.
2. `useSqlEditorConfig` detects this and switches to plain-text mode.
3. On Execute, `ExecuteTab` calls `generateSqlQuery()` from `useGeminiAI`.
4. `requestGeminiSql()` (in `@/lib/gemini`) calls Gemini 1.5 Flash with full
   schema context.
5. Returned SQL replaces the `/ai` prompt in the editor via `setCustomQuery`.
6. User clicks Execute again to run the generated SQL normally.

## Guidelines

- Keep CodeMirror configuration in `useSqlEditorConfig.ts` and completion data
  in `sqlEditorCompletions.ts`. Do not inline extensions in the component.
- Grid column sizing is in `useQueryGridMetrics.ts`. All measurements are
  memoized with `useMemo`.
- The `ExecuteTab` component is lazy-loaded via `React.lazy` in `App.tsx`.
