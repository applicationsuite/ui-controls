import type * as React from "react";

/* =====================================================================
 *  DataGrid models — runtime enums + the type contracts that describe
 *  the grid's data shape, columns, and observable state. Plugin-specific
 *  contracts (`IDataGridContext`, `IDataGridPlugin`) live in
 *  `DataGrid.plugin.types.ts`.
 * ===================================================================== */

/* ---------- Enums ---------- */

export enum DataGridSelectionMode {
	None = "none",
	Single = "single",
	Multi = "multi",
}

export enum DataGridSortDirection {
	Asc = "asc",
	Desc = "desc",
}

export enum DataGridFilterOperator {
	Equals = "equals",
	NotEquals = "notEquals",
	In = "in",
	NotIn = "notIn",
	Contains = "contains",
	StartsWith = "startsWith",
	EndsWith = "endsWith",
	GreaterThan = "gt",
	GreaterThanOrEqual = "gte",
	LessThan = "lt",
	LessThanOrEqual = "lte",
	Between = "between",
	IsEmpty = "isEmpty",
	IsNotEmpty = "isNotEmpty",
}

export enum DataGridChangeKind {
	Sort = "sort",
	Filter = "filter",
	Search = "search",
	Page = "page",
	Group = "group",
	Selection = "selection",
	Expansion = "expansion",
	Columns = "columns",
	Items = "items",
}

/* ---------- Descriptors ---------- */

export interface IDataGridSortDescriptor {
	columnId: string;
	direction: DataGridSortDirection;
}

export interface IDataGridFilterDescriptor {
	columnId: string;
	operator: DataGridFilterOperator | string;
	values: unknown[];
}

export interface IDataGridPageDescriptor {
	index: number; // zero-based
	size: number;
	total?: number;
}

export interface IDataGridGroupNode<T = unknown> {
	key: string;
	name: string;
	level: number;
	count: number;
	items: T[];
	children?: IDataGridGroupNode<T>[];
	collapsed?: boolean;
}

/* ---------- Column ---------- */

export interface IDataGridColumn<T = unknown> {
	id: string;
	name: string;
	field?: keyof T & string;

	width?: number | string;
	minWidth?: number;
	align?: "start" | "center" | "end";

	sortable?: boolean;
	filterable?: boolean;
	groupable?: boolean;
	searchable?: boolean;
	resizable?: boolean;
	/** Whether the column appears in the column-visibility picker. Default: true. */
	hideable?: boolean;

	/** Plugin-specific config bag, e.g. { filterType: "checkbox", items: [...] }. */
	meta?: Record<string, unknown>;

	getValue?: (item: T) => unknown;
	compare?: (a: T, b: T) => number;
	renderHeader?: (col: IDataGridColumn<T>) => React.ReactNode;
	renderCell?: (
		item: T,
		col: IDataGridColumn<T>,
		rowIndex: number,
	) => React.ReactNode;
}

/* ---------- State ---------- */

export interface IDataGridState {
	sort: IDataGridSortDescriptor[];
	filters: IDataGridFilterDescriptor[];
	search: string;
	page: IDataGridPageDescriptor;
	groupBy: string[];
	collapsedGroups: Set<string>;
	selection: Set<string | number>;
	/** Keys of rows currently expanded by the row-detail feature. */
	expandedRows: Set<string | number>;
	/** Column ids hidden via the column-visibility plugin. */
	hiddenColumns: Set<string>;
	/** Per-column override widths (px) set by the column-resize plugin. */
	columnWidths: Map<string, number>;
}

export interface IDataGridChange {
	kind: DataGridChangeKind;
	state: IDataGridState;
}
