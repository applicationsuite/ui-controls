/* =====================================================================
 *  Plugin pipeline runtime constants. Pure-type interfaces for the plugin
 *  context + plugin shape live in `DataGrid.plugin.types.ts` and are
 *  re-exported here for back-compat.
 * ===================================================================== */

/**
 * Pipeline order for `IDataGridPlugin.transform`. Lower runs first. Plugins
 * should pick a slot rather than a literal so the pipeline stays stable as
 * new plugins are added.
 */
export const DATA_GRID_PIPELINE_ORDER = {
	Filter: 100,
	Search: 200,
	Sort: 300,
	Group: 400,
	Page: 500,
} as const;

export type {
	IDataGridContext,
	IDataGridPlugin,
} from "./DataGrid.plugin.types";
