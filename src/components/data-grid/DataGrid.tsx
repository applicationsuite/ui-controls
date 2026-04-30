import React, { useEffect, useMemo, useRef } from "react";
import "./DataGrid.styles.css";
import type { IDataGridActions } from "./DataGrid.actions";
import {
	DataGridAdapterProvider,
	type IDataGridAdapter,
	useDataGridAdapter,
} from "./DataGrid.adapter";
import {
	useDataGridInit,
	useDataGridSelection,
	useProcessedItems,
	useRowKeyResolver,
} from "./DataGrid.hooks";
import {
	DataGridSelectionMode,
	type IDataGridChange,
	type IDataGridColumn,
	type IDataGridState,
} from "./DataGrid.types";
import type { IDataGridPlugin } from "./DataGrid.plugin";
import {
	DATA_GRID_GROUP_ROW_KEY,
	type IDataGridGroupSentinel,
	isGroupRow,
	renderColumnCell,
	splitSlotPlugins,
} from "./DataGrid.utils";
import { createColumnVisibilityPlugin } from "./plugins/column-visibility/column-visibility-plugin";
import { createSearchPlugin } from "./plugins/search/search-plugin";

export interface IDataGridProps<T> {
	items: T[];
	columns: IDataGridColumn<T>[];
	plugins?: IDataGridPlugin<T>[];

	itemKey?: keyof T & string;
	getRowKey?: (item: T, index: number) => string | number;

	selectionMode?: DataGridSelectionMode;

	initialState?: Partial<IDataGridState>;
	onChange?: (change: IDataGridChange) => void;

	/** External `{state, actions}` for full control. If omitted, internal state is used. */
	controller?: { state: IDataGridState; actions: IDataGridActions };

	emptyState?: React.ReactNode;
	/**
	 * When true the grid renders the `loadingContent` slot in place of rows.
	 * The toolbar/footer remain interactive so consumers can still adjust
	 * filters, sorts, etc. while data is loading.
	 */
	isLoading?: boolean;
	/** Custom loading slot. Defaults to a skeleton matching the column count. */
	loadingContent?: React.ReactNode;
	className?: string;
	ariaLabel?: string;

	/**
	 * Order in which toolbar slots are rendered, by plugin id.
	 * - Pass `string[]` to render all on the left in the given order.
	 * - Pass `{ left, right }` to split items between left- and right-aligned
	 *   groups, each preserving its own order.
	 * Plugins not listed render on the left after listed ones in plugin-array order.
	 */
	toolbarOrder?: string[] | { left?: string[]; right?: string[] };

	/** Same as {@link toolbarOrder} but for the footer slot. */
	footerOrder?: string[] | { left?: string[]; right?: string[] };

	/**
	 * Override one or more UI primitives (Button, Input, Select, Checkbox,
	 * IconButton) so the grid renders with Fluent, Material, or any other
	 * component library. Anything not provided falls back to native HTML.
	 */
	adapter?: Partial<IDataGridAdapter>;

	/**
	 * Theme name applied via `data-dgv-theme` on the grid root. The grid
	 * ships with `"light"`, `"dark"`, `"auto"`, `"fluent"`, and `"material"`;
	 * import the matching CSS file from `@techtrips/ui-controls/themes/...`
	 * (or `themes/index.css` for all of them) for the tokens to take effect.
	 * Consumers can also define their own `[data-dgv-theme="..."]` rule.
	 */
	theme?: string;

	/**
	 * Row density preset. Controls vertical padding of header/data cells
	 * via the `dgv-root--density-*` modifier.
	 * - `comfortable` (default): standard 36px row height.
	 * - `compact`: tighter 28px rows for dense data tables.
	 * - `spacious`: 44px rows for touch / readability.
	 */
	density?: "compact" | "comfortable" | "spacious";

	/**
	 * Render a per-row detail panel below each data row. When provided,
	 * the grid prepends an "expand" column containing a chevron toggle.
	 * Rows whose key is in `state.expandedRows` show the returned node
	 * spanning the full row width.
	 */
	renderRowDetail?: (item: T, rowIndex: number) => React.ReactNode;
}

