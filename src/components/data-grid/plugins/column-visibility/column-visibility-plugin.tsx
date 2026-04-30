import { useRef, useState } from "react";
import { useDataGridAdapter } from "../../DataGrid.adapter";
import type { IDataGridContext, IDataGridPlugin } from "../../DataGrid.plugin";
import type { IColumnVisibilityPluginOptions } from "./column-visibility-plugin.types";

export type { IColumnVisibilityPluginOptions } from "./column-visibility-plugin.types";

export function createColumnVisibilityPlugin<T>(
	options: IColumnVisibilityPluginOptions<T> = {},
): IDataGridPlugin<T> {
	return {
		id: "columnVisibility",
		Toolbar: ({ ctx }) => (
			<ColumnVisibilityButton ctx={ctx} options={options} />
		),
	};
}

function ColumnVisibilityButton<T>({
	ctx,
	options,
}: {
	ctx: IDataGridContext<T>;
	options: IColumnVisibilityPluginOptions<T>;
}) {
	const { Button, Popover, Checkbox, Icon } = useDataGridAdapter();
	const [open, setOpen] = useState(false);
	const triggerRef = useRef<HTMLSpanElement | null>(null);

	const candidates = ctx.allColumns.filter((c) =>
		options.includeColumn ? options.includeColumn(c) : c.hideable !== false,
	);
	if (candidates.length === 0) return null;

	// Required columns are forced visible and can't be toggled.
	const optional = candidates.filter((c) => !c.required);
	const visibleOptional = optional.filter(
		(c) => !ctx.state.hiddenColumns.has(c.id),
	);
	const allVisible = visibleOptional.length === optional.length;
	const masterDisabled = optional.length === 0;

	const toggleAll = () => {
		if (allVisible) {
			// Hide all optional columns; required ones stay visible.
			ctx.actions.setHiddenColumns(new Set(optional.map((c) => c.id)));
		} else {
			ctx.actions.setHiddenColumns(new Set());
		}
	};

	return (
		<span className="dgv-colvis">
			<span ref={triggerRef} style={{ display: "inline-flex" }}>
				<Button
					className="dgv-action-button"
					onClick={() => setOpen((v) => !v)}
					aria-label="Column visibility"
					aria-haspopup="dialog"
					aria-expanded={open}
				>
					<Icon name="columns" />
					<span className="dgv-button-label">
						{options.buttonLabel ?? "Columns"}
					</span>
				</Button>
			</span>
			<Popover
				open={open}
				onClose={() => setOpen(false)}
				aria-label="Column visibility"
				anchorRef={triggerRef}
			>
				<div className="dgv-colvis-menu" role="menu">
					{!masterDisabled && (
						<label className="dgv-colvis-item dgv-colvis-item--all">
							<Checkbox
								checked={allVisible}
								onChange={toggleAll}
								aria-label={
									allVisible ? "Hide all columns" : "Show all columns"
								}
							/>
							<span>{allVisible ? "Hide all" : "Show all"}</span>
						</label>
					)}
					{candidates.map((col) => {
						const hidden = ctx.state.hiddenColumns.has(col.id);
						const required = !!col.required;
						return (
							<label
								key={col.id}
								className="dgv-colvis-item"
								data-required={required || undefined}
							>
								<Checkbox
									checked={required ? true : !hidden}
									disabled={required}
									onChange={() =>
										!required && ctx.actions.toggleColumnVisibility(col.id)
									}
								/>
								<span>{col.name}</span>
							</label>
						);
					})}
				</div>
			</Popover>
		</span>
	);
}
