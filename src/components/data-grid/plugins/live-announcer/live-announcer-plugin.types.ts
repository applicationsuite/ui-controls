export interface ILiveAnnouncerPluginOptions {
	/**
	 * Aria-live politeness. "polite" waits for screen reader idle (default),
	 * "assertive" interrupts.
	 */
	politeness?: "polite" | "assertive";
	/**
	 * Override the message announced for a given state change. Return
	 * `null` to suppress that announcement.
	 */
	formatMessage?: (
		kind: "filter" | "search" | "sort" | "page" | "items",
		count: number,
	) => string | null;
}
