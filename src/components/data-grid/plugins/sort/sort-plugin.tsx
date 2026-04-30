import { useRef, useState } from "react";
import { useDataGridAdapter } from "../../DataGrid.adapter";
import { DataGridSortDirection } from "../../DataGrid.types";
import type {
	IDataGridColumn,
	IDataGridSortDescriptor,
} from "../../DataGrid.types";
import {
	DATA_GRID_PIPELINE_ORDER,
	type IDataGridContext,
	type IDataGridPlugin,
} from "../../DataGrid.plugin";
import type { ISortPluginOptions } from "./sort-plugin.types";
import { applySort, ariaSortValue, sortIconName } from "./sort-plugin.utils";

export type { ISortPluginOptions } from "./sort-plugin.types";

export function createSortPlugin<T>(
	options: ISortPluginOptions = {},
): IDataGridPlugin<T> {
	const allowMultiLevel = !!options.allowMultiLevel;
	const showToolbarButton =
		allowMultiLevel && options.showToolbarButton !== false;
	return {
		id: "sort",
		order: DATA_GRID_PIPELINE_ORDER.Sort,
		transform(items, ctx) {
			if (options.serverSide) return items;
			return applySort(items, ctx.state.sort, ctx.columns);
		},
		HeaderCell({ column, ctx, children }) {
			if (!column.sortable) return <>{children}</>;
			return (
				<SortHeaderButton
					column={column}
					ctx={ctx}
					allowMultiLevel={allowMultiLevel}
				>
					{children}
				</SortHeaderButton>
			);
		},
		Toolbar: showToolbarButton
			? ({ ctx }) => <MultiSortButton ctx={ctx} />
			: undefined,
	};
}

function SortHeaderButton<T>({
	column,
	ctx,
	allowMultiLevel,
	children,
}: {
	column: IDataGridColumn<T>;
	ctx: IDataGridContext<T>;
	allowMultiLevel: boolean;
	children: React.ReactNode;
}) {
	const { Icon } = useDataGridAdapter();
	const sort = ctx.state.sort.find((s) => s.columnId === column.id);
	const toggle = (multi: boolean) => ctx.actions.toggleSort(column.id, multi);
	// Use a non-button element so plugins composed inside (e.g. the filter
	// chevron `<button>`) don't end up nested inside another `<button>`,
	// which is invalid HTML and triggers a React hydration warning.
	return (
		<span
			role="button"
			tabIndex={0}
			className="dgv-th-button"
			onClick={(e) => toggle(allowMultiLevel && (e.shiftKey || e.metaKey))}
			onKeyDown={(e) => {
				if (e.key === "Enter" || e.key === " ") {
					e.preventDefault();
					toggle(allowMultiLevel && (e.shiftKey || e.metaKey));
				}
			}}
			aria-sort={ariaSortValue(sort)}
		>
			<span>{children}</span>
			<span className="dgv-sort-indicator">
				<Icon name={sortIconName(sort)} />
			</span>
		</span>
	);
}

function MultiSortButton<T>({ ctx }: { ctx: IDataGridContext<T> }) {
	const { Button, Popover, Select, Icon } = useDataGridAdapter();
	const [open, setOpen] = useState(false);
	const triggerRef = useRef<HTMLElement | null>(null);
	const sortable = ctx.allColumns.filter((c) => c.sortable);
	if (!sortable.length) return null;

	const sort = ctx.state.sort;
	const used = new Set(sort.map((s) => s.columnId));
	const remaining = sortable.filter((c) => !used.has(c.id));

	const updateLevel = (idx: number, next: Partial<IDataGridSortDescriptor>) => {
		const updated = sort.map((s, i) => (i === idx ? { ...s, ...next } : s));
		ctx.actions.setSort(updated);
	};
	const removeLevel = (idx: number) =>
		ctx.actions.setSort(sort.filter((_, i) => i !== idx));
	const addLevel = (columnId: string) =>
		ctx.actions.setSort([
			...sort,
			{ columnId, direction: DataGridSortDirection.Asc },
		]);
	const moveLevel = (idx: number, dir: -1 | 1) => {
		const j = idx + dir;
		if (j < 0 || j >= sort.length) return;
		const next = [...sort];
		[next[idx], next[j]] = [next[j], next[idx]];
		ctx.actions.setSort(next);
	};

	const triggerLabel = sort.length ? `Sort (${sort.length})` : "Sort";

	return (
		<span className="dgv-sort-toolbar">
			<span
				ref={triggerRef as React.RefObject<HTMLSpanElement>}
				style={{ display: "inline-flex" }}
			>
				<Button
					className="dgv-action-button"
					onClick={() => setOpen((v) => !v)}
					aria-haspopup="dialog"
					aria-expanded={open}
					aria-label="Manage sort"
				>
					<Icon name={sort.length ? "sort-asc" : "sort-none"} />
					<span className="dgv-button-label">{triggerLabel}</span>
				</Button>
			</span>
			<Popover
				open={open}
				onClose={() => setOpen(false)}
				aria-label="Manage sort"
				anchorRef={triggerRef}
			>
				<div className="dgv-sort-menu" role="menu">
					{sort.length === 0 && (
						<div className="dgv-sort-empty">No sort applied</div>
					)}
					{sort.map((s, idx) => {
						const col = sortable.find((c) => c.id === s.columnId);
						return (
							<div key={s.columnId} className="dgv-sort-row">
								<span>
									{idx + 1}. {col?.name ?? s.columnId}
								</span>
								<Select
									value={s.direction}
									onChange={(e) =>
										updateLevel(idx, {
											direction: e.target.value as DataGridSortDirection,
										})
									}
									aria-label="Direction"
								>
									<option value={DataGridSortDirection.Asc}>Asc</option>
									<option value={DataGridSortDirection.Desc}>Desc</option>
								</Select>
								<button
									type="button"
									className="dgv-tag-close"
									onClick={() => moveLevel(idx, -1)}
									disabled={idx === 0}
									aria-label="Move up"
								>
									<Icon name="chevron-up" />
								</button>
								<button
									type="button"
									className="dgv-tag-close"
									onClick={() => removeLevel(idx)}
									aria-label="Remove"
								>
									<Icon name="close" />
								</button>
							</div>
						);
					})}
					{remaining.length > 0 && (
						<Select
							value=""
							onChange={(e) => {
								if (e.target.value) {
									addLevel(e.target.value);
									e.currentTarget.value = "";
								}
							}}
							aria-label="Add sort column"
						>
							<option value="">+ Add sort column</option>
							{remaining.map((c) => (
								<option key={c.id} value={c.id}>
									{c.name}
								</option>
							))}
						</Select>
					)}
					{sort.length > 0 && (
						<div className="dgv-sort-actions">
							<button
								type="button"
								className="dgv-tag-close"
								onClick={() => ctx.actions.setSort([])}
							>
								Clear all
							</button>
						</div>
					)}
				</div>
			</Popover>
		</span>
	);
}
