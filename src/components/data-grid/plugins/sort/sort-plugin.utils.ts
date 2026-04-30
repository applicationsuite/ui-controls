import {
	DataGridSortDirection,
	type IDataGridColumn,
	type IDataGridSortDescriptor,
} from "../../DataGrid.types";

/**
 * Default value comparator. Uses `column.compare` when provided; otherwise
 * compares by `getValue` / `field` with sensible behaviour for nulls,
 * numbers, dates, and strings.
 */
export const defaultCompare = <T>(
	a: T,
	b: T,
	col: IDataGridColumn<T>,
): number => {
	if (col.compare) return col.compare(a, b);
	const av = col.getValue ? col.getValue(a) : col.field ? a[col.field] : a;
	const bv = col.getValue ? col.getValue(b) : col.field ? b[col.field] : b;
	if (av == null && bv == null) return 0;
	if (av == null) return -1;
	if (bv == null) return 1;
	if (typeof av === "number" && typeof bv === "number") return av - bv;
	if (av instanceof Date && bv instanceof Date) {
		return av.getTime() - bv.getTime();
	}
	return String(av).localeCompare(String(bv));
};

/**
 * Sort items according to a multi-level sort descriptor list. Returns a new
 * array; does not mutate the input.
 */
export function applySort<T>(
	items: readonly T[],
	sort: readonly IDataGridSortDescriptor[],
	columns: readonly IDataGridColumn<T>[],
): readonly T[] {
	if (!sort.length) return items;
	const colMap = new Map(columns.map((c) => [c.id, c]));
	const arr = [...items];
	arr.sort((a, b) => {
		for (const s of sort) {
			const col = colMap.get(s.columnId);
			if (!col) continue;
			const cmp = defaultCompare(a, b, col);
			if (cmp !== 0) {
				return s.direction === DataGridSortDirection.Asc ? cmp : -cmp;
			}
		}
		return 0;
	});
	return arr;
}

/**
 * Pick the icon name for a column header given the active sort descriptor.
 */
export function sortIconName(
	sort: IDataGridSortDescriptor | undefined,
): "sort-none" | "sort-asc" | "sort-desc" {
	if (!sort) return "sort-none";
	return sort.direction === DataGridSortDirection.Asc
		? "sort-asc"
		: "sort-desc";
}

/** ARIA `aria-sort` value for a header cell. */
export function ariaSortValue(
	sort: IDataGridSortDescriptor | undefined,
): "ascending" | "descending" | "none" {
	if (!sort) return "none";
	return sort.direction === DataGridSortDirection.Asc
		? "ascending"
		: "descending";
}
