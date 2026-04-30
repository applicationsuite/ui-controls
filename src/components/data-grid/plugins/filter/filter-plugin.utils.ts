import {
	DataGridFilterOperator,
	type IDataGridColumn,
	type IDataGridFilterDescriptor,
} from "../../DataGrid.types";
import type { IDataGridContext } from "../../DataGrid.plugin";
import type {
	IFilterColumnMeta,
	IFilterPluginOptions,
} from "./filter-plugin.types";

/** Read filter-related metadata from a column's `meta.filter` slot. */
export const getFilterMeta = <T>(col: IDataGridColumn<T>): IFilterColumnMeta =>
	(col.meta?.filter as IFilterColumnMeta) ?? {};

const compareValue = (a: unknown, b: unknown): number => {
	if (a == null && b == null) return 0;
	if (a == null) return -1;
	if (b == null) return 1;
	if (typeof a === "number" && typeof b === "number") return a - b;
	return String(a).localeCompare(String(b));
};

/** Test a single filter descriptor against an item using the column's accessor. */
export const matchesFilter = <T>(
	item: T,
	filter: IDataGridFilterDescriptor,
	col: IDataGridColumn<T>,
): boolean => {
	const v = col.getValue
		? col.getValue(item)
		: col.field
			? item[col.field]
			: undefined;
	const values = filter.values;
	switch (filter.operator) {
		case DataGridFilterOperator.Equals:
			return v === values[0];
		case DataGridFilterOperator.NotEquals:
			return v !== values[0];
		case DataGridFilterOperator.In:
			return values.includes(v);
		case DataGridFilterOperator.NotIn:
			return !values.includes(v);
		case DataGridFilterOperator.Contains:
			return (
				v != null &&
				String(v).toLowerCase().includes(String(values[0]).toLowerCase())
			);
		case DataGridFilterOperator.StartsWith:
			return (
				v != null &&
				String(v).toLowerCase().startsWith(String(values[0]).toLowerCase())
			);
		case DataGridFilterOperator.EndsWith:
			return (
				v != null &&
				String(v).toLowerCase().endsWith(String(values[0]).toLowerCase())
			);
		case DataGridFilterOperator.GreaterThan:
			return compareValue(v, values[0]) > 0;
		case DataGridFilterOperator.GreaterThanOrEqual:
			return compareValue(v, values[0]) >= 0;
		case DataGridFilterOperator.LessThan:
			return compareValue(v, values[0]) < 0;
		case DataGridFilterOperator.LessThanOrEqual:
			return compareValue(v, values[0]) <= 0;
		case DataGridFilterOperator.Between:
			return compareValue(v, values[0]) >= 0 && compareValue(v, values[1]) <= 0;
		case DataGridFilterOperator.IsEmpty:
			return v == null || v === "";
		case DataGridFilterOperator.IsNotEmpty:
			return v != null && v !== "";
		default:
			return values.length === 0 ? true : values.includes(v);
	}
};

/** Apply all active filters in `ctx.state.filters` to `items`. */
export function applyFilters<T>(
	items: readonly T[],
	ctx: IDataGridContext<T>,
	options: IFilterPluginOptions,
): readonly T[] {
	if (options.serverSide) return items;
	if (!ctx.state.filters.length) return items;
	const colMap = new Map(ctx.columns.map((c) => [c.id, c]));
	return items.filter((it) =>
		ctx.state.filters.every((f) => {
			const col = colMap.get(f.columnId);
			return col ? matchesFilter(it, f, col) : true;
		}),
	);
}

/**
 * Build the list of `IDataGridFilterDescriptor`s to commit when the drawer is
 * applied. Empty drafts are skipped.
 */
export function buildFilterDescriptors<T>(
	filterable: readonly IDataGridColumn<T>[],
	drafts: ReadonlyMap<string, unknown[]>,
): IDataGridFilterDescriptor[] {
	const next: IDataGridFilterDescriptor[] = [];
	for (const col of filterable) {
		const values = drafts.get(col.id);
		if (!values || values.length === 0) continue;
		const meta = getFilterMeta(col);
		next.push({
			columnId: col.id,
			operator: meta.operator ?? DataGridFilterOperator.In,
			values,
		});
	}
	return next;
}
