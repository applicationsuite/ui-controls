import { useEffect, useMemo, useState } from "react";
import type { IDataGridColumn } from "../../DataGrid.types";
import type { IDataGridContext } from "../../DataGrid.plugin";
import { getFilterMeta } from "./filter-plugin.utils";

/**
 * Build the distinct option list for a column's checkbox filter. Honours
 * `meta.filter.items` when supplied; otherwise scans `ctx.rawItems` and
 * de-duplicates by string representation.
 *
 * The fallback scan is correct for client-side grids only — server-paged
 * grids should always supply `meta.filter.items` so the picker reflects
 * the full domain rather than just the loaded page.
 */
export function useDistinctItems<T>(
	column: IDataGridColumn<T>,
	ctx: IDataGridContext<T>,
): { value: unknown; label: string }[] {
	const meta = getFilterMeta(column);

	// One-time warning when the configuration is likely wrong: server-side
	// derivation from rawItems would only show values from the current
	// page, which is misleading.
	useEffect(() => {
		if (process.env.NODE_ENV === "production") return;
		if (meta.type !== "checkbox" || meta.items) return;
		if (ctx.rawItems.length === 0) return;
		const looksPaged = ctx.state.page.total !== undefined;
		if (!looksPaged) return;
		// biome-ignore lint/suspicious/noConsole: dev-only diagnostic
		console.warn(
			`[dgv:filter] Column "${column.id}" uses type:"checkbox" without meta.filter.items. ` +
				`On a server-paged grid the picker will only show values from the current page. ` +
				`Either supply meta.filter.items, or switch to type:"text" / "number".`,
		);
	}, [
		column.id,
		meta.type,
		meta.items,
		ctx.rawItems.length,
		ctx.state.page.total,
	]);

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

/**
 * Drawer-local draft state for filters. Resets to the live filter state each
 * time the drawer opens, and closes the drawer on Escape.
 */
export function useFilterDrafts<T>(args: {
	open: boolean;
	onClose: () => void;
	ctx: IDataGridContext<T>;
}) {
	const { open, onClose, ctx } = args;
	const [drafts, setDrafts] = useState<Map<string, unknown[]>>(() => new Map());

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

	const reset = () => setDrafts(new Map());

	return { drafts, setColumnDraft, reset };
}
