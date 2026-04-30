import type { IDataGridColumn } from "./DataGrid.types";
import type { IDataGridPlugin } from "./DataGrid.plugin";

/**
 * Marker key produced by the group plugin on synthetic rows.
 * A row whose `__dgv_group__` is true represents a group header, not a data
 * record. Re-exported from `DataGrid.tsx` for plugin authors.
 */
export const DATA_GRID_GROUP_ROW_KEY = "__dgv_group__";

export const SELECT_COL_KEY = "__dgv_select__";

export interface IDataGridGroupSentinel {
	__dgv_group__: true;
	key: string;
	label: string;
	level: number;
	count: number;
	collapsed: boolean;
}

/** Type guard for group sentinel rows produced by the group plugin. */
export function isGroupRow(item: unknown): item is IDataGridGroupSentinel {
	return (
		!!item &&
		typeof item === "object" &&
		(item as { __dgv_group__?: boolean }).__dgv_group__ === true
	);
}

/**
 * Build a stable row key resolver. Falls back to the row index when neither
 * `getRowKey` nor `itemKey` is provided.
 */
export function buildRowKeyResolver<T>(
	getRowKey: ((item: T, index: number) => string | number) | undefined,
	itemKey: (keyof T & string) | undefined,
) {
	return (item: T, index: number): string | number => {
		if (getRowKey) return getRowKey(item, index);
		if (itemKey) {
			const v = item[itemKey] as unknown;
			if (typeof v === "string" || typeof v === "number") return v;
		}
		return index;
	};
}

/**
 * Render the inner content of a column header by composing every plugin's
 * `HeaderCell` slot. Pure function; the caller supplies the JSX wrapper.
 */
export function renderColumnCell<T>(
	item: T,
	col: IDataGridColumn<T>,
	rowIndex: number,
): React.ReactNode {
	if (col.renderCell) return col.renderCell(item, col, rowIndex);
	if (col.getValue) return String(col.getValue(item) ?? "");
	if (col.field) return String(item[col.field] ?? "");
	return "";
}

/**
 * Split toolbar / footer plugins into left and right groups according to the
 * caller's order spec. A bare `string[]` puts everything on the left in that
 * order; an object lets each side be ordered independently. Plugins not named
 * in the spec are appended to the left side in plugin-array order.
 */
export function splitSlotPlugins<T>(
	list: IDataGridPlugin<T>[],
	order: string[] | { left?: string[]; right?: string[] } | undefined,
): { left: IDataGridPlugin<T>[]; right: IDataGridPlugin<T>[] } {
	const byId = new Map(list.map((p) => [p.id, p]));
	const seen = new Set<string>();
	const pick = (ids: string[] | undefined): IDataGridPlugin<T>[] => {
		if (!ids) return [];
		const out: IDataGridPlugin<T>[] = [];
		for (const id of ids) {
			const p = byId.get(id);
			if (p && !seen.has(id)) {
				out.push(p);
				seen.add(id);
			}
		}
		return out;
	};

	let left: IDataGridPlugin<T>[];
	let right: IDataGridPlugin<T>[];
	if (Array.isArray(order)) {
		left = pick(order);
		right = [];
	} else if (order) {
		left = pick(order.left);
		right = pick(order.right);
	} else {
		// Default placement: the "status" plugin (e.g. "Showing 1–25 of N")
		// and "pagination" plugin go on the left; everything else goes on
		// the right. On the right we apply a sensible default order so
		// filter/group sit before the search box, regardless of plugin
		// registration order. The pager goes left because the left group
		// is the flex-growing one — that lets the pager span the footer
		// width with its rows-info on the start and nav buttons on the end.
		left = pick(["status", "pagination"]);
		const RIGHT_DEFAULT = [
			"sort",
			"group",
			"filter",
			"columnVisibility",
			"search",
		];
		right = pick(RIGHT_DEFAULT);
		for (const p of list) {
			if (!seen.has(p.id)) {
				right.push(p);
				seen.add(p.id);
			}
		}
		return { left, right };
	}

	for (const p of list) {
		if (!seen.has(p.id)) left.push(p);
	}
	return { left, right };
}
