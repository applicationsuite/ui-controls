import { useRef, useState } from "react";
import { useDataGridAdapter } from "../../DataGrid.adapter";
import {
	DataGridFilterOperator,
	type IDataGridColumn,
} from "../../DataGrid.types";
import {
	DATA_GRID_PIPELINE_ORDER,
	type IDataGridContext,
	type IDataGridPlugin,
} from "../../DataGrid.plugin";
import { useDistinctItems, useFilterDrafts } from "./filter-plugin.hooks";
import type { IFilterPluginOptions } from "./filter-plugin.types";
import {
	applyFilters,
	buildFilterDescriptors,
	getFilterMeta,
} from "./filter-plugin.utils";

export type {
	IFilterColumnMeta,
	IFilterPluginOptions,
} from "./filter-plugin.types";

/* ---------- shared editor used in popover and panel ---------- */

function FilterEditor<T>({
	column,
	ctx,
	autoApply,
	onClose,
}: {
	column: IDataGridColumn<T>;
	ctx: IDataGridContext<T>;
	/** When true, changes commit immediately (used by panel). Otherwise an explicit "Apply" button is shown (popover). */
	autoApply: boolean;
	onClose?: () => void;
}) {
	const { Button, Input, Checkbox, Label } = useDataGridAdapter();
	const meta = getFilterMeta(column);
	const current = ctx.state.filters.find((f) => f.columnId === column.id);
	const [draft, setDraft] = useState<unknown[]>(current?.values ?? []);
	const items = useDistinctItems(column, ctx);

	const commit = (values: unknown[]) => {
		ctx.actions.upsertFilter({
			columnId: column.id,
			operator: meta.operator ?? DataGridFilterOperator.In,
			values,
		});
	};

	const setValues = (values: unknown[]) => {
		setDraft(values);
		if (autoApply) commit(values);
	};

	const apply = () => {
		commit(draft);
		onClose?.();
	};

	const clear = () => {
		setDraft([]);
		ctx.actions.clearFilter(column.id);
		onClose?.();
	};

	return (
		<div className="dgv-filter-editor">
			{meta.type === "text" || meta.type === "number" ? (
				<Input
					type={meta.type === "number" ? "number" : "text"}
					value={(draft[0] as string | number | undefined) ?? ""}
					onChange={(e) => {
						const v =
							e.target.value === ""
								? []
								: [
										meta.type === "number"
											? Number(e.target.value)
											: e.target.value,
									];
						setValues(v);
					}}
				/>
			) : (
				<div className="dgv-filter-checkboxes">
					{items.map((it) => {
						const checked = draft.includes(it.value);
						return (
							<Label key={String(it.value)} className="dgv-filter-check">
								<Checkbox
									checked={checked}
									onChange={() =>
										setValues(
											checked
												? draft.filter((v) => v !== it.value)
												: [...draft, it.value],
										)
									}
								/>
								<span>{it.label}</span>
							</Label>
						);
					})}
				</div>
			)}
			{!autoApply && (
				<div className="dgv-filter-actions">
					<Button variant="primary" onClick={apply}>
						Apply
					</Button>
					<Button onClick={clear}>Clear</Button>
				</div>
			)}
		</div>
	);
}

/* ---------- toolbar tags ---------- */

function FilterTags<T>({ ctx }: { ctx: IDataGridContext<T> }) {
	const { Tag } = useDataGridAdapter();
	if (!ctx.state.filters.length) return null;
	const colMap = new Map(ctx.columns.map((c) => [c.id, c]));
	return (
		<>
			{ctx.state.filters.map((f) => {
				const col = colMap.get(f.columnId);
				const label = col?.name ?? f.columnId;
				const value = f.values
					.map((v) => (typeof v === "object" ? JSON.stringify(v) : String(v)))
					.join(", ");
				return (
					<Tag
						key={f.columnId}
						onDismiss={() => ctx.actions.clearFilter(f.columnId)}
						dismissLabel={`Clear ${label} filter`}
					>
						<strong>{label}:</strong> {value}
					</Tag>
				);
			})}
		</>
	);
}

/* ---------- per-header popover ---------- */

function FilterHeaderCell<T>({
	column,
	ctx,
	children,
}: {
	column: IDataGridColumn<T>;
	ctx: IDataGridContext<T>;
	children: React.ReactNode;
}) {
	const { Popover, Icon } = useDataGridAdapter();
	const [open, setOpen] = useState(false);
	const triggerRef = useRef<HTMLButtonElement | null>(null);
	if (!column.filterable) return <>{children}</>;
	const active = ctx.state.filters.some((f) => f.columnId === column.id);
	return (
		<span className="dgv-filter-header">
			<span>{children}</span>
			<button
				type="button"
				ref={triggerRef}
				className="dgv-th-button dgv-filter-toggle"
				data-active={active || undefined}
				onClick={(e) => {
					e.stopPropagation();
					setOpen((o) => !o);
				}}
				aria-haspopup="dialog"
				aria-expanded={open}
				aria-label={`Filter ${column.name}`}
			>
				<Icon name="filter" />
			</button>
			<Popover
				open={open}
				onClose={() => setOpen(false)}
				aria-label={`Filter ${column.name}`}
				anchorRef={triggerRef}
			>
				<FilterEditor
					column={column}
					ctx={ctx}
					autoApply={false}
					onClose={() => setOpen(false)}
				/>
			</Popover>
		</span>
	);
}

