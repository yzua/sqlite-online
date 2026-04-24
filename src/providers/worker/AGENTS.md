# src/providers/worker

Web Worker context provider, action dispatch, message handling, hotkeys, and
worker-side utilities. The bridge between the React UI and the SQLite web worker.

## Files

| File                     | Export                            | Role                                                                                                                             |
| ------------------------ | --------------------------------- | -------------------------------------------------------------------------------------------------------------------------------- |
| `types.ts`               | `PageChange`, `DatabaseWorkerApi` | Public contract: 10 action methods exposed via context.                                                                          |
| `WorkerContext.tsx`      | `DatabaseWorkerContext`           | React context. Value is `DatabaseWorkerApi \| undefined`.                                                                        |
| `WorkerProvider.tsx`     | `DatabaseWorkerProvider`          | Root provider. Creates worker, wires message handler, delegates data fetching to `useTableDataFetch`, iframe bridge.             |
| `handleWorkerMessage.ts` | `createWorkerMessageHandler`      | Factory returning the `onmessage` handler. Maps worker responses to Zustand store mutations.                                     |
| `useWorkerActions.ts`    | `useWorkerActions`                | Hook returning all 10 `DatabaseWorkerApi` methods as `useCallback`-memoized functions.                                           |
| `useWorkerHotkeys.ts`    | `useWorkerHotkeys`                | Binds Ctrl+S/I/U/D/Q/Arrow hotkeys to worker actions.                                                                            |
| `useTableDataFetch.ts`   | `useTableDataFetch`               | Reactive data-fetch effect. Watches `currentTable`, `filters`, `sorters`, `offset`; debounces filter changes (100ms).            |
| `workerActionUtils.ts`   | pure functions                    | `resetBrowseState`, `getSelectedTableColumns`, `createNextFilters`, `createNextSorters`, `getNextPageOffset`. No React deps.     |
| `postWorkerMessage.ts`   | `postWorkerMessage`               | Thin wrapper around `worker.postMessage()`. Null-guard + toast on failure. Returns type-narrowing boolean.                       |
| `useIframeBridge.ts`     | `useIframeBridge`                 | Wires cross-frame database loading. Exposes `window.loadDatabaseBuffer` and listens for `postMessage` events from parent frames. |

## Architecture

```
WorkerProvider (mount)
  -> new SqliteWorker()
  -> createWorkerMessageHandler(store setters)
  -> postMessage("init")
  -> WorkerContext.Provider

Data flow for every action:
  UI event -> useWorkerActions method -> postWorkerMessage -> worker
  -> worker response -> handleWorkerMessage -> Zustand store.set -> re-render
```

## DatabaseWorkerApi (public contract)

```ts
interface DatabaseWorkerApi {
  handleFileUpload: (file: File) => void;
  handleFileChange: (event: React.ChangeEvent<HTMLInputElement>) => void;
  handleDownload: () => void;
  handleTableChange: (selectedTable: string) => void;
  handleQueryFilter: (column: string, value: string) => void;
  handleQuerySorter: (column: string) => void;
  handlePageChange: (type: PageChange) => void;
  handleExport: (exportType: ExportTypes) => void;
  handleQueryExecute: () => void;
  handleEditSubmit: (type: EditTypes) => void;
}
```

## Key Patterns

- **Reactive auto-fetch**: `useTableDataFetch` (called from `WorkerProvider`)
  watches `currentTable`, `filters`, `sorters`, `offset` and auto-sends
  `getTableData` with 100ms debounce. Table/filter/sort/page actions only update
  Zustand; the hook's effect handles the worker message.
- **Direct Zustand reads**: `handleQueryFilter`, `handleQuerySorter`, and
  `handleEditSubmit` use `useDatabaseStore.getState()` to avoid stale closures.
- **Two loading flags**: `isDatabaseLoading` (init/open) vs `isDataLoading`
  (queries, CRUD).
- **iframe bridge**: `window.loadDatabaseBuffer` and `postMessage` events enable
  cross-frame database loading.
- **Row limit**: Dynamically calculated from DOM heights via `useTableLimit`
  (called inside `useTableDataFetch`), which wraps `@/lib/calculateTableLimit`.

## Guidelines

- New worker actions must: add a type to `@/types` (WorkerEvent/WorkerResponseEvent),
  add a handler in `workerRuntime.ts`, add a response case in `handleWorkerMessage.ts`,
  and expose an action in `useWorkerActions.ts`.
- Keep action utilities pure in `workerActionUtils.ts`. `parseSqlStatements` and
  `calculateTableLimit` live in `@/lib/` as they have no worker/provider dependency.
- Do not call `worker.postMessage` directly; use `postWorkerMessage` for the null guard.
