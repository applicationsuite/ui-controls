import type { IDataGridColumn } from "../../DataGrid.types";
import type { IDataGridContext } from "../../DataGrid.plugin";
import type { IGroupPluginOptions, IGroupSentinel } from "./group-plugin.types";

/** Bucket items by a single column. */
export function groupByColumn<T>(
	items: readonly T[],
	col: IDataGridColumn<T>,
	level: number,
	getLabel?: (value: unknown, items: T[]) => string,
): { key: string; label: string; items: T[] }[] {
	const buckets = new Map<string, { value: unknown; items: T[] }>();
	for (const it of items) {
		const v = col.getValue
			? col.getValue(it)
			: col.field
				? it[col.field]
				: undefined;
		const key = `${col.id}:${String(v)}`;
		const bucket = buckets.get(key);
		if (bucket) bucket.items.push(it);
		else buckets.set(key, { value: v, items: [it] });
	}
	return [...buckets.entries()].map(([key, b]) => ({
		key: `${level}|${key}`,
		label: getLabel
			? getLabel(b.value, b.items)
			: `${col.name}: ${String(b.value)}`,
		items: b.items,
	}));
}

/**
 * Build the flat row list (interleaving group sentinel rows with leaf items)
 * for the active groupBy state. Returns `items` unchanged when no group
 * columns are active or when running server-side.
 */
export function applyGrouping<T>(
	items: readonly T[],
	ctx: IDataGridContext<T>,
	options: IGroupPluginOptions<T>,
): readonly T[] {
	if (options.serverSide) return items;
	const { groupBy: groupCols, collapsedGroups } = ctx.state;
	if (!groupCols.length) return items;
	const colMap = new Map(ctx.columns.map((c) => [c.id, c]));

	const build = (
		rows: readonly T[],
		levels: string[],
		level: number,
	): unknown[] => {
		if (!levels.length) return [...rows];
		const [head, ...rest] = levels;
		const col = colMap.get(head);
		if (!col) return [...rows];
		const groups = groupByColumn(
			rows,
			col,
			level,
			options.getLabel ? (v, its) => options.getLabel!(v, its, col) : undefined,
		);
		const out: unknown[] = [];
		for (const g of groups) {
			const collapsed = collapsedGroups.has(g.key);
			const sentinel: IGroupSentinel = {
				__dgv_group__: true,
				key: g.key,
				label: g.label,
				level,
				count: g.items.length,
				collapsed,
			};
			out.push(sentinel);
			if (!collapsed) out.push(...build(g.items, rest, level + 1));
		}
		return out;
	};

	return build(items, groupCols, 0) as readonly T[];
}
