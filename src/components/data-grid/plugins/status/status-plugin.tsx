import type { IDataGridContext, IDataGridPlugin } from "../../DataGrid.plugin";
import type {
	IStatusCounts,
	IStatusPluginOptions,
} from "./status-plugin.types";
import { defaultStatusMessage, getStatusCounts } from "./status-plugin.utils";

export type {
	IStatusCounts,
	IStatusPluginOptions,
} from "./status-plugin.types";

function StatusMessage<T>({
	ctx,
	render,
}: {
	ctx: IDataGridContext<T>;
	render?: (counts: IStatusCounts) => React.ReactNode;
}) {
	const counts = getStatusCounts(ctx);
	return (
		<span className="dgv-status" role="status" aria-live="polite">
			{(render ?? defaultStatusMessage)(counts)}
		</span>
	);
}

export function createStatusPlugin<T>(
	options: IStatusPluginOptions = {},
): IDataGridPlugin<T> {
	const position = options.position ?? "toolbar";
	const View = ({ ctx }: { ctx: IDataGridContext<T> }) => (
		<StatusMessage ctx={ctx} render={options.render} />
	);
	return {
		id: "status",
		Toolbar: position === "toolbar" ? View : undefined,
		SubToolbar: position === "subtoolbar" ? View : undefined,
		Footer: position === "footer" ? View : undefined,
	};
}
