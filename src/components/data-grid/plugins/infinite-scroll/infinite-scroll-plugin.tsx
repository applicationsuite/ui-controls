import { useMemo, useRef } from "react";
import {
	DATA_GRID_PIPELINE_ORDER,
	type IDataGridContext,
	type IDataGridPlugin,
} from "../../DataGrid.plugin";
import { useInfiniteScrollLoader } from "./infinite-scroll-plugin.hooks";
import type {
	IInfiniteScrollPluginOptions,
	IInternalInfiniteScrollOptions,
} from "./infinite-scroll-plugin.types";
import {
	applyInfiniteScroll,
	getInfiniteScrollViewModel,
} from "./infinite-scroll-plugin.utils";

export type { IInfiniteScrollPluginOptions } from "./infinite-scroll-plugin.types";

function InfiniteScrollFooter<T>({
	ctx,
	options,
	loadingRef,
}: {
	ctx: IDataGridContext<T>;
	options: IInternalInfiniteScrollOptions;
	loadingRef: React.MutableRefObject<boolean>;
}) {
	const view = getInfiniteScrollViewModel(ctx, options);
	useInfiniteScrollLoader({ ctx, options, view, loadingRef });

	if (!view.hasMore) {
		return (
			<span className="dgv-footer-status" aria-live="polite">
				All {view.totalDataRows} rows loaded
			</span>
		);
	}

	return (
		<span className="dgv-footer-status" aria-live="polite">
			{options.loadingIndicator ?? (
				<>
					Loaded {view.loadedDataRows}
					{view.totalDataRows ? ` of ${view.totalDataRows}` : ""} — scroll for
					more
				</>
			)}
		</span>
	);
}

export function createInfiniteScrollPlugin<T>(
	options: IInfiniteScrollPluginOptions = {},
): IDataGridPlugin<T> {
	const opts: IInternalInfiniteScrollOptions = {
		...options,
		serverSide: options.serverSide ?? !!options.onLoadMore,
	};
	const loadingRef = { current: false } as React.MutableRefObject<boolean>;

	return {
		id: "infiniteScroll",
		order: DATA_GRID_PIPELINE_ORDER.Page,
		transform: (items, ctx) => applyInfiniteScroll(items, ctx, opts),
		Footer: ({ ctx }) => {
			const memoOpts = useMemo(() => opts, []);
			const ref = useRef(loadingRef.current);
			ref.current = loadingRef.current;
			return (
				<InfiniteScrollFooter
					ctx={ctx}
					options={memoOpts}
					loadingRef={loadingRef}
				/>
			);
		},
	};
}
