import type { IDataGridContext } from "../../DataGrid.plugin";
import type {
	IInfiniteScrollViewModel,
	IInternalInfiniteScrollOptions,
} from "./infinite-scroll-plugin.types";

interface IGroupSentinel {
	__dgv_group__?: boolean;
}

const isGroupRow = (r: unknown): boolean =>
	!!(r && typeof r === "object" && (r as IGroupSentinel).__dgv_group__);

const countDataRows = (rows: readonly unknown[]): number =>
	rows.filter((r) => !isGroupRow(r)).length;

/** Slice items client-side up to the visible chunk size. */
export function applyInfiniteScroll<T>(
	items: readonly T[],
	ctx: IDataGridContext<T>,
	options: IInternalInfiniteScrollOptions,
): readonly T[] {
	if (options.serverSide) return items;
	const initial = options.initialChunkSize ?? ctx.state.page.size;
	const visible = Math.max(initial, ctx.state.page.size);
	return items.slice(0, visible);
}

/** Compute the values a footer needs to display + drive scroll loading. */
export function getInfiniteScrollViewModel<T>(
	ctx: IDataGridContext<T>,
	options: IInternalInfiniteScrollOptions,
): IInfiniteScrollViewModel {
	const { state, pipelineStages, processedItems } = ctx;
	const chunk =
		options.chunkSize ?? options.initialChunkSize ?? state.page.size;
	const threshold = options.thresholdPx ?? 200;
	const prePaged = pipelineStages.get("pre:infiniteScroll") ?? processedItems;
	const totalDataRows = options.serverSide
		? (state.page.total ?? 0)
		: countDataRows(prePaged);
	const loadedDataRows = countDataRows(processedItems);
	const hasMore =
		typeof options.hasMore === "function"
			? options.hasMore(loadedDataRows, state.page.total)
			: options.hasMore !== undefined
				? options.hasMore
				: loadedDataRows < totalDataRows;
	return { loadedDataRows, totalDataRows, hasMore, chunk, threshold };
}
