import type * as React from "react";
import type {
	IDataGridActions,
	IDataGridDispatchActions,
} from "./DataGrid.actions.types";
import { DataGridSortDirection } from "./DataGrid.types";
import type {
	IDataGridFilterDescriptor,
	IDataGridPageDescriptor,
	IDataGridSortDescriptor,
	IDataGridState,
} from "./DataGrid.types";

export type {
	IDataGridActions,
	IDataGridDispatchActions,
} from "./DataGrid.actions.types";

/* ---------- Action types ---------- */

export enum DATA_GRID_DISPATCH_ACTIONS {
	SET_SORT = "DATA_GRID/SET_SORT",
	SET_FILTERS = "DATA_GRID/SET_FILTERS",
	SET_SEARCH = "DATA_GRID/SET_SEARCH",
	SET_PAGE = "DATA_GRID/SET_PAGE",
	SET_GROUP_BY = "DATA_GRID/SET_GROUP_BY",
	TOGGLE_GROUP = "DATA_GRID/TOGGLE_GROUP",
	SET_SELECTION = "DATA_GRID/SET_SELECTION",
	SET_EXPANDED_ROWS = "DATA_GRID/SET_EXPANDED_ROWS",
	SET_HIDDEN_COLUMNS = "DATA_GRID/SET_HIDDEN_COLUMNS",
	SET_COLUMN_WIDTH = "DATA_GRID/SET_COLUMN_WIDTH",
	RESET_COLUMN_WIDTHS = "DATA_GRID/RESET_COLUMN_WIDTHS",
	RESET = "DATA_GRID/RESET",
}

/* ---------- Action creators ---------- */

export class DataGridActions implements IDataGridActions {
	private dispatch: React.Dispatch<IDataGridDispatchActions>;
	private getState: () => IDataGridState;

	constructor(
		dispatch: React.Dispatch<IDataGridDispatchActions>,
		getState: () => IDataGridState,
	) {
		this.dispatch = dispatch;
		this.getState = getState;
	}

	setSort = (sort: IDataGridSortDescriptor[]) => {
		this.dispatch({ type: DATA_GRID_DISPATCH_ACTIONS.SET_SORT, data: sort });
	};

	toggleSort = (columnId: string, multi = false) => {
		const current = this.getState().sort;
		const existing = current.find((s) => s.columnId === columnId);
		let next: IDataGridSortDescriptor[];

		if (!existing) {
			const desc: IDataGridSortDescriptor = {
				columnId,
				direction: DataGridSortDirection.Asc,
			};
			next = multi ? [...current, desc] : [desc];
		} else if (existing.direction === DataGridSortDirection.Asc) {
			const flipped: IDataGridSortDescriptor = {
				columnId,
				direction: DataGridSortDirection.Desc,
			};
			next = multi
				? current.map((s) => (s.columnId === columnId ? flipped : s))
				: [flipped];
		} else {
			next = multi ? current.filter((s) => s.columnId !== columnId) : [];
		}
		this.setSort(next);
	};

	setFilters = (filters: IDataGridFilterDescriptor[]) => {
		this.dispatch({
			type: DATA_GRID_DISPATCH_ACTIONS.SET_FILTERS,
			data: filters,
		});
	};

	upsertFilter = (filter: IDataGridFilterDescriptor) => {
		const current = this.getState().filters;
		const idx = current.findIndex((f) => f.columnId === filter.columnId);
		const isEmpty =
			!filter.values ||
			filter.values.length === 0 ||
			filter.values.every((v) => v === undefined || v === null || v === "");

		let next: IDataGridFilterDescriptor[];
		if (isEmpty) {
			next = current.filter((f) => f.columnId !== filter.columnId);
		} else if (idx >= 0) {
			next = current.map((f, i) => (i === idx ? filter : f));
		} else {
			next = [...current, filter];
		}
		this.setFilters(next);
	};

	clearFilter = (columnId: string) => {
		this.setFilters(
			this.getState().filters.filter((f) => f.columnId !== columnId),
		);
	};

	setSearch = (search: string) => {
		this.dispatch({
			type: DATA_GRID_DISPATCH_ACTIONS.SET_SEARCH,
			data: search,
		});
	};

	setPage = (page: Partial<IDataGridPageDescriptor>) => {
		this.dispatch({ type: DATA_GRID_DISPATCH_ACTIONS.SET_PAGE, data: page });
	};

	setGroupBy = (groupBy: string[]) => {
		this.dispatch({
			type: DATA_GRID_DISPATCH_ACTIONS.SET_GROUP_BY,
			data: groupBy,
		});
	};

	toggleGroup = (key: string) => {
		this.dispatch({
			type: DATA_GRID_DISPATCH_ACTIONS.TOGGLE_GROUP,
			data: key,
		});
	};

	setSelection = (selection: Set<string | number>) => {
		this.dispatch({
			type: DATA_GRID_DISPATCH_ACTIONS.SET_SELECTION,
			data: selection,
		});
	};

	toggleRowSelection = (key: string | number, mode: "single" | "multi") => {
		const current = this.getState().selection;
		let next: Set<string | number>;
		if (mode === "single") {
			next = current.has(key) ? new Set() : new Set([key]);
		} else {
			next = new Set(current);
			if (next.has(key)) next.delete(key);
			else next.add(key);
		}
		this.setSelection(next);
	};

	setExpandedRows = (expanded: Set<string | number>) => {
		this.dispatch({
			type: DATA_GRID_DISPATCH_ACTIONS.SET_EXPANDED_ROWS,
			data: expanded,
		});
	};

	toggleRowExpansion = (key: string | number) => {
		const current = this.getState().expandedRows;
		const next = new Set(current);
		if (next.has(key)) next.delete(key);
		else next.add(key);
		this.setExpandedRows(next);
	};

	setHiddenColumns = (hidden: Set<string>) => {
		this.dispatch({
			type: DATA_GRID_DISPATCH_ACTIONS.SET_HIDDEN_COLUMNS,
			data: hidden,
		});
	};

	toggleColumnVisibility = (columnId: string) => {
		const current = this.getState().hiddenColumns;
		const next = new Set(current);
		if (next.has(columnId)) next.delete(columnId);
		else next.add(columnId);
		this.setHiddenColumns(next);
	};

	setColumnWidth = (columnId: string, width: number | undefined) => {
		this.dispatch({
			type: DATA_GRID_DISPATCH_ACTIONS.SET_COLUMN_WIDTH,
			data: { columnId, width },
		});
	};

	resetColumnWidths = () => {
		this.dispatch({
			type: DATA_GRID_DISPATCH_ACTIONS.RESET_COLUMN_WIDTHS,
		});
	};

	reset = (state: Partial<IDataGridState>) => {
		this.dispatch({ type: DATA_GRID_DISPATCH_ACTIONS.RESET, data: state });
	};
}
