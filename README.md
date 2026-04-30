# @techtrips/ui-controls

![version](https://img.shields.io/badge/version-0.1.0-blue)

A React composite UI controls library. Headless core with opt-in plugins so each big feature stays tree-shakeable and the bundle stays small.

> **Design policy:** zero UI-framework dependencies. Components are built on native HTML elements and themed via `--dgv-*` CSS variables so consumers can skin them with Fluent, Material, Tailwind, or plain CSS without conflicts. `react` / `react-dom` are peer dependencies.

## Installation

```bash
npm install --save @techtrips/ui-controls@latest
```

## Components

### `DataGrid`

Native-DOM data grid with a plugin architecture. Each feature ships as a separate factory you can include or omit.

```tsx
import {
  DataGrid,
  DataGridSelectionMode,
  createSortPlugin,
  createSearchPlugin,
  createFilterPlugin,
  createGroupPlugin,
  createColumnVisibilityPlugin,
  createPaginationPlugin,
} from "@techtrips/ui-controls";

<DataGrid
  items={people}
  itemKey="id"
  columns={columns}
  selectionMode={DataGridSelectionMode.Multi}
  plugins={[
    createSearchPlugin({ debounceMs: 200 }),
    createFilterPlugin(),
    createSortPlugin({ allowMultiLevel: true }),
    createGroupPlugin(),
    createColumnVisibilityPlugin(),
    createPaginationPlugin({ pageSizeOptions: [10, 25, 50] }),
  ]}
  onChange={(c) => console.log(c.kind, c.state)}
/>;
```

Pipeline order: `filter → search → sort → group → page`.

#### Default plugins

If you omit `plugins` (or pass an empty array), the grid auto-injects a sensible default set so it's useful out of the box:

```tsx
<DataGrid items={people} columns={columns} itemKey="id" />
// ≡ plugins: [createSearchPlugin(), createColumnVisibilityPlugin()]
```

Passing any non-empty `plugins` array opts out of the defaults entirely.

#### Default action-bar layout

When `toolbarOrder` is omitted, plugin slots are placed as:

- **Left:** `status`
- **Right:** `sort`, `group`, `filter`, `columnVisibility`, `search`

The pager (`pagination`) goes in the footer's left/growing slot so its rows-info sits on the start edge and the nav buttons on the end edge.

#### Columns

`IDataGridColumn` supports a few visibility flags consumed by the column-visibility plugin and the runtime:

| Prop | Purpose |
|---|---|
| `hideable` | When `false`, the column is omitted from the column-visibility picker entirely. |
| `required` | Column can never be hidden. The picker shows it as a checked + disabled row, and the runtime forces it visible even if `initialState.hiddenColumns` includes it. Implies `defaultVisible: true`. |
| `defaultVisible` | When `false`, the column starts hidden on first mount (user can re-enable via the picker). Ignored when `required` is set. |

```tsx
const columns: IDataGridColumn<IPerson>[] = [
  { id: "id",     name: "#",     field: "id",     required: true },
  { id: "name",   name: "Name",  field: "name",   required: true },
  { id: "email",  name: "Email", field: "email",  required: true },
  { id: "salary", name: "Salary", field: "salary", defaultVisible: false },
  // …
];
```

## Theming

The grid is themed entirely through `--dgv-*` CSS custom properties. Five themes ship in the package; pick one (or write your own).

```tsx
// 1. Pick a built-in theme (CSS only — no JS, no provider).
import "@techtrips/ui-controls/themes/dark.css";

<DataGrid theme="dark" {...} />
```

Built-in themes:

| Import path | Effect |
|---|---|
| `@techtrips/ui-controls/themes/light.css` | explicit light palette |
| `@techtrips/ui-controls/themes/dark.css`  | dark palette |
| `@techtrips/ui-controls/themes/auto.css`  | follows `prefers-color-scheme` |
| `@techtrips/ui-controls/themes/fluent.css` | maps tokens to Fluent UI v9 vars (live-reads `<FluentProvider>`) |
| `@techtrips/ui-controls/themes/material.css` | maps tokens to MUI CSS vars (live-reads `CssVarsProvider`) |
| `@techtrips/ui-controls/themes/index.css` | all of the above, switch via `theme` prop |

The `theme` prop on `DataGrid` sets `data-dgv-theme="..."` on the grid root; you can also set this attribute on any ancestor (e.g. `<html>`) to theme every grid on the page.

### Custom themes

```css
[data-dgv-theme="acme"] {
  --dgv-color-bg: #0f172a;
  --dgv-color-fg: #f1f5f9;
  --dgv-color-accent: #f43f5e;
  /* full token list lives in DataGrid.styles.css */
}
```

```tsx
<DataGrid theme="acme" {...} />
```

### Adapter + theme

If you also pass an `adapter` (e.g. `fluentAdapter`, `muiAdapter`), the adapter's primitives are themed by **their** framework (`<FluentProvider>` / MUI `ThemeProvider`). Use the matching grid theme (`themes/fluent.css` or `themes/material.css`) so the chrome and primitives stay visually aligned.

## Release Notes

See the full [change log](docs/ChangeLog.md).

## Code Repository

https://github.com/techtrips/ui-controls/

## Authors and Contributors

Initially developed and maintained by Chinmaya Kumar Panda.

Contributions welcome — please [contact us](mailto:visit.chinmaya@gmail.com).
