import type {
	IDataGridFilterDescriptor,
	IDataGridPageDescriptor,
	IDataGridSortDescriptor,
	IDataGridState,
} from "./DataGrid.types";
import type { DATA_GRID_DISPATCH_ACTIONS } from "./DataGrid.actions";

/** Discriminated union dispatched from `DataGridActions` to the reducer. */
export type IDataGridDispatchActions =
	| {
			type: DATA_GRID_DISPATCH_ACTIONS.SET_SORT;
			data: IDataGridSortDescriptor[];
	  }
	| {
			type: DATA_GRID_DISPATCH_ACTIONS.SET_FILTERS;
			data: IDataGridFilterDescriptor[];
	  }
	| { type: DATA_GRID_DISPATCH_ACTIONS.SET_SEARCH; data: string }
	| {
			type: DATA_GRID_DISPATCH_ACTIONS.SET_PAGE;
			data: Partial<IDataGridPageDescriptor>;
	  }
	| { type: DATA_GRID_DISPATCH_ACTIONS.SET_GROUP_BY; data: string[] }
	| { type: DATA_GRID_DISPATCH_ACTIONS.TOGGLE_GROUP; data: string }
	| {
			type: DATA_GRID_DISPATCH_ACTIONS.SET_SELECTION;
			data: Set<string | number>;
	  }
	| {
			type: DATA_GRID_DISPATCH_ACTIONS.SET_EXPANDED_ROWS;
			data: Set<string | number>;
	  }
	| {
			type: DATA_GRID_DISPATCH_ACTIONS.SET_HIDDEN_COLUMNS;
			data: Set<string>;
	  }
	| {
			type: DATA_GRID_DISPATCH_ACTIONS.SET_COLUMN_WIDTH;
			data: { columnId: string; width: number | undefined };
	  }
	| {
			type: DATA_GRID_DISPATCH_ACTIONS.RESET_COLUMN_WIDTHS;
	  }
	| {
			type: DATA_GRID_DISPATCH_ACTIONS.RESET;
			data: Partial<IDataGridState>;
	  };

/** Public action-creator surface exposed via `DataGrid` context. */
export interface IDataGridActions {
	setSort: (sort: IDataGridSortDescriptor[]) => void;
	toggleSort: (columnId: string, multi?: boolean) => void;
	setFilters: (filters: IDataGridFilterDescriptor[]) => void;
	upsertFilter: (filter: IDataGridFilterDescriptor) => void;
	clearFilter: (columnId: string) => void;
	setSearch: (search: string) => void;
	setPage: (page: Partial<IDataGridPageDescriptor>) => void;
	setGroupBy: (groupBy: string[]) => void;
	toggleGroup: (key: string) => void;
	setSelection: (selection: Set<string | number>) => void;
	toggleRowSelection: (key: string | number, mode: "single" | "multi") => void;
	setExpandedRows: (expanded: Set<string | number>) => void;
	toggleRowExpansion: (key: string | number) => void;
	setHiddenColumns: (hidden: Set<string>) => void;
	toggleColumnVisibility: (columnId: string) => void;
	setColumnWidth: (columnId: string, width: number | undefined) => void;
	resetColumnWidths: () => void;
	reset: (state: Partial<IDataGridState>) => void;
}
