import type { IDataGridColumn } from "../../DataGrid.types";

export interface IColumnVisibilityPluginOptions<T = unknown> {
	/** Toolbar button label. Default: "Columns". */
	buttonLabel?: string;
	/**
	 * Filter which columns appear in the picker. By default any column with
	 * `hideable !== false` is listed.
	 */
	includeColumn?: (col: IDataGridColumn<T>) => boolean;
}
