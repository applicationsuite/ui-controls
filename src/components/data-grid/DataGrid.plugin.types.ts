import type * as React from "react";
import type { IDataGridActions } from "./DataGrid.actions.types";
import type { IDataGridColumn, IDataGridState } from "./DataGrid.types";

export interface IDataGridContext<T = unknown> {
	state: IDataGridState;
	actions: IDataGridActions;
	rawItems: readonly T[];
	/**
	 * Columns currently visible (hidden columns excluded). Plugins should
	 * use this when iterating columns for rendering or pipeline work.
	 */
	columns: readonly IDataGridColumn<T>[];
	/**
	 * The complete list of columns the consumer passed in, including those
	 * hidden via the column-visibility plugin. Use this when building UIs
	 * that need to operate on columns regardless of visibility (e.g. the
	 * column-visibility picker itself).
	 */
	allColumns: readonly IDataGridColumn<T>[];
	/** Items after the full pipeline has run, before the current plugin. */
	processedItems: readonly T[];
	getRowKey: (item: T, index: number) => string | number;
	/** Ref to the grid's scroll container. Useful for scroll-driven plugins. */
	scrollRef: React.RefObject<HTMLDivElement | null>;
	/**
	 * Snapshot of items at every pipeline stage. Keys are `pre:<pluginId>`
	 * (input to that plugin) and `post:<pluginId>` (output). Plugins should
	 * use this when their Footer/Toolbar needs items from before/after a
	 * different plugin in the chain (e.g. pagination needs pre-paged total).
	 */
	pipelineStages: ReadonlyMap<string, readonly T[]>;
}

export interface IDataGridPlugin<T = unknown> {
	id: string;

	/** Pipeline transform; runs in `order` ascending. */
	transform?: (items: readonly T[], ctx: IDataGridContext<T>) => readonly T[];
	order?: number;

	/** Renders into the toolbar slot above the table. */
	Toolbar?: React.ComponentType<{ ctx: IDataGridContext<T> }>;

	/** Renders into a row directly below the toolbar (above the table). */
	SubToolbar?: React.ComponentType<{ ctx: IDataGridContext<T> }>;

	/** Wraps each header cell so plugins can add chevrons / menus. */
	HeaderCell?: React.ComponentType<{
		column: IDataGridColumn<T>;
		ctx: IDataGridContext<T>;
		children: React.ReactNode;
	}>;

	/** Renders into the footer slot below the table. */
	Footer?: React.ComponentType<{ ctx: IDataGridContext<T> }>;

	/**
	 * Optional override for body row rendering. The plugin receives the full
	 * post-pipeline row list (including any group sentinels) plus a
	 * `renderRow` callback that returns the JSX for a single row. The plugin
	 * is responsible for returning the rendered `<tr>` nodes — typically by
	 * mapping `renderRow` over a slice and surrounding it with spacer rows.
	 *
	 * Used by the virtual-scroll plugin to window the DOM for large
	 * datasets. If multiple plugins define `RowRenderer`, the first one in
	 * the `plugins` array wins.
	 */
	RowRenderer?: React.ComponentType<{
		ctx: IDataGridContext<T>;
		items: readonly unknown[];
		colSpan: number;
		renderRow: (item: unknown, index: number) => React.ReactNode;
	}>;
}
