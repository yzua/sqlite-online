# src/components

Application shell and feature components organized by concern.

## Subdirectories

| Directory        | Purpose                                                             |
| ---------------- | ------------------------------------------------------------------- |
| `layout/`        | App shell: TopBar, FileDropHandler, DatabaseURLLoader               |
| `browse-tab/`    | Browse Data tab (table viewer, editing, pagination)                 |
| `execute-tab/`   | Execute SQL tab (CodeMirror editor, results grid, AI)               |
| `structure-tab/` | Database Structure tab (schema tree)                                |
| `ui/`            | shadcn/ui primitives                                                |
| `table/`         | Shared table sub-components (ColumnIcon, FilterInput, SorterButton) |
| `common/`        | ErrorBoundary, Toaster, toast helper                                |
| `accessibility/` | HighContrastToggle, LiveRegion, SkipLinks                           |
| `theme/`         | ModeToggle (dark/light)                                             |

## Guidelines

- Shell-level layout components belong in `layout/`.
- Feature-specific components go in their tab subdirectory.
- Reusable primitives go in `ui/`. Shared table helpers go in `table/`.
