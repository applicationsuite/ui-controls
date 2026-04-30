import type { DataGridFilterOperator } from "../../DataGrid.types";

/**
 * Per-column filter configuration, read from `column.meta.filter`.
 *
 * @example
 * ```ts
 * // Low-cardinality enum — value list with checkboxes:
 * { id: "role", name: "Role", filterable: true,
 *   meta: { filter: { type: "checkbox",
 *     items: [
 *       { value: "junior", label: "Junior" },
 *       { value: "lead", label: "Lead" },
 *       { value: "manager", label: "Manager" },
 *     ] } } }
 *
 * // Free-text:
 * { id: "name", name: "Name", filterable: true,
 *   meta: { filter: { type: "text",
 *     operator: DataGridFilterOperator.Contains } } }
 *
 * // Numeric:
 * { id: "salary", name: "Salary", filterable: true,
 *   meta: { filter: { type: "number",
 *     operator: DataGridFilterOperator.GreaterThanOrEqual } } }
 * ```
 *
 * Server-side note: when `IFilterPluginOptions.serverSide` is `true` the
 * grid no longer filters in-memory and emits `onChange` so the host can
 * refetch. **For `type: "checkbox"` you should supply `items` explicitly**
 * — the default behaviour scans `ctx.rawItems` to derive distinct values,
 * which on a server-paged grid only sees the current page. Either provide
 * the full domain via `items`, or use `type: "text"` / `"number"` instead.
 */
export interface IFilterColumnMeta {
	/**
	 * Filter editor to render in the per-header popover and the filters
	 * drawer. Pick the one that matches the column's data shape:
	 *
	 * - `"text"` (default for string-ish columns): single text input. Pair
	 *   with `operator: Contains` / `StartsWith` / `Equals`.
	 * - `"number"`: numeric input. Pair with a comparison operator like
	 *   `GreaterThanOrEqual` or `Between`.
	 * - `"checkbox"`: multi-select list. Use only for low-cardinality enum
	 *   columns (status, role, category). Supply `items` for server-side
	 *   grids; for client-side it falls back to scanning `ctx.rawItems`.
	 * - `"date"`: reserved for future date-range editor.
	 */
	type?: "text" | "checkbox" | "number" | "date";

	/**
	 * Operator emitted in the resulting `IDataGridFilterDescriptor`. Defaults:
	 * `In` for `"checkbox"`, `Contains` for `"text"`, `Equals` for `"number"`.
	 * Override when your backend expects a different comparison.
	 */
	operator?: DataGridFilterOperator | string;

	/**
	 * Explicit option list for `type: "checkbox"`. **Required for
	 * server-side filtering** so the picker shows the full domain rather
	 * than just values found on the current page. Omit for client-side
	 * grids to auto-derive distinct values from items.
	 */
	items?: { value: unknown; label: string }[];
}

export interface IFilterPluginOptions {
	/** Show selected filters as removable tags in the toolbar. */
	showTags?: boolean;
	/** Show the per-column dropdown caret in headers. Default: true. */
	headerControls?: boolean;
	/**
	 * Render a "Filters" button in the toolbar that opens an overlay drawer
	 * listing every filterable column with Apply / Cancel buttons. Default: true.
	 */
	panel?: boolean;
	/**
	 * When true, the plugin does not filter items in-memory. The host is
	 * expected to listen to the grid's `onChange` event (or the controller's
	 * `state.filters`) and fetch matching data from the server.
	 *
	 * In server-side mode you should also configure each column's
	 * `meta.filter` carefully:
	 * - prefer `type: "text"` / `"number"` for high-cardinality fields,
	 * - for `type: "checkbox"` always supply `meta.filter.items` so the
	 *   picker isn't limited to values present on the current page.
	 */
	serverSide?: boolean;
}
