import type { IDataGridColumn } from "../../DataGrid.types";
import type { IDataGridContext } from "../../DataGrid.plugin";

export interface IExportCsvOptions {
	/** File name (without extension). Default: "data". */
	filename?: string;
	/** Field separator. Default: ",". */
	separator?: string;
	/** Include header row. Default: true. */
	includeHeader?: boolean;
	/** Use the unfiltered raw items rather than the processed page. Default: false. */
	useRawItems?: boolean;
}

/**
 * Export the grid's currently visible items to a CSV file. Skips group
 * sentinels and respects column visibility (uses `ctx.columns`).
 */
export function exportGridToCsv<T>(
	ctx: IDataGridContext<T>,
	options: IExportCsvOptions = {},
): void {
	const sep = options.separator ?? ",";
	const items = options.useRawItems ? ctx.rawItems : ctx.processedItems;
	const cols = ctx.columns;
	const dataRows = items.filter((r) => !isGroupRow(r));

	const lines: string[] = [];
	if (options.includeHeader !== false) {
		lines.push(cols.map((c) => csvCell(c.name, sep)).join(sep));
	}
	for (const item of dataRows) {
		lines.push(
			cols.map((c) => csvCell(formatCellValue(item, c), sep)).join(sep),
		);
	}
	downloadCsv(`${options.filename ?? "data"}.csv`, lines.join("\n"));
}

const formatCellValue = <T>(item: T, col: IDataGridColumn<T>): unknown => {
	if (col.getValue) return col.getValue(item);
	if (col.field) return (item as Record<string, unknown>)[col.field];
	return "";
};

const csvCell = (value: unknown, sep: string): string => {
	if (value === null || value === undefined) return "";
	const s = String(value);
	const needsQuote = s.includes(sep) || s.includes('"') || s.includes("\n");
	return needsQuote ? `"${s.replace(/"/g, '""')}"` : s;
};

const downloadCsv = (filename: string, content: string): void => {
	if (typeof window === "undefined" || typeof document === "undefined") return;
	const blob = new Blob([content], { type: "text/csv;charset=utf-8;" });
	const url = URL.createObjectURL(blob);
	const link = document.createElement("a");
	link.href = url;
	link.download = filename;
	document.body.appendChild(link);
	link.click();
	document.body.removeChild(link);
	URL.revokeObjectURL(url);
};

const isGroupRow = (r: unknown): boolean =>
	!!(
		r &&
		typeof r === "object" &&
		(r as { __dgv_group__?: boolean }).__dgv_group__
	);
