export interface IInfiniteScrollPluginOptions {
	/** How many rows to render at first. Defaults to current `page.size` or 25. */
	initialChunkSize?: number;
	/** How many rows to load each time the user nears the bottom. Defaults to {@link initialChunkSize}. */
	chunkSize?: number;
	/** Pixels-from-bottom that triggers loading the next chunk. Defaults to 200. */
	thresholdPx?: number;
	/**
	 * When true, the plugin does not slice items locally — it expects the
	 * host to append rows to `items` (and optionally update `page.total`)
	 * in response to {@link onLoadMore}. Auto-enabled when {@link onLoadMore}
	 * is provided.
	 */
	serverSide?: boolean;
	/**
	 * Called when more rows are needed. Required for server-side mode; when
	 * omitted the plugin falls back to client-side slicing.
	 */
	onLoadMore?: (info: {
		loaded: number;
		nextChunk: number;
	}) => void | Promise<void>;
	/** Whether more rows are available. Required for server-side mode. */
	hasMore?: boolean | ((loaded: number, total?: number) => boolean);
	/** Renders while a server fetch is in flight. */
	loadingIndicator?: React.ReactNode;
}

/** Internal representation: serverSide is required (resolved from options). */
export interface IInternalInfiniteScrollOptions
	extends IInfiniteScrollPluginOptions {
	serverSide: boolean;
}

export interface IInfiniteScrollViewModel {
	loadedDataRows: number;
	totalDataRows: number;
	hasMore: boolean;
	chunk: number;
	threshold: number;
}
