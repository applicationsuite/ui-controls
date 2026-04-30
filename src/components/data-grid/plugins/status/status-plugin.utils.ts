import type { IDataGridContext } from "../../DataGrid.plugin";
import type { IStatusCounts } from "./status-plugin.types";

const isGroupSentinel = (r: unknown): boolean =>
	!!r &&
	typeof r === "object" &&
	(r as { __dgv_group__?: boolean }).__dgv_group__ === true;

/** Compute total / filtered / visible row counts and the visible row range. */
export function getStatusCounts<T>(ctx: IDataGridContext<T>): IStatusCounts {
	const stripGroups = (arr: readonly T[]) =>
		arr.filter((r) => !isGroupSentinel(r));

	const total = ctx.rawItems.length;
	const prePaged =
		ctx.pipelineStages.get("pre:pagination") ?? ctx.processedItems;
	const filtered = stripGroups(prePaged).length;
	const visibleRows = stripGroups(ctx.processedItems);
	const visible = visibleRows.length;

	const isPaged = ctx.pipelineStages.has("pre:pagination");
	const isFiltered = filtered < total;

	let rangeStart = 0;
	let rangeEnd = 0;
	if (visible > 0) {
		if (isPaged) {
			const { page } = ctx.state;
			const size = page.size || visible;
			rangeStart = page.index * size + 1;
			rangeEnd = rangeStart + visible - 1;
		} else {
			rangeStart = 1;
			rangeEnd = visible;
		}
	}

	return {
		total,
		filtered,
		visible,
		rangeStart,
		rangeEnd,
		isFiltered,
		isPaged,
	};
}

/** Default human-readable status message. */
export function defaultStatusMessage(c: IStatusCounts): React.ReactNode {
	if (c.total === 0) return "No records";
	if (c.isPaged) {
		return c.isFiltered
			? `Showing ${c.rangeStart}–${c.rangeEnd} of ${c.filtered} (filtered from ${c.total})`
			: `Showing ${c.rangeStart}–${c.rangeEnd} of ${c.total}`;
	}
	return c.isFiltered
		? `${c.filtered} of ${c.total} records`
		: `${c.total} records`;
}