export function DataGrid<T>(props: IDataGridProps<T>) {
	const {
		items,
		columns,
		plugins: pluginsProp,
		itemKey,
		getRowKey,
		selectionMode = DataGridSelectionMode.None,
		initialState,
		onChange,
		controller,
		emptyState,
		isLoading,
		loadingContent,
		className,
		ariaLabel,
		toolbarOrder,
		footerOrder,
		adapter,
		theme,
		density = "comfortable",
		renderRowDetail,
	} = props;

	// When the consumer doesn't pass any plugins, fall back to a sensible
	// default set: a search box and a column-visibility picker. This keeps
	// the grid usable out of the box without requiring boilerplate.
	const plugins = useMemo<IDataGridPlugin<T>[]>(
		() =>
			pluginsProp && pluginsProp.length > 0
				? pluginsProp
				: [createSearchPlugin<T>(), createColumnVisibilityPlugin<T>()],
		[pluginsProp],
	);

	const internal = useDataGridInit({ initialState, onChange });
	const { state, actions } = controller ?? internal;

	const scrollRef = useRef<HTMLDivElement | null>(null);

	const resolveRowKey = useRowKeyResolver(getRowKey, itemKey);

	// Seed initial hidden columns from any `defaultVisible: false` flags on
	// the column definitions, the first time we see them. Required columns
	// always start visible and ignore `defaultVisible`.
	const seededRef = useRef(false);
	useEffect(() => {
		if (seededRef.current) return;
		seededRef.current = true;
		const seed = new Set<string>();
		for (const c of columns) {
			if (c.required) continue;
			if (c.defaultVisible === false) seed.add(c.id);
		}
		// Merge with any explicitly provided initialState.hiddenColumns.
		for (const id of state.hiddenColumns) seed.add(id);
		// Required columns must never be hidden.
		for (const c of columns) {
			if (c.required) seed.delete(c.id);
		}
		if (seed.size !== state.hiddenColumns.size) {
			actions.setHiddenColumns(seed);
		}
	}, [columns, actions, state.hiddenColumns]);

	// Filter out hidden columns before the pipeline / render so plugins
	// (filter, sort, search) only operate on what the user can see.
	// Required columns are forced visible regardless of `hiddenColumns`.
	const visibleColumns = useMemo(
		() => columns.filter((c) => c.required || !state.hiddenColumns.has(c.id)),
		[columns, state.hiddenColumns],
	);

	const { processedItems, ctx } = useProcessedItems({
		items,
		columns: visibleColumns,
		allColumns: columns,
		plugins,
		state,
		actions,
		resolveRowKey,
		scrollRef,
	});

	const { isMulti, hasSelection, allSelected, toggleAll } =
		useDataGridSelection({
			selectionMode,
			processedItems,
			state,
			actions,
			resolveRowKey,
		});

	const { left: toolbarLeft, right: toolbarRight } = splitSlotPlugins(
		plugins.filter((p) => p.Toolbar),
		toolbarOrder,
	);
	const subToolbarPlugins = plugins.filter((p) => p.SubToolbar);
	const { left: footerLeft, right: footerRight } = splitSlotPlugins(
		plugins.filter((p) => p.Footer),
		footerOrder,
	);
	const headerPlugins = plugins.filter((p) => p.HeaderCell);
	const rowRendererPlugin = plugins.find((p) => p.RowRenderer);

	if (process.env.NODE_ENV !== "production") {
		const rowRendererCount = plugins.filter((p) => p.RowRenderer).length;
		if (rowRendererCount > 1) {
			// biome-ignore lint/suspicious/noConsole: dev-only diagnostic
			console.warn(
				`[DataGrid] ${rowRendererCount} plugins define RowRenderer; only the first ("${rowRendererPlugin?.id}") will be used.`,
			);
		}
	}

	const renderHeaderInner = (col: IDataGridColumn<T>) => {
		const inner = col.renderHeader ? col.renderHeader(col) : col.name;
		let node: React.ReactNode = inner;
		for (const p of headerPlugins) {
			// biome-ignore lint/style/noNonNullAssertion: filtered above
			const HeaderCell = p.HeaderCell!;
			node = (
				<HeaderCell key={p.id} column={col} ctx={ctx}>
					{node}
				</HeaderCell>
			);
		}
		return node;
	};

	const colSpan =
		visibleColumns.length + (hasSelection ? 1 : 0) + (renderRowDetail ? 1 : 0);

	const getColumnWidth = (
		col: IDataGridColumn<T>,
	): number | string | undefined => state.columnWidths.get(col.id) ?? col.width;

	const renderRow = (item: T | IDataGridGroupSentinel, rowIndex: number) => {
		if (isGroupRow(item)) {
			return (
				<GroupRow
					key={`g-${item.key}`}
					group={item}
					colSpan={colSpan}
					onToggle={() => actions.toggleGroup(item.key)}
				/>
			);
		}

		const key = resolveRowKey(item as T, rowIndex);
		const selected = state.selection.has(key);
		const expanded = state.expandedRows.has(key);
		const rowClass = [
			"dgv-tr",
			selected && "dgv-tr--selected",
			expanded && "dgv-tr--expanded",
		]
			.filter(Boolean)
			.join(" ");
		return (
			<React.Fragment key={key}>
				<tr
					className={rowClass}
					aria-selected={hasSelection ? selected : undefined}
				>
					{renderRowDetail && (
						<td className="dgv-td dgv-td--expand">
							<RowExpandToggle
								expanded={expanded}
								onToggle={() => actions.toggleRowExpansion(key)}
								rowIndex={rowIndex}
							/>
						</td>
					)}
					{hasSelection && (
						<td className="dgv-td dgv-td--select">
							<RowSelectCell
								isMulti={isMulti}
								selected={selected}
								onToggle={() =>
									actions.toggleRowSelection(key, isMulti ? "multi" : "single")
								}
								rowIndex={rowIndex}
							/>
						</td>
					)}
					{visibleColumns.map((col) => (
						<td
							key={`${key}-${col.id}`}
							className={`dgv-td dgv-td--align-${col.align ?? "start"}`}
						>
							{renderColumnCell(item as T, col, rowIndex)}
						</td>
					))}
				</tr>
				{renderRowDetail && expanded && (
					<tr className="dgv-tr dgv-tr--detail">
						<td className="dgv-td" colSpan={colSpan}>
							{renderRowDetail(item as T, rowIndex)}
						</td>
					</tr>
				)}
			</React.Fragment>
		);
	};

	return (
		<DataGridAdapterProvider adapter={adapter}>
			<div
				className={`dgv-root dgv-root--density-${density} ${className ?? ""}`}
				data-dgv-theme={theme}
				data-dgv-density={density}
			>
				{(toolbarLeft.length > 0 || toolbarRight.length > 0) && (
					<div className="dgv-toolbar" role="toolbar">
						<div className="dgv-toolbar-group dgv-toolbar-group--left">
							{toolbarLeft.map((p) => {
								// biome-ignore lint/style/noNonNullAssertion: filtered above
								const Toolbar = p.Toolbar!;
								return <Toolbar key={p.id} ctx={ctx} />;
							})}
						</div>
						{toolbarRight.length > 0 && (
							<div className="dgv-toolbar-group dgv-toolbar-group--right">
								{toolbarRight.map((p) => {
									// biome-ignore lint/style/noNonNullAssertion: filtered above
									const Toolbar = p.Toolbar!;
									return <Toolbar key={p.id} ctx={ctx} />;
								})}
							</div>
						)}
					</div>
				)}

				{subToolbarPlugins.length > 0 && (
					<div className="dgv-subtoolbar">
						{subToolbarPlugins.map((p) => {
							// biome-ignore lint/style/noNonNullAssertion: filtered above
							const SubToolbar = p.SubToolbar!;
							return <SubToolbar key={p.id} ctx={ctx} />;
						})}
					</div>
				)}

				<div className="dgv-scroll" ref={scrollRef}>
					<table
						className="dgv-table"
						role="grid"
						aria-label={ariaLabel ?? "Data grid"}
					>
						<thead className="dgv-thead">
							<tr>
								{renderRowDetail && (
									<th className="dgv-th dgv-th--expand" scope="col" />
								)}
								{hasSelection && (
									<th className="dgv-th dgv-th--select" scope="col">
										{isMulti && (
											<SelectAllCheckbox
												checked={allSelected}
												onChange={toggleAll}
											/>
										)}
									</th>
								)}
								{visibleColumns.map((col) => (
									<th
										key={col.id}
										data-col-id={col.id}
										scope="col"
										className={`dgv-th dgv-th--align-${col.align ?? "start"}`}
										style={{
											width: getColumnWidth(col),
											minWidth: col.minWidth,
										}}
									>
										{renderHeaderInner(col)}
									</th>
								))}
							</tr>
						</thead>

						<tbody>
							{isLoading ? (
								loadingContent !== undefined ? (
									<tr>
										<td className="dgv-td dgv-loading" colSpan={colSpan}>
											{loadingContent}
										</td>
									</tr>
								) : (
									<LoadingSkeleton
										rowCount={Math.min(state.page.size, 8)}
										colSpan={colSpan}
									/>
								)
							) : processedItems.length === 0 ? (
								<tr>
									<td className="dgv-td dgv-empty" colSpan={colSpan}>
										{emptyState ?? "No results"}
									</td>
								</tr>
							) : rowRendererPlugin?.RowRenderer ? (
								(() => {
									// biome-ignore lint/style/noNonNullAssertion: guarded above
									const RowRenderer = rowRendererPlugin.RowRenderer!;
									return (
										<RowRenderer
											ctx={ctx}
											items={processedItems}
											colSpan={colSpan}
											renderRow={(item, rowIndex) =>
												renderRow(item as T | IDataGridGroupSentinel, rowIndex)
											}
										/>
									);
								})()
							) : (
								processedItems.map((item, rowIndex) =>
									renderRow(item, rowIndex),
								)
							)}
						</tbody>
					</table>
				</div>

				{(footerLeft.length > 0 || footerRight.length > 0) && (
					<div className="dgv-footer">
						<div className="dgv-toolbar-group dgv-toolbar-group--left">
							{footerLeft.map((p) => {
								// biome-ignore lint/style/noNonNullAssertion: filtered above
								const Footer = p.Footer!;
								return <Footer key={p.id} ctx={ctx} />;
							})}
						</div>
						{footerRight.length > 0 && (
							<div className="dgv-toolbar-group dgv-toolbar-group--right">
								{footerRight.map((p) => {
									// biome-ignore lint/style/noNonNullAssertion: filtered above
									const Footer = p.Footer!;
									return <Footer key={p.id} ctx={ctx} />;
								})}
							</div>
						)}
					</div>
				)}
			</div>
		</DataGridAdapterProvider>
	);
}

