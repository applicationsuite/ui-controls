export interface ISortPluginOptions {
	/** Allow holding shift to add additional sort levels. */
	allowMultiLevel?: boolean;
	/**
	 * Render a "Sort" button in the toolbar that opens a multi-level sort
	 * manager. Only effective when `allowMultiLevel` is true. Default: true.
	 */
	showToolbarButton?: boolean;
	/**
	 * When true, the plugin does not sort items in-memory. The host is
	 * expected to listen to the grid's `onChange` event and fetch sorted
	 * data from the server.
	 */
	serverSide?: boolean;
}
