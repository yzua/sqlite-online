# src/components/browseTab

The "Browse Data" tab. Table viewer with per-column filtering, sorting,
pagination, inline row editing, and CSV export.

## Files

| File                        | Export                  | Role                                                                                                                              |
| --------------------------- | ----------------------- | --------------------------------------------------------------------------------------------------------------------------------- |
| `BrowseTab.tsx`             | `BrowseTab`             | Root component. Orchestrates toolbar, resizable data/schema panels, and edit overlay.                                             |
| `DataTable.tsx`             | `DataTable`             | HTML table with sort/filter column headers and data rows. Delegates to `BrowseTableRow` and `BrowseTableEmptyState`.              |
| `BrowseTableRow.tsx`        | `BrowseTableRow`        | Single table row. Handles row selection, PK stripping, NULL/BLOB badges, keyboard navigation (`tabIndex=0`, Enter/Space).         |
| `BrowseTableEmptyState.tsx` | `BrowseTableEmptyState` | Empty state with filter-aware messaging.                                                                                          |
| `TableSelector.tsx`         | `TableSelector`         | `<Select>` dropdown listing tables from `tablesSchema`.                                                                           |
| `ActionButtons.tsx`         | `ActionButtons`         | Desktop toolbar: clear filters, reset sorting, export. Falls back to `ActionsDropdown` on mobile.                                 |
| `ActionsDropdown.tsx`       | `ActionsDropdown`       | Mobile-only dropdown menu with same actions plus insert/export.                                                                   |
| `PaginationControls.tsx`    | `PaginationControls`    | Bottom pagination bar with first/prev/next/last, row range display, insert/export buttons.                                        |
| `paginationUtils.ts`        | pure functions          | `getCurrentPage`, `getTotalPages`, `getVisibleRange`, `isAtFirstPage`, `isAtLastPage`. No React deps.                             |
| `EditSection.tsx`           | `EditSection`           | Inline edit panel. Composes header, fields, and actions. Rendered directly in schema panel (desktop) and outside panels (mobile). |
| `EditSectionHeader.tsx`     | `EditSectionHeader`     | Sticky header: "Inserting new row" / "Updating row" with back button.                                                             |
| `EditSectionField.tsx`      | `EditSectionField`      | Single editable column field. Renders `<Input>` or `<Textarea>` based on SQLite type.                                             |
| `EditSectionActions.tsx`    | `EditSectionActions`    | Footer with insert/update/delete action buttons.                                                                                  |
| `useBrowseActions.ts`       | `useBrowseActions`      | Hook: clear filters, reset sorters, export. Replaces inline callbacks in ActionButtons.                                           |
| `rowMeta.ts`                | `getRowMeta`            | Pure function: computes view-aware PK stripping, display data, and row key for a row. Used by `DataTable`.                        |

## Component Hierarchy

```
BrowseTab
  +-- toolbar: TableSelector + ActionButtons (+ ActionsDropdown on mobile)
  +-- ResizablePanelGroup
        +-- dataPanel: DataTable + PaginationControls
        +-- schemaPanel: SchemaTree + EditSection
                    +-- EditSectionHeader
                    +-- EditSectionField[] (one per column)
                    +-- EditSectionActions
```

## Data Sources

- **`useDatabaseStore`** (Zustand): `data`, `columns`, `currentTable`, `filters`,
  `sorters`, `offset`, `limit`, `maxSize`, `tablesSchema`, loading flags.
  Selectors: `selectBrowseTableState`, `selectPaginationState`,
  `selectIsCurrentTableView`.
- **`usePanelStore`** (Zustand): `schemaPanelSize`, `dataPanelSize`.
- **`useDatabaseWorker`** (context): `handleTableChange`, `handleQueryFilter`,
  `handleQuerySorter`, `handlePageChange`, `handleExport`, `handleEditSubmit`.
- **`usePanelManager`** (context): `isEditing`, `isInserting`, `selectedRowObject`,
  `handleInsert`, `handleCloseEdit`, `handleRowClick`, `editValues`, `setEditValues`.

## Key Patterns

- **Responsive split**: Desktop uses `ResizablePanelGroup` (data 75% / schema 25%).
  Mobile hides schema panel; edit overlay renders as full-screen layer.
- **View awareness**: `selectIsCurrentTableView` disables insert/update/delete for
  views. PK column is not stripped for views.
- **Primary key handling**: `DataTable` uses `getRowMeta()` (from `rowMeta.ts`)
  to compute per-row PK value, display data, and stable row keys. View-aware:
  no PK stripping for views.
- **Accessibility**: `role="table"`, `aria-sort` on headers, `aria-label` on all
  buttons with dynamic counts, `sr-only` descriptions, keyboard row selection.
- **Panel sizes**: Persisted via `usePanelStore` with 200ms debounced setters.

## Guidelines

- Store selectors should use `useShallow` for multi-field reads.
- Keep pure pagination math in `paginationUtils.ts`, not in components.
- Edit overlay is rendered twice (desktop in schema panel, mobile outside).
  Both are controlled by the same `isEditing` state.
