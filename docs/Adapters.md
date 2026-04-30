# Custom adapters

`DataGrid` ships with a zero-dependency native adapter. If you'd like the chrome (buttons, checkboxes, selects, popovers, drawers, icons) to match a specific design system, pass an `adapter` that maps the grid's primitive slots to your library's components.

The repo includes three reference adapters as **copy-paste source**, not as runtime exports. They live under [`examples/adapters/`](../examples/adapters/) and are not bundled in the published package.

| Adapter | Source | Peer deps |
|---|---|---|
| Fluent UI v9 | [examples/adapters/fluent-adapter.tsx](../examples/adapters/fluent-adapter.tsx) | `@fluentui/react-components`, `@fluentui/react-icons` |
| MUI (Material) | [examples/adapters/mui-adapter.tsx](../examples/adapters/mui-adapter.tsx) | `@mui/material`, `@mui/icons-material`, `@emotion/react`, `@emotion/styled` |
| Material-like (Tailwind/CSS-only) | [examples/adapters/material-like-adapter.tsx](../examples/adapters/material-like-adapter.tsx) + [material-like.css](../examples/adapters/material-like.css) | none |

## How to use

1. Install the peer deps for whichever design system you're integrating.
2. Copy the adapter file (and the CSS sibling, if any) into your app.
3. Pass it to `DataGrid`:

   ```tsx
   import { DataGrid } from "@techtrips/ui-controls";
   import "@techtrips/ui-controls/themes/fluent.css";
   import { fluentAdapter } from "./adapters/fluent-adapter";

   <DataGrid
     items={items}
     columns={columns}
     itemKey="id"
     adapter={fluentAdapter}
     theme="fluent"
   />;
   ```

4. Pair it with a matching grid theme so chrome and primitives align visually:
   - `fluentAdapter` → `themes/fluent.css`
   - `muiAdapter` → `themes/material.css`
   - `materialLikeAdapter` → `themes/light.css` / `dark.css`

## The adapter contract

```ts
import type { IDataGridAdapter } from "@techtrips/ui-controls";
```

`IDataGridAdapter` is a `Partial` of named slots — only override what you want. Any slot you don't provide falls through to the native default.

| Slot | Purpose |
|---|---|
| `Button` | Toolbar action buttons (sort/filter/group triggers, pager nav, etc). |
| `Checkbox` | Row select, column-visibility, filter checkboxes. |
| `Select` | Native `<select>` replacement (page-size, group-add). |
| `Input` | Search box and filter text inputs. |
| `Popover` | Anchored floating surface used by sort/filter/group/columns triggers. |
| `Drawer` | Slide-in side panel used by the filter panel mode. |
| `Icon` | Named icon glyphs (`sort-asc`, `sort-desc`, `filter`, `group`, `columns`, `search`, `chevron-*`, `close`, `more`, `expand`, `collapse`). |

Each slot receives plain prop shapes — no special wrappers. See the reference adapters for the exact prop signatures.

## Why isn't this shipped as part of the library?

Pinning Fluent or MUI as peer dependencies would force every consumer to install them — even those who only want the native adapter. By keeping the adapters as copy-paste reference source:

- The published bundle stays tree-shakeable and dependency-free.
- You own the adapter file, so you can tweak styling/behavior freely.
- Upstream design-system bumps don't gate library releases.
