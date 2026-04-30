import { useCallback, useEffect } from "react";
import type { IDataGridContext } from "../../DataGrid.plugin";
import type {
	IInfiniteScrollViewModel,
	IInternalInfiniteScrollOptions,
} from "./infinite-scroll-plugin.types";

/**
 * Hook that wires the grid scroll container to a load-more handler. Memoises
 * the loader, attaches a scroll listener, and detaches on unmount.
 */
export function useInfiniteScrollLoader<T>(args: {
	ctx: IDataGridContext<T>;
	options: IInternalInfiniteScrollOptions;
	view: IInfiniteScrollViewModel;
	loadingRef: React.MutableRefObject<boolean>;
}): void {
	const { ctx, options, view, loadingRef } = args;
	const { actions, scrollRef, state } = ctx;
	const { hasMore, loadedDataRows, chunk, threshold } = view;

	const loadMore = useCallback(async () => {
		if (loadingRef.current || !hasMore) return;
		loadingRef.current = true;
		try {
			if (options.onLoadMore) {
				await options.onLoadMore({
					loaded: loadedDataRows,
					nextChunk: chunk,
				});
			} else {
				actions.setPage({ size: state.page.size + chunk, index: 0 });
			}
		} finally {
			loadingRef.current = false;
		}
	}, [
		actions,
		chunk,
		hasMore,
		loadedDataRows,
		loadingRef,
		options,
		state.page.size,
	]);

	useEffect(() => {
		const el = scrollRef.current;
		if (!el) return;
		const onScroll = () => {
			if (el.scrollTop + el.clientHeight >= el.scrollHeight - threshold) {
				void loadMore();
			}
		};
		el.addEventListener("scroll", onScroll, { passive: true });
		return () => el.removeEventListener("scroll", onScroll);
	}, [scrollRef, loadMore, threshold]);
}
