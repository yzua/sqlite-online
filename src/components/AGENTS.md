# src/components

Top-level application components: header bar, file drop, and URL-based database
loading. Subdirectories contain tab features, UI primitives, and shared components.

## Files

| File                    | Export              | Role                                                                                                                      |
| ----------------------- | ------------------- | ------------------------------------------------------------------------------------------------------------------------- |
| `TopBar.tsx`            | `TopBar`            | Application header. Open Database file input, Save Database button, GitHub link, high-contrast toggle, dark/light toggle. |
| `FileDropHandler.tsx`   | `FileDropHandler`   | Drag-and-drop overlay. Wraps children, shows full-screen drop indicator when dragging.                                    |
| `DatabaseURLLoader.tsx` | `DatabaseURLLoader` | Loads database from `?url=` query parameter. Handles CORS errors with proxy fallback dialog.                              |

## Subdirectories

| Directory        | Purpose                                                             |
| ---------------- | ------------------------------------------------------------------- |
| `browseTab/`     | Browse Data tab (table viewer, editing, pagination)                 |
| `executeTab/`    | Execute SQL tab (CodeMirror editor, results grid, AI)               |
| `structureTab/`  | Database Structure tab (schema tree)                                |
| `ui/`            | shadcn/ui primitives                                                |
| `table/`         | Shared table sub-components (ColumnIcon, FilterInput, SorterButton) |
| `common/`        | ErrorBoundary, Toaster/Toast                                        |
| `accessibility/` | HighContrastToggle, LiveRegion, SkipLinks                           |
| `theme/`         | ModeToggle (dark/light)                                             |

## Guidelines

- New top-level layout components belong here.
- Feature-specific components go in their tab subdirectory.
- Reusable primitives go in `ui/`. Shared table helpers go in `table/`.
