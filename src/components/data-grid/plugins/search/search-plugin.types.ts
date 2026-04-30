export interface ISearchPluginOptions {
	placeholder?: string;
	/** Debounce in ms; 0 = synchronous. */
	debounceMs?: number;
	/** Restrict search to specific column ids; defaults to columns with `searchable` or `field`. */
	fields?: string[];
	/** Custom matcher for full control. */
	match?: (item: unknown, query: string) => boolean;
	/**
	 * When true, the plugin does not filter items in-memory. The host is
	 * expected to listen to the grid's `onChange` event and fetch matching
	 * data from the server.
	 */
	serverSide?: boolean;
}
