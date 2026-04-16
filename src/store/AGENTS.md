# src/store

Zustand state stores. All stores use named exports (`useXStore`).

## Files

| File                  | Export                                                                                                                      | Role                                                                                                                            |
| --------------------- | --------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------- |
| `useDatabaseStore.ts` | `useDatabaseStore`, `selectIsCurrentTableView`, `selectBrowseTableState`, `selectExecuteViewState`, `selectPaginationState` | Primary store. Database state: schema, data, columns, pagination, filters, sorters, custom query, API key, loading/error flags. |
| `usePanelStore.ts`    | `usePanelStore`, `selectPanelSizes`                                                                                         | UI panel sizes (schema/data). Panel setters are debounced (200ms via lodash).                                                   |
| `useSchemaStore.ts`   | `useSchemaStore`                                                                                                            | Structure tab expand/collapse state: `expandedTables`, `expandedIndexSection`.                                                  |

## Key Patterns

- Single `set` call pattern: stores use Zustand's `create` with one `set` arg.
- Selectors are exported as standalone functions for use with `useStore(selector)`.
  Multi-field selectors use `useShallow` from Zustand.
- `useDatabaseStore` has async actions (`initializeApiKey`, `setGeminiApiKey`)
  that interact with `SecureStorage` and localStorage.
- `usePanelStore` uses factory function `createDebouncedPanelSizeSetter` to
  generate debounced setters during store creation.
- `setOffset` accepts a function updater: `setOffset(prev => prev + limit)`.

## Guidelines

- New application state goes in `useDatabaseStore`. New UI-only state may
  warrant a new store if it's unrelated to existing concerns.
- Always export selectors for derived state. Use `useShallow` for objects.
- Do not add React component imports to stores. Stores should be pure state.
