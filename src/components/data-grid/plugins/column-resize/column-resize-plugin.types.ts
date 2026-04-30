export interface IColumnResizePluginOptions {
	/** Minimum column width in pixels. Default: 60. */
	minWidth?: number;
	/** Maximum column width in pixels. Default: 800. */
	maxWidth?: number;
	/**
	 * If true, double-clicking a resize handle resets that column's width
	 * back to its original `column.width`. Default: true.
	 */
	allowReset?: boolean;
}
