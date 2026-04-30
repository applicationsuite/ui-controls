import type { IDataGridColumn } from "../../DataGrid.types";

/** Sentinel row inserted between leaf data rows to render a group header. */
export interface IGroupSentinel {
	__dgv_group__: true;
	key: string;
	label: string;
	level: number;
	count: number;
	collapsed: boolean;
}

export interface IGroupPluginOptions<T = unknown> {
	getLabel?: (value: unknown, items: T[], col: IDataGridColumn<T>) => string;
	/** Render a control in the toolbar to switch group columns. */
	showGroupBySelector?: boolean;
	/**
	 * When true, the plugin does not group items in-memory. The host is
	 * expected to return pre-grouped data from the server. Group sentinel
	 * rows in `items` will still be rendered as group headers.
	 */
	serverSide?: boolean;
}
