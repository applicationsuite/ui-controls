export interface IVirtualScrollApi {
	/**
	 * Scroll the grid so the row at `index` is visible. `align` controls
	 * where in the viewport the row lands (default: `"auto"` — only scrolls
	 * if the row is currently out of view).
	 */
	scrollToIndex(
		index: number,
		options?: {
			align?: "start" | "center" | "end" | "auto";
			behavior?: ScrollBehavior;
		},
	): void;

	/**
	 * Reset the measured-height cache. Call this when row content changes
	 * shape in a way the plugin can't observe (e.g. switching `renderRowDetail`
	 * on the same items, or replacing all rows with rows of a new column set).
	 */
	resetMeasurements(): void;
}

export interface IVirtualScrollPluginOptions {
	/**
	 * Initial guess for row height (px), used until each row is measured.
	 * When omitted, the plugin reads `data-dgv-density` from the grid root
	 * and picks `28` (compact), `36` (comfortable) or `44` (spacious).
	 */
	estimatedRowHeight?: number;

	/**
	 * @deprecated Use `estimatedRowHeight`. Accepted for back-compat; the
	 * plugin now measures every rendered row via `ResizeObserver`, so this
	 * value is treated as the initial estimate only.
	 */
	rowHeight?: number;

	/**
	 * Number of extra rows to render above and below the viewport. Higher
	 * values reduce blank flashes during fast scroll at the cost of more
	 * mounted DOM. Default: 6.
	 */
	overscan?: number;

	/**
	 * Disable the plugin programmatically. Body rendering falls back to the
	 * default (all rows mounted) when `false`. Useful for toggling based on
	 * `items.length` (e.g. only virtualize once you cross 200 rows).
	 */
	enabled?: boolean;

	/**
	 * Imperative API handle. Pass a ref-like object; the plugin populates
	 * `apiRef.current` with `{ scrollToIndex, resetMeasurements }` while it
	 * is mounted and clears it on unmount.
	 */
	apiRef?: { current: IVirtualScrollApi | null };
}

export interface IInternalVirtualScrollOptions {
	/** `"auto"` means derive from `data-dgv-density` at mount time. */
	estimatedRowHeight: number | "auto";
	overscan: number;
	enabled: boolean;
	apiRef?: { current: IVirtualScrollApi | null };
}
