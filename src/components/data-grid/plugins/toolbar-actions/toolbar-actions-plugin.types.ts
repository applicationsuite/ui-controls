import type * as React from "react";
import type { IDataGridContext } from "../../DataGrid.plugin";

export interface IToolbarAction<T = unknown> {
	id: string;
	label: string;
	icon?: string;
	"aria-label"?: string;
	disabled?: boolean | ((ctx: IDataGridContext<T>) => boolean);
	/** Either an onClick handler or a custom render function for the button. */
	onClick?: (ctx: IDataGridContext<T>) => void;
	render?: (ctx: IDataGridContext<T>) => React.ReactNode;
	/** Render on the right side of the toolbar instead of the left. */
	align?: "left" | "right";
}

export interface IToolbarActionsPluginOptions<T = unknown> {
	actions: IToolbarAction<T>[];
}
