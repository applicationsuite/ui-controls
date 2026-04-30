export interface IStatusCounts {
	/** Number of raw input rows. */
	total: number;
	/** Number of rows after filter/search (before paging). */
	filtered: number;
	/** Number of rows currently rendered (after paging). */
	visible: number;
	/** First row index (1-based) currently rendered. 0 when none. */
	rangeStart: number;
	/** Last row index (1-based) currently rendered. 0 when none. */
	rangeEnd: number;
	/** True when filter or search has reduced the row set. */
	isFiltered: boolean;
	/** True when pagination is active. */
	isPaged: boolean;
}

export interface IStatusPluginOptions {
	/** Where to render. Default: "toolbar" (inline at the end of the action bar). */
	position?: "subtoolbar" | "toolbar" | "footer";
	/**
	 * Custom message renderer. When omitted a sensible default is used:
	 *  - "Showing 1–25 of 87 (filtered from 500)" when paged + filtered
	 *  - "Showing 25 of 87 records" when not paged but filtered
	 *  - "87 records" when no pagination + no filter
	 */
	render?: (counts: IStatusCounts) => React.ReactNode;
}
