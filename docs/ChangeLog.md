# Change Log

All notable changes to `@techtrips/ui-controls` are documented here. The format follows [Keep a Changelog](https://keepachangelog.com/en/1.0.0/) and the project uses [Semantic Versioning](https://semver.org/).

---

## Version History

| Version | Date | Highlights |
|---------|------|------------|
| [0.1.1](#011--2026-05-01) | 2026-05-01 | Adapter source moved out of the bundle into `examples/adapters/`; per-control docs split into `docs/DataGrid.md`; new `docs/Adapters.md` guide |
| [0.1.0](#010--2026-05-01) | 2026-05-01 | Initial release: DataGrid with full plugin pipeline, column visibility, theming, and adapters |


---

## [0.1.1] — 2026-05-01

### Added

- **Per-control docs** — README now exposes a Components / Guides table that links out to dedicated pages. New [`docs/DataGrid.md`](DataGrid.md) holds the full DataGrid usage, default plugins, action-bar layout, column flags, and theming.
- **Adapters guide** — new [`docs/Adapters.md`](Adapters.md) documents the `IDataGridAdapter` slot contract and how to copy a reference adapter into your app.
- **Reference adapters folder** — `examples/adapters/` with `fluent-adapter.tsx`, `mui-adapter.tsx`, `material-like-adapter.tsx` (+ `material-like.css`) and a copy-paste README.

### Changed

- **Adapter source no longer ships in the bundle.** The Fluent / MUI / material-like adapters moved from `src/playground/adapters/` to top-level `examples/adapters/`, are excluded from `tsconfig.prod.json`, and are not listed in `package.json` `files` or `exports`. Consumers copy whichever adapter they want into their own app.
- Adapter example files import from the published package name (`@techtrips/ui-controls`) so they're paste-ready; the playground keeps working via a `tsconfig` path + `rspack.config` `resolve.alias`.

### Fixed

- _No fixes in this release._

---

## [0.1.0] — 2026-05-01

_Initial release._

### Added

- **DataGrid** — headless native-DOM data grid with an opt-in plugin pipeline (`filter → search → sort → group → page`).
- **Plugins:** `createSortPlugin`, `createFilterPlugin`, `createSearchPlugin`, `createGroupPlugin`, `createPaginationPlugin`, `createColumnVisibilityPlugin`.
- **Default plugins:** when `plugins` is omitted/empty the grid auto-injects `createSearchPlugin()` + `createColumnVisibilityPlugin()` so it's useful out of the box.
- **Default action-bar layout:** left = `status`, right = `sort`, `group`, `filter`, `columnVisibility`, `search`. Pager defaults to the footer's left/growing slot so rows-info pins left and nav buttons pin right.
- **Column flags:** `required` (always visible, rendered checked + disabled in the picker), `defaultVisible` (start hidden on first mount), `hideable` (omit from picker), plus `sortable`, `filterable`, `searchable`, `groupable`.
- **Selection:** `DataGridSelectionMode.None | Single | Multi`.
- **Row detail:** `renderRowDetail` adds a per-row expand chevron and detail panel.
- **Server modes** for search, filter, sort, group, and pagination (including infinite scroll).
- **State APIs:** `useDataGridInit` hook, `DataGridActions` class, `dataGridReducer`, full `IDataGrid*` model surface, `onChange` change-stream.
- **Adapters:** native (default, zero deps), `material-like`, `fluent`, `mui`.
- **Themes:** `light`, `dark`, `auto` (prefers-color-scheme), `fluent` (live-reads `<FluentProvider>`), `material` (live-reads `CssVarsProvider`), or any custom `[data-dgv-theme="..."]` palette via `--dgv-*` CSS variables.
- **UX polish:** themed native scrollbars (WebKit + Firefox), responsive toolbar/footer (stacks under 768px, icon-only action buttons under 480px), custom-painted checkboxes/selects, group-by icon button with active-groups popover, master "Show all / Hide all" row in the column picker.
- **Playground app** with toggleable plugins, adapter/theme switcher, and a live change-event log.