DataGrid.displayName = "DataGrid";

/* ---------- adapter-aware sub-components (presentational only) ---------- */

function SelectAllCheckbox(props: { checked: boolean; onChange: () => void }) {
	const { Checkbox } = useDataGridAdapter();
	return (
		<Checkbox
			checked={props.checked}
			onChange={props.onChange}
			aria-label="Select all rows"
		/>
	);
}

function RowSelectCell(props: {
	isMulti: boolean;
	selected: boolean;
	onToggle: () => void;
	rowIndex: number;
}) {
	const { Checkbox } = useDataGridAdapter();
	if (props.isMulti) {
		return (
			<Checkbox
				checked={props.selected}
				onChange={props.onToggle}
				aria-label={`Select row ${props.rowIndex + 1}`}
			/>
		);
	}
	return (
		<input
			type="radio"
			checked={props.selected}
			onChange={props.onToggle}
			aria-label={`Select row ${props.rowIndex + 1}`}
		/>
	);
}

function RowExpandToggle(props: {
	expanded: boolean;
	onToggle: () => void;
	rowIndex: number;
}) {
	const { Icon } = useDataGridAdapter();
	return (
		<button
			type="button"
			className="dgv-expand-toggle"
			onClick={props.onToggle}
			aria-expanded={props.expanded}
			aria-label={`${props.expanded ? "Collapse" : "Expand"} row ${props.rowIndex + 1}`}
		>
			<Icon name={props.expanded ? "chevron-down" : "chevron-right"} />
		</button>
	);
}