/* ---------- drawer listing all filterable columns ---------- */

function FilterDrawer<T>({
	ctx,
	open,
	onClose,
}: {
	ctx: IDataGridContext<T>;
	open: boolean;
	onClose: () => void;
}) {
	const { Drawer, Button } = useDataGridAdapter();
	const filterable = ctx.columns.filter((c) => c.filterable);
	const { drafts, setColumnDraft, reset } = useFilterDrafts({
		open,
		onClose,
		ctx,
	});

	const apply = () => {
		ctx.actions.setFilters(buildFilterDescriptors(filterable, drafts));
		onClose();
	};

	return (
		<Drawer
			open={open}
			onClose={onClose}
			title="Filters"
			aria-label="Filters"
			footer={
				<>
					<Button onClick={reset}>Reset</Button>
					<span className="dgv-spacer" />
					<Button onClick={onClose}>Cancel</Button>
					<Button variant="primary" onClick={apply}>
						Apply
					</Button>
				</>
			}
		>
			{filterable.map((col) => (
				<details key={col.id} className="dgv-filter-panel-section" open>
					<summary>{col.name}</summary>
					<FilterDraftEditor
						column={col}
						ctx={ctx}
						values={drafts.get(col.id) ?? []}
						onChange={(v) => setColumnDraft(col.id, v)}
					/>
				</details>
			))}
		</Drawer>
	);
}

function FilterDraftEditor<T>({
	column,
	ctx,
	values,
	onChange,
}: {
	column: IDataGridColumn<T>;
	ctx: IDataGridContext<T>;
	values: unknown[];
	onChange: (values: unknown[]) => void;
}) {
	const { Input, Checkbox, Label } = useDataGridAdapter();
	const meta = getFilterMeta(column);
	const items = useDistinctItems(column, ctx);

	if (meta.type === "text" || meta.type === "number") {
		return (
			<div className="dgv-filter-editor">
				<Input
					type={meta.type === "number" ? "number" : "text"}
					value={(values[0] as string | number | undefined) ?? ""}
					onChange={(e) => {
						const v =
							e.target.value === ""
								? []
								: [
										meta.type === "number"
											? Number(e.target.value)
											: e.target.value,
									];
						onChange(v);
					}}
				/>
			</div>
		);
	}

	return (
		<div className="dgv-filter-editor">
			<div className="dgv-filter-checkboxes">
				{items.map((it) => {
					const checked = values.includes(it.value);
					return (
						<Label key={String(it.value)} className="dgv-filter-check">
							<Checkbox
								checked={checked}
								onChange={() =>
									onChange(
										checked
											? values.filter((v) => v !== it.value)
											: [...values, it.value],
									)
								}
							/>
							<span>{it.label}</span>
						</Label>
					);
				})}
			</div>
		</div>
	);
}

/* ---------- toolbar trigger button ---------- */

function FilterPanelTrigger<T>({ ctx }: { ctx: IDataGridContext<T> }) {
	const { Button, Icon } = useDataGridAdapter();
	const [open, setOpen] = useState(false);
	const filterable = ctx.columns.filter((c) => c.filterable);
	if (!filterable.length) return null;
	const activeCount = ctx.state.filters.length;
	return (
		<>
			<Button
				className="dgv-action-button"
				onClick={() => setOpen(true)}
				aria-haspopup="dialog"
				aria-expanded={open}
				active={activeCount > 0}
				aria-label="Filters"
			>
				<Icon name="filter" />
				<span className="dgv-button-label">
					Filters{activeCount ? ` (${activeCount})` : ""}
				</span>
			</Button>
			<FilterDrawer ctx={ctx} open={open} onClose={() => setOpen(false)} />
		</>
	);
}

/* ---------- plugin factory ---------- */

export function createFilterPlugin<T>(
	options: IFilterPluginOptions = {},
): IDataGridPlugin<T> {
	const showHeader = options.headerControls !== false;
	const showPanel = options.panel !== false;
	const showTags = options.showTags !== false;

	const Toolbar =
		!showTags && !showPanel
			? undefined
			: ({ ctx }: { ctx: IDataGridContext<T> }) => (
					<>
						{showPanel && <FilterPanelTrigger ctx={ctx} />}
						{showTags && <FilterTags ctx={ctx} />}
					</>
				);

	return {
		id: "filter",
		order: DATA_GRID_PIPELINE_ORDER.Filter,
		transform: (items, ctx) => applyFilters(items, ctx, options),
		HeaderCell: showHeader ? FilterHeaderCell : undefined,
		Toolbar,
	};
}
