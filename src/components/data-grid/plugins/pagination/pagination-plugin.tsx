import { useDataGridAdapter } from "../../DataGrid.adapter";
import {
	DATA_GRID_PIPELINE_ORDER,
	type IDataGridContext,
	type IDataGridPlugin,
} from "../../DataGrid.plugin";
import type { IPaginationPluginOptions } from "./pagination-plugin.types";
import {
	applyPagination,
	DEFAULT_PAGE_SIZE_OPTIONS,
	getPaginationViewModel,
} from "./pagination-plugin.utils";

export type { IPaginationPluginOptions } from "./pagination-plugin.types";

function PaginationFooter<T>({
	ctx,
	options,
}: {
	ctx: IDataGridContext<T>;
	options: IPaginationPluginOptions;
}) {
	const { Button, Select, Icon } = useDataGridAdapter();
	const { page } = ctx.state;
	const { pageCount, current, start, end, total } = getPaginationViewModel(
		ctx,
		options,
	);
	const pageSizeOptions = options.pageSizeOptions ?? DEFAULT_PAGE_SIZE_OPTIONS;

	return (
		<div className="dgv-pager" role="navigation" aria-label="Pagination">
			<div className="dgv-pager-info">
				{options.showPageSizeSelector !== false && (
					<label className="dgv-pager-rows">
						<span>Rows:</span>
						<Select
							value={page.size}
							onChange={(e) =>
								ctx.actions.setPage({
									size: Number(e.target.value),
									index: 0,
								})
							}
						>
							{pageSizeOptions.map((s) => (
								<option key={s} value={s}>
									{s}
								</option>
							))}
						</Select>
					</label>
				)}
				<span>
					{start}–{end} of {total}
				</span>
			</div>
			<div className="dgv-pager-nav">
				<Button
					onClick={() => ctx.actions.setPage({ index: 0 })}
					disabled={current === 0}
					aria-label="First page"
				>
					<Icon name="first-page" />
				</Button>
				<Button
					onClick={() => ctx.actions.setPage({ index: current - 1 })}
					disabled={current === 0}
					aria-label="Previous page"
				>
					<Icon name="previous" />
				</Button>
				<span aria-live="polite">
					{current + 1} / {pageCount}
				</span>
				<Button
					onClick={() => ctx.actions.setPage({ index: current + 1 })}
					disabled={current >= pageCount - 1}
					aria-label="Next page"
				>
					<Icon name="next" />
				</Button>
				<Button
					onClick={() => ctx.actions.setPage({ index: pageCount - 1 })}
					disabled={current >= pageCount - 1}
					aria-label="Last page"
				>
					<Icon name="last-page" />
				</Button>
			</div>
		</div>
	);
}

export function createPaginationPlugin<T>(
	options: IPaginationPluginOptions = {},
): IDataGridPlugin<T> {
	return {
		id: "pagination",
		order: DATA_GRID_PIPELINE_ORDER.Page,
		transform: (items, ctx) => applyPagination(items, ctx, options),
		Footer: ({ ctx }) => <PaginationFooter ctx={ctx} options={options} />,
	};
}
