import {
	DATA_GRID_DISPATCH_ACTIONS,
	type IDataGridDispatchActions,
} from "./DataGrid.actions";
import { DataGridChangeKind, type IDataGridState } from "./DataGrid.types";

export interface IDataGridInitialStateProps {
	initialState?: Partial<IDataGridState>;
	defaultPageSize?: number;
}

export const getInitialDataGridState = (
	props?: IDataGridInitialStateProps,
): IDataGridState => {
	const initial = props?.initialState ?? {};
	return {
		sort: initial.sort ?? [],
		filters: initial.filters ?? [],
		search: initial.search ?? "",
		page: {
			index: initial.page?.index ?? 0,
			size: initial.page?.size ?? props?.defaultPageSize ?? 25,
			total: initial.page?.total,
		},
		groupBy: initial.groupBy ?? [],
		collapsedGroups: new Set(initial.collapsedGroups ?? []),
		selection: new Set(initial.selection ?? []),
		expandedRows: new Set(initial.expandedRows ?? []),
		hiddenColumns: new Set(initial.hiddenColumns ?? []),
		columnWidths: new Map(initial.columnWidths ?? []),
	};
};

export const dataGridReducer = (
	state: IDataGridState,
	action: IDataGridDispatchActions,
): IDataGridState => {
	switch (action.type) {
		case DATA_GRID_DISPATCH_ACTIONS.SET_SORT: {
			return { ...state, sort: action.data };
		}
		case DATA_GRID_DISPATCH_ACTIONS.SET_FILTERS: {
			return {
				...state,
				filters: action.data,
				page: { ...state.page, index: 0 },
			};
		}
		case DATA_GRID_DISPATCH_ACTIONS.SET_SEARCH: {
			return {
				...state,
				search: action.data,
				page: { ...state.page, index: 0 },
			};
		}
		case DATA_GRID_DISPATCH_ACTIONS.SET_PAGE: {
			return { ...state, page: { ...state.page, ...action.data } };
		}
		case DATA_GRID_DISPATCH_ACTIONS.SET_GROUP_BY: {
			return { ...state, groupBy: action.data };
		}
		case DATA_GRID_DISPATCH_ACTIONS.TOGGLE_GROUP: {
			const next = new Set(state.collapsedGroups);
			if (next.has(action.data)) next.delete(action.data);
			else next.add(action.data);
			return { ...state, collapsedGroups: next };
		}
		case DATA_GRID_DISPATCH_ACTIONS.SET_SELECTION: {
			return { ...state, selection: action.data };
		}
		case DATA_GRID_DISPATCH_ACTIONS.SET_EXPANDED_ROWS: {
			return { ...state, expandedRows: action.data };
		}
		case DATA_GRID_DISPATCH_ACTIONS.SET_HIDDEN_COLUMNS: {
			return { ...state, hiddenColumns: action.data };
		}
		case DATA_GRID_DISPATCH_ACTIONS.SET_COLUMN_WIDTH: {
			const next = new Map(state.columnWidths);
			if (action.data.width === undefined) next.delete(action.data.columnId);
			else next.set(action.data.columnId, action.data.width);
			return { ...state, columnWidths: next };
		}
		case DATA_GRID_DISPATCH_ACTIONS.RESET_COLUMN_WIDTHS: {
			return { ...state, columnWidths: new Map() };
		}
		case DATA_GRID_DISPATCH_ACTIONS.RESET: {
			return {
				...state,
				...action.data,
				collapsedGroups: action.data.collapsedGroups
					? new Set(action.data.collapsedGroups)
					: state.collapsedGroups,
				selection: action.data.selection
					? new Set(action.data.selection)
					: state.selection,
				expandedRows: action.data.expandedRows
					? new Set(action.data.expandedRows)
					: state.expandedRows,
				hiddenColumns: action.data.hiddenColumns
					? new Set(action.data.hiddenColumns)
					: state.hiddenColumns,
				columnWidths: action.data.columnWidths
					? new Map(action.data.columnWidths)
					: state.columnWidths,
			};
		}
		default: {
			throw new Error("Unhandled DataGrid action type");
		}
	}
};

export const ACTION_TO_CHANGE_KIND: Record<
	DATA_GRID_DISPATCH_ACTIONS,
	DataGridChangeKind
> = {
	[DATA_GRID_DISPATCH_ACTIONS.SET_SORT]: DataGridChangeKind.Sort,
	[DATA_GRID_DISPATCH_ACTIONS.SET_FILTERS]: DataGridChangeKind.Filter,
	[DATA_GRID_DISPATCH_ACTIONS.SET_SEARCH]: DataGridChangeKind.Search,
	[DATA_GRID_DISPATCH_ACTIONS.SET_PAGE]: DataGridChangeKind.Page,
	[DATA_GRID_DISPATCH_ACTIONS.SET_GROUP_BY]: DataGridChangeKind.Group,
	[DATA_GRID_DISPATCH_ACTIONS.TOGGLE_GROUP]: DataGridChangeKind.Group,
	[DATA_GRID_DISPATCH_ACTIONS.SET_SELECTION]: DataGridChangeKind.Selection,
	[DATA_GRID_DISPATCH_ACTIONS.SET_EXPANDED_ROWS]: DataGridChangeKind.Expansion,
	[DATA_GRID_DISPATCH_ACTIONS.SET_HIDDEN_COLUMNS]: DataGridChangeKind.Columns,
	[DATA_GRID_DISPATCH_ACTIONS.SET_COLUMN_WIDTH]: DataGridChangeKind.Columns,
	[DATA_GRID_DISPATCH_ACTIONS.RESET_COLUMN_WIDTHS]: DataGridChangeKind.Columns,
	[DATA_GRID_DISPATCH_ACTIONS.RESET]: DataGridChangeKind.Items,
};
