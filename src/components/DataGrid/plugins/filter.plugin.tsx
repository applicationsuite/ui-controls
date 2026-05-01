import { useEffect, useMemo, useState } from "react";
import { useDataGridAdapter } from "../DataGrid.adapter";
import {
	DataGridFilterOperator,
	type IDataGridColumn,
	type IDataGridFilterDescriptor,
} from "../DataGrid.models";
import {
	DATA_GRID_PIPELINE_ORDER,
	type IDataGridContext,
	type IDataGridPlugin,
} from "../DataGrid.plugin";

/**
 * Extracted from {@link IDataGridColumn.meta} when present, e.g.:
 * `meta: { filter: { type: "checkbox", items: [...] } }`
 */
export interface IFilterColumnMeta {
	type?: "text" | "checkbox" | "number" | "date";
	operator?: DataGridFilterOperator | string;
	items?: { value: unknown; label: string }[];
}

const getMeta = <T,>(col: IDataGridColumn<T>): IFilterColumnMeta =>
	(col.meta?.filter as IFilterColumnMeta) ?? {};

const compareValue = (a: unknown, b: unknown): number => {
	if (a == null && b == null) return 0;
	if (a == null) return -1;
	if (b == null) return 1;
	if (typeof a === "number" && typeof b === "number") return a - b;
	return String(a).localeCompare(String(b));
};

const matches = <T,>(
	item: T,
	filter: IDataGridFilterDescriptor,
	col: IDataGridColumn<T>,
): boolean => {
	const v = col.getValue
		? col.getValue(item)
		: col.field
			? item[col.field]
			: undefined;
	const values = filter.values;
	switch (filter.operator) {
		case DataGridFilterOperator.Equals:
			return v === values[0];
		case DataGridFilterOperator.NotEquals:
			return v !== values[0];
		case DataGridFilterOperator.In:
			return values.includes(v);
		case DataGridFilterOperator.NotIn:
			return !values.includes(v);
		case DataGridFilterOperator.Contains:
			return (
				v != null &&
				String(v).toLowerCase().includes(String(values[0]).toLowerCase())
			);
		case DataGridFilterOperator.StartsWith:
			return (
				v != null &&
				String(v).toLowerCase().startsWith(String(values[0]).toLowerCase())
			);
		case DataGridFilterOperator.EndsWith:
			return (
				v != null &&
				String(v).toLowerCase().endsWith(String(values[0]).toLowerCase())
			);
		case DataGridFilterOperator.GreaterThan:
			return compareValue(v, values[0]) > 0;
		case DataGridFilterOperator.GreaterThanOrEqual:
			return compareValue(v, values[0]) >= 0;
		case DataGridFilterOperator.LessThan:
			return compareValue(v, values[0]) < 0;
		case DataGridFilterOperator.LessThanOrEqual:
			return compareValue(v, values[0]) <= 0;
		case DataGridFilterOperator.Between:
			return compareValue(v, values[0]) >= 0 && compareValue(v, values[1]) <= 0;
		case DataGridFilterOperator.IsEmpty:
			return v == null || v === "";
		case DataGridFilterOperator.IsNotEmpty:
			return v != null && v !== "";
		default:
			return values.length === 0 ? true : values.includes(v);
	}
};

/* ---------- shared editor used in popover and panel ---------- */

function useDistinctItems<T>(
	column: IDataGridColumn<T>,
	ctx: IDataGridContext<T>,
) {
	const meta = getMeta(column);
	return useMemo(() => {
		if (meta.items) return meta.items;
		const seen = new Map<string, { value: unknown; label: string }>();
		for (const it of ctx.rawItems) {
			const v = column.getValue
				? column.getValue(it)
				: column.field
					? it[column.field]
					: undefined;
			if (v === undefined || v === null) continue;
			const key = String(v);
			if (!seen.has(key)) seen.set(key, { value: v, label: key });
		}
		return [...seen.values()].sort((a, b) => a.label.localeCompare(b.label));
	}, [meta.items, ctx.rawItems, column]);
}

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
	const meta = getMeta(column);
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
	if (!column.filterable) return <>{children}</>;
	const active = ctx.state.filters.some((f) => f.columnId === column.id);
	return (
		<span className="dgv-filter-header">
			<span>{children}</span>
			<button
				type="button"
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

	// Draft holds pending values per column; not committed until "Apply".
	const [drafts, setDrafts] = useState<Map<string, unknown[]>>(() => new Map());

	// Reset drafts to current state whenever the drawer opens.
	useEffect(() => {
		if (!open) return;
		const next = new Map<string, unknown[]>();
		for (const f of ctx.state.filters) next.set(f.columnId, f.values);
		setDrafts(next);
	}, [open, ctx.state.filters]);

	useEffect(() => {
		if (!open) return;
		const onKey = (e: KeyboardEvent) => {
			if (e.key === "Escape") onClose();
		};
		window.addEventListener("keydown", onKey);
		return () => window.removeEventListener("keydown", onKey);
	}, [open, onClose]);

	const setColumnDraft = (columnId: string, values: unknown[]) => {
		setDrafts((prev) => {
			const next = new Map(prev);
			if (values.length === 0) next.delete(columnId);
			else next.set(columnId, values);
			return next;
		});
	};

	const apply = () => {
		const next: IDataGridFilterDescriptor[] = [];
		for (const col of filterable) {
			const values = drafts.get(col.id);
			if (!values || values.length === 0) continue;
			const meta = getMeta(col);
			next.push({
				columnId: col.id,
				operator: meta.operator ?? DataGridFilterOperator.In,
				values,
			});
		}
		ctx.actions.setFilters(next);
		onClose();
	};

	const reset = () => setDrafts(new Map());

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
	const meta = getMeta(column);
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
				onClick={() => setOpen(true)}
				aria-haspopup="dialog"
				aria-expanded={open}
				active={activeCount > 0}
			>
				<Icon name="filter" />
				Filters{activeCount ? ` (${activeCount})` : ""}
			</Button>
			<FilterDrawer ctx={ctx} open={open} onClose={() => setOpen(false)} />
		</>
	);
}

/* ---------- plugin factory ---------- */

export interface IFilterPluginOptions {
	/** Show selected filters as removable tags in the toolbar. */
	showTags?: boolean;
	/** Show the per-column dropdown caret in headers. Default: true. */
	headerControls?: boolean;
	/**
	 * Render a "Filters" button in the toolbar that opens an overlay drawer
	 * listing every filterable column with Apply / Cancel buttons. Default: true.
	 */
	panel?: boolean;
	/**
	 * When true, the plugin does not filter items in-memory. The host is
	 * expected to listen to the grid's `onChange` event and fetch matching
	 * data from the server.
	 */
	serverSide?: boolean;
}

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
		transform(items, ctx) {
			if (options.serverSide) return items;
			if (!ctx.state.filters.length) return items;
			const colMap = new Map(ctx.columns.map((c) => [c.id, c]));
			return items.filter((it) =>
				ctx.state.filters.every((f) => {
					const col = colMap.get(f.columnId);
					return col ? matches(it, f, col) : true;
				}),
			);
		},
		HeaderCell: showHeader ? FilterHeaderCell : undefined,
		Toolbar,
	};
}
