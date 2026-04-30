import { useDataGridAdapter } from "../../DataGrid.adapter";
import type { IDataGridIconName } from "../../DataGrid.adapter";
import type { IDataGridContext, IDataGridPlugin } from "../../DataGrid.plugin";
import type {
	IToolbarAction,
	IToolbarActionsPluginOptions,
} from "./toolbar-actions-plugin.types";

export type {
	IToolbarAction,
	IToolbarActionsPluginOptions,
} from "./toolbar-actions-plugin.types";

export function createToolbarActionsPlugin<T>(
	options: IToolbarActionsPluginOptions<T>,
): IDataGridPlugin<T> {
	return {
		id: "toolbarActions",
		Toolbar: ({ ctx }) => (
			<ToolbarActions ctx={ctx} actions={options.actions} />
		),
	};
}

function ToolbarActions<T>({
	ctx,
	actions,
}: {
	ctx: IDataGridContext<T>;
	actions: IToolbarAction<T>[];
}) {
	const { Button, Icon } = useDataGridAdapter();
	if (actions.length === 0) return null;
	return (
		<>
			{actions.map((a) => {
				if (a.render) return <span key={a.id}>{a.render(ctx)}</span>;
				const disabled =
					typeof a.disabled === "function" ? a.disabled(ctx) : a.disabled;
				return (
					<Button
						key={a.id}
						className="dgv-action-button"
						onClick={() => a.onClick?.(ctx)}
						disabled={disabled}
						aria-label={a["aria-label"] ?? a.label}
					>
						{a.icon && <Icon name={a.icon as IDataGridIconName} />}
						<span>{a.label}</span>
					</Button>
				);
			})}
		</>
	);
}
