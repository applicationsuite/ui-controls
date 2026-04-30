import type { IDataGridContext } from "../../DataGrid.plugin";
import type {
	IPaginationPluginOptions,
	IPaginationViewModel,
} from "./pagination-plugin.types";

/** Default page size choices when none are provided. */
export const DEFAULT_PAGE_SIZE_OPTIONS: readonly number[] = [10, 25, 50, 100];

interface IGroupSentinel {
	__dgv_group__?: boolean;
}

const isGroupRow = (r: unknown): boolean =>
	!!(r && typeof r === "object" && (r as IGroupSentinel).__dgv_group__);

/** Slice items for the current page. Returns input unchanged when in server-side mode. */
export function applyPagination<T>(
	items: readonly T[],
	ctx: IDataGridContext<T>,
	options: IPaginationPluginOptions,
): readonly T[] {
	if (options.serverSide) return items;
	const { page } = ctx.state;
	const start = page.index * page.size;
	return items.slice(start, start + page.size);
}

/** Compute the displayable page-state numbers for the footer. */
export function getPaginationViewModel<T>(
	ctx: IDataGridContext<T>,
	options: IPaginationPluginOptions,
): IPaginationViewModel {
	const { page } = ctx.state;
	const prePaged =
		ctx.pipelineStages.get("pre:pagination") ?? ctx.processedItems;
	const total = options.serverSide
		? (page.total ?? 0)
		: prePaged.filter((r) => !isGroupRow(r)).length;

	const pageCount = Math.max(1, Math.ceil(total / page.size));
	const current = Math.min(page.index, pageCount - 1);
	const start = total === 0 ? 0 : current * page.size + 1;
	const end = Math.min(total, (current + 1) * page.size);
	return { pageCount, current, start, end, total };
}
