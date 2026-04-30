import type { IDataGridContext } from "../../DataGrid.plugin";
import type { ISearchPluginOptions } from "./search-plugin.types";

/**
 * Filter `items` by the active search string in `ctx.state.search`. Returns
 * the input array unchanged when the query is empty or `serverSide` is true.
 */
export function applySearch<T>(
	items: readonly T[],
	ctx: IDataGridContext<T>,
	options: ISearchPluginOptions,
): readonly T[] {
	if (options.serverSide) return items;
	const q = ctx.state.search.trim().toLowerCase();
	if (!q) return items;
	if (options.match) {
		return items.filter((it) => options.match!(it, q));
	}
	const fieldIds = options.fields
		? new Set(options.fields)
		: new Set(
				ctx.columns
					.filter((c) => c.searchable !== false && (c.field || c.getValue))
					.map((c) => c.id),
			);
	const cols = ctx.columns.filter((c) => fieldIds.has(c.id));
	return items.filter((it) =>
		cols.some((c) => {
			const v = c.getValue ? c.getValue(it) : c.field ? it[c.field] : "";
			return v != null && String(v).toLowerCase().includes(q);
		}),
	);
}
