import type { IDataGridColumn } from "../../DataGrid.types";
import type { IDataGridContext, IDataGridPlugin } from "../../DataGrid.plugin";
import type { IColumnResizePluginOptions } from "./column-resize-plugin.types";
import {
	measureHeaderWidth,
	startColumnResize,
} from "./column-resize-plugin.utils";

export type { IColumnResizePluginOptions } from "./column-resize-plugin.types";

const DEFAULT_MIN_WIDTH = 60;
const DEFAULT_MAX_WIDTH = 800;

export function createColumnResizePlugin<T>(
	options: IColumnResizePluginOptions = {},
): IDataGridPlugin<T> {
	const minWidth = options.minWidth ?? DEFAULT_MIN_WIDTH;
	const maxWidth = options.maxWidth ?? DEFAULT_MAX_WIDTH;
	const allowReset = options.allowReset ?? true;

	return {
		id: "columnResize",
		HeaderCell({ column, ctx, children }) {
			if (!column.resizable) return <>{children}</>;
			return (
				<ResizableHeader
					column={column}
					ctx={ctx}
					minWidth={minWidth}
					maxWidth={maxWidth}
					allowReset={allowReset}
				>
					{children}
				</ResizableHeader>
			);
		},
	};
}

function ResizableHeader<T>({
	column,
	ctx,
	minWidth,
	maxWidth,
	allowReset,
	children,
}: {
	column: IDataGridColumn<T>;
	ctx: IDataGridContext<T>;
	minWidth: number;
	maxWidth: number;
	allowReset: boolean;
	children: React.ReactNode;
}) {
	const onPointerDown = (e: React.PointerEvent<HTMLElement>) => {
		const root =
			ctx.scrollRef.current?.closest<HTMLElement>(".dgv-root") ?? null;
		const stored = ctx.state.columnWidths.get(column.id);
		const current = stored ?? measureHeaderWidth(root, column.id);
		startColumnResize({
			event: e,
			columnId: column.id,
			currentWidth: current,
			minWidth,
			maxWidth,
			actions: ctx.actions,
			rootEl: root,
		});
	};

	const onDoubleClick = () => {
		if (!allowReset) return;
		ctx.actions.setColumnWidth(column.id, undefined);
	};

	return (
		<span
			style={{ display: "inline-flex", width: "100%", alignItems: "center" }}
		>
			<span style={{ flex: 1, minWidth: 0 }}>{children}</span>
			<span
				role="separator"
				aria-orientation="vertical"
				aria-label={`Resize column ${column.name}`}
				className="dgv-resize-handle"
				onPointerDown={onPointerDown}
				onDoubleClick={onDoubleClick}
				onClick={(e) => e.stopPropagation()}
			/>
		</span>
	);
}
