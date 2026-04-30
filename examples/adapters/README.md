# Reference adapters

These files are **not** shipped with `@techtrips/ui-controls`. Copy whichever one you want into your application, install the peer deps, and pass it to `DataGrid` via the `adapter` prop.

See [`docs/Adapters.md`](../../docs/Adapters.md) for full documentation, the `IDataGridAdapter` contract, and theme-pairing recommendations.

| File | Design system | Peer deps you need to install |
|---|---|---|
| `fluent-adapter.tsx` | Fluent UI v9 | `@fluentui/react-components`, `@fluentui/react-icons` |
| `mui-adapter.tsx` | MUI / Material UI | `@mui/material`, `@mui/icons-material`, `@emotion/react`, `@emotion/styled` |
| `material-like-adapter.tsx` + `material-like.css` | Material-styled CSS only | none |

```tsx
import { DataGrid } from "@techtrips/ui-controls";
import { fluentAdapter } from "./adapters/fluent-adapter";

<DataGrid items={items} columns={columns} itemKey="id" adapter={fluentAdapter} />;
```
