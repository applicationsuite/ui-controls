import { useRef, useState } from "react";
import { useDataGridAdapter } from "../../DataGrid.adapter";
import {
	DATA_GRID_PIPELINE_ORDER,
	type IDataGridContext,
	type IDataGridPlugin,
} from "../../DataGrid.plugin";
import type { IGroupPluginOptions } from "./group-plugin.types";
import { applyGrouping } from "./group-plugin.utils";

export type { IGroupPluginOptions } from "./group-plugin.types";

function GroupBySelector<T>({ ctx }: { ctx: IDataGridContext<T> }) {
	const { Button, Popover, Select, Icon } = useDataGridAdapter();
	const [open, setOpen] = useState(false);
	const triggerRef = useRef<HTMLElement | null>(null);
	const groupable = ctx.columns.filter((c) => c.groupable);
	if (!groupable.length) return null;

	const active = ctx.state.groupBy;
	const remaining = groupable.filter((c) => !active.includes(c.id));
	const activeCount = active.length;

	const removeAt = (idx: number) =>
		ctx.actions.setGroupBy(active.filter((_, i) => i !== idx));
	const addColumn = (id: string) => {
		if (!id) return;
		ctx.actions.setGroupBy([...active, id]);
	};
	const moveUp = (idx: number) => {
		if (idx <= 0) return;
		const next = [...active];
		[next[idx - 1], next[idx]] = [next[idx], next[idx - 1]];
		ctx.actions.setGroupBy(next);
	};

	return (
		<span className="dgv-groupby">
			<span ref={triggerRef} style={{ display: "inline-flex" }}>
				<Button
					className="dgv-action-button"
					onClick={() => setOpen((v) => !v)}
					aria-haspopup="dialog"
					aria-expanded={open}
					active={activeCount > 0}
					aria-label="Group by"
				>
					<Icon name="group" />
					<span className="dgv-button-label">
						Group by{activeCount ? ` (${activeCount})` : ""}
					</span>
				</Button>
			</span>
			<Popover
				open={open}
				onClose={() => setOpen(false)}
				aria-label="Group by"
				anchorRef={triggerRef}
			>
				<div className="dgv-groupby-menu" role="menu">
					{active.length === 0 && (
						<div className="dgv-groupby-empty">No grouping applied</div>
					)}
					{active.map((id, idx) => {
						const col = ctx.columns.find((c) => c.id === id);
						if (!col) return null;
						return (
							<div key={id} className="dgv-groupby-row">
								<span className="dgv-groupby-name">
									{idx + 1}. {col.name}
								</span>
								{idx > 0 && (
									<button
										type="button"
										className="dgv-tag-close"
										aria-label={`Move ${col.name} up`}
										onClick={() => moveUp(idx)}
									>
										<Icon name="chevron-up" />
									</button>
								)}
								<button
									type="button"
									className="dgv-tag-close"
									aria-label={`Remove ${col.name}`}
									onClick={() => removeAt(idx)}
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
								addColumn(e.target.value);
								e.currentTarget.value = "";
							}}
							aria-label="Add group column"
						>
							<option value="">+ Add column</option>
							{remaining.map((c) => (
								<option key={c.id} value={c.id}>
									{c.name}
								</option>
							))}
						</Select>
					)}
				</div>
			</Popover>
		</span>
	);
}

export function createGroupPlugin<T>(
	options: IGroupPluginOptions<T> = {},
): IDataGridPlugin<T> {
	return {
		id: "group",
		order: DATA_GRID_PIPELINE_ORDER.Group,
		transform: (items, ctx) => applyGrouping(items, ctx, options),
		Toolbar:
			options.showGroupBySelector === false
				? undefined
				: ({ ctx }) => <GroupBySelector ctx={ctx} />,
	};
}
