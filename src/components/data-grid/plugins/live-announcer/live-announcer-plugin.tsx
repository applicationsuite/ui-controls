import { useEffect, useId, useRef, useState } from "react";
import type { IDataGridContext, IDataGridPlugin } from "../../DataGrid.plugin";
import type { ILiveAnnouncerPluginOptions } from "./live-announcer-plugin.types";

export type { ILiveAnnouncerPluginOptions } from "./live-announcer-plugin.types";

const DEFAULT_FORMAT: NonNullable<
	ILiveAnnouncerPluginOptions["formatMessage"]
> = (kind, count) => {
	const noun = count === 1 ? "result" : "results";
	switch (kind) {
		case "filter":
			return `Filters changed. ${count} ${noun}.`;
		case "search":
			return `Search updated. ${count} ${noun}.`;
		case "sort":
			return "Sort changed.";
		case "page":
			return `Showing page. ${count} ${noun} on this page.`;
		case "items":
			return `${count} ${noun}.`;
		default:
			return null;
	}
};

export function createLiveAnnouncerPlugin<T>(
	options: ILiveAnnouncerPluginOptions = {},
): IDataGridPlugin<T> {
	return {
		id: "liveAnnouncer",
		// Render the live region in a non-visual SubToolbar slot so it stays
		// inside the grid root for proper landmark association.
		SubToolbar: ({ ctx }) => <LiveAnnouncer ctx={ctx} options={options} />,
	};
}

function LiveAnnouncer<T>({
	ctx,
	options,
}: {
	ctx: IDataGridContext<T>;
	options: ILiveAnnouncerPluginOptions;
}) {
	const id = useId();
	const [message, setMessage] = useState("");
	const fmt = options.formatMessage ?? DEFAULT_FORMAT;
	const politeness = options.politeness ?? "polite";

	const prevRef = useRef({
		filters: ctx.state.filters,
		search: ctx.state.search,
		sort: ctx.state.sort,
		pageIndex: ctx.state.page.index,
		count: ctx.processedItems.length,
	});

	useEffect(() => {
		const prev = prevRef.current;
		const current = {
			filters: ctx.state.filters,
			search: ctx.state.search,
			sort: ctx.state.sort,
			pageIndex: ctx.state.page.index,
			count: countDataRows(ctx.processedItems),
		};

		let next: string | null = null;
		if (current.filters !== prev.filters) next = fmt("filter", current.count);
		else if (current.search !== prev.search)
			next = fmt("search", current.count);
		else if (current.sort !== prev.sort) next = fmt("sort", current.count);
		else if (current.pageIndex !== prev.pageIndex)
			next = fmt("page", current.count);
		else if (current.count !== prev.count) next = fmt("items", current.count);

		prevRef.current = current;
		if (next) setMessage(next);
	}, [
		ctx.state.filters,
		ctx.state.search,
		ctx.state.sort,
		ctx.state.page.index,
		ctx.processedItems,
		fmt,
	]);

	return (
		<span
			id={`dgv-live-${id}`}
			className="dgv-sr-only"
			role="status"
			aria-live={politeness}
			aria-atomic="true"
		>
			{message}
		</span>
	);
}

function countDataRows(items: readonly unknown[]): number {
	let n = 0;
	for (const r of items) {
		if (
			r &&
			typeof r === "object" &&
			(r as { __dgv_group__?: boolean }).__dgv_group__
		)
			continue;
		n++;
	}
	return n;
}