function GroupRow(props: {
	group: IDataGridGroupSentinel;
	colSpan: number;
	onToggle: () => void;
}) {
	const { Icon } = useDataGridAdapter();
	const { group: g } = props;
	return (
		<tr className="dgv-tr dgv-group-row">
			<td className="dgv-td" colSpan={props.colSpan}>
				<button
					type="button"
					className="dgv-th-button"
					onClick={props.onToggle}
					aria-expanded={!g.collapsed}
					style={{ paddingInlineStart: g.level * 16 }}
				>
					<span className="dgv-group-toggle">
						<Icon name={g.collapsed ? "chevron-right" : "chevron-down"} />
					</span>
					<span>
						{g.label} ({g.count})
					</span>
				</button>
			</td>
		</tr>
	);
}

// Re-export for plugin authors that need to know how to mark a group row.
export { DATA_GRID_GROUP_ROW_KEY };

function LoadingSkeleton(props: { rowCount: number; colSpan: number }) {
	return (
		<>
			{Array.from({ length: props.rowCount }).map((_, i) => (
				<tr key={`dgv-skel-${i}`} className="dgv-tr dgv-tr--skeleton">
					<td className="dgv-td" colSpan={props.colSpan}>
						<span className="dgv-skeleton-bar" />
					</td>
				</tr>
			))}
		</>
	);
}
