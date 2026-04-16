# src/components/ui

shadcn/ui primitives wrapping Radix UI, `react-resizable-panels`, and
`class-variance-authority`. Standard generated components with minimal
customization.

## Files

| File                | Wraps                           | Notes                                                 |
| ------------------- | ------------------------------- | ----------------------------------------------------- |
| `badge.tsx`         | native `<div>`                  | Chip/badge component                                  |
| `button.tsx`        | native `<button>`               | Variants via `cva`. Imports from `buttonVariants.ts`. |
| `buttonVariants.ts` | --                              | Button variant definitions (extracted for reuse)      |
| `dialog.tsx`        | `@radix-ui/react-dialog`        | Modal dialog                                          |
| `dropdown-menu.tsx` | `@radix-ui/react-dropdown-menu` | Dropdown menu                                         |
| `input.tsx`         | native `<input>`                | Text input                                            |
| `label.tsx`         | `@radix-ui/react-label`         | Form label                                            |
| `resizable.tsx`     | `react-resizable-panels`        | Panel, PanelGroup, Handle                             |
| `select.tsx`        | `@radix-ui/react-select`        | Select dropdown                                       |
| `span.tsx`          | native `<span>`                 | Project-specific: `cn`-enabled span wrapper           |
| `table.tsx`         | native `<table>`                | Table, Header, Body, Row, Head, Cell                  |
| `tabs.tsx`          | `@radix-ui/react-tabs`          | Tabs, TabsList, TabsTrigger, TabsContent              |
| `textarea.tsx`      | native `<textarea>`             | Multi-line text input                                 |

## Guidelines

- Do not hand-edit these files unless adding a genuinely new primitive.
- To add a new shadcn component, use the shadcn CLI or match the existing pattern.
- `span.tsx` is a project-specific addition (not standard shadcn).
- All components use `cn()` from `@/lib/utils` for class composition.
