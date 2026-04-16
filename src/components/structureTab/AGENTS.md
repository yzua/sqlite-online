# src/components/structureTab

The "Database Structure" tab. Schema tree showing tables, views, indexes, and
column details. Also provides `SchemaTree` reused in browse and execute tabs.

## Files

| File                       | Export                      | Role                                                                                                                                                       |
| -------------------------- | --------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `StructureTab.tsx`         | `DatabaseStructureTab`      | Thin wrapper. Renders `SchemaTree` in a scrollable container.                                                                                              |
| `SchemaTreePanel.tsx`      | `SchemaTreePanel` (default) | Scrollable wrapper around `SchemaTree`. Used by other tabs for their schema side panel.                                                                    |
| `SchemaTree.tsx`           | `SchemaTree`                | Main orchestrator. Manages filter text and expand state. Reads `tablesSchema`/`indexesSchema` from `useDatabaseStore`, expand state from `useSchemaStore`. |
| `TablesSection.tsx`        | `TablesSection` (memoized)  | Collapsible "Tables" section with expand-all/collapse-all. Maps entries to `TableItem`.                                                                    |
| `TableItem.tsx`            | `TableItem` (memoized)      | Single table row: expand chevron, view icon, name, column count. Expands to show `TableColumn` list.                                                       |
| `TableColumn.tsx`          | `TableColumn` (memoized)    | Single column row with type icon and name/type badge.                                                                                                      |
| `IndexesSection.tsx`       | `IndexesSection` (memoized) | Collapsible "Indexes" section. Maps entries to `IndexItem`.                                                                                                |
| `IndexItem.tsx`            | `IndexItem` (memoized)      | Single index row: name and associated table badge.                                                                                                         |
| `SchemaSearch.tsx`         | `SchemaSearch` (memoized)   | Search input. No debounce; filtering is `useMemo` in `SchemaTree`.                                                                                         |
| `common/SectionHeader.tsx` | `SectionHeader` (memoized)  | Reusable collapsible header with icon, title, chevron, action slot.                                                                                        |
| `common/ToggleChevron.tsx` | `ToggleChevron` (memoized)  | Right/down chevron icon based on `expanded` state.                                                                                                         |

## Key Patterns

- All components are `memo`-wrapped for performance with large schemas.
- `SchemaTree` is exported for reuse in browse and execute tab schema panels.
- Expand/collapse state is split: `useSchemaStore` (Zustand) for persistence,
  local state in `SchemaTree` for the "expanded table section" (column list).
- Filtering uses `useMemo` over `tablesSchema` keys and index names.

## Guidelines

- Keep components memoized. Schema trees can be large.
- New section types (triggers, etc.) should follow the `TablesSection`/`IndexesSection` pattern.
- `common/` contains shared primitives for this tab only.
