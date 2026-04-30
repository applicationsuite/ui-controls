# @techtrips/ui-controls

![version](https://img.shields.io/badge/version-0.1.0-blue)

A React composite UI controls library. Headless core with opt-in plugins so each big feature stays tree-shakeable and the bundle stays small.

> **Design policy:** zero UI-framework dependencies. Components are built on native HTML elements and themed via `--dgv-*` CSS variables so consumers can skin them with Fluent, Material, Tailwind, or plain CSS without conflicts. `react` / `react-dom` are peer dependencies.

## Installation

```bash
npm install --save @techtrips/ui-controls@latest
```

## Components

Each control has its own dedicated docs page in [`docs/`](docs/).

| Control | Description | Docs |
|---|---|---|
| `DataGrid` | Headless native-DOM data grid with an opt-in plugin pipeline (filter, search, sort, group, column visibility, pagination), themeable via CSS variables, and pluggable adapters for Fluent / MUI / custom design systems. | [docs/DataGrid.md](docs/DataGrid.md) |

## Guides

| Topic | Docs |
|---|---|
| Custom adapters (Fluent, MUI, material-like) | [docs/Adapters.md](docs/Adapters.md) |
| Release notes | [docs/ChangeLog.md](docs/ChangeLog.md) |

## Release Notes

See the full [change log](docs/ChangeLog.md).

## Code Repository

https://github.com/techtrips/ui-controls/

## Authors and Contributors

Initially developed and maintained by Chinmaya Kumar Panda.

Contributions welcome — please [contact us](mailto:visit.chinmaya@gmail.com).
