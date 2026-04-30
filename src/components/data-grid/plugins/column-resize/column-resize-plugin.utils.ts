import type { IDataGridActions } from "../../DataGrid.actions.types";

interface IDragState {
	columnId: string;
	startX: number;
	startWidth: number;
}

/**
 * Begin a resize drag for the given column. Tracks pointer movement on the
 * window and updates the column width via the grid actions on each move.
 * Releases on pointerup. Returns a cleanup function only used in tests.
 */
export function startColumnResize(args: {
	event: React.PointerEvent<HTMLElement>;
	columnId: string;
	currentWidth: number;
	minWidth: number;
	maxWidth: number;
	actions: IDataGridActions;
	rootEl: HTMLElement | null;
}): () => void {
	const { event, columnId, currentWidth, minWidth, maxWidth, actions, rootEl } =
		args;
	event.preventDefault();
	event.stopPropagation();

	const drag: IDragState = {
		columnId,
		startX: event.clientX,
		startWidth: currentWidth,
	};

	rootEl?.classList.add("dgv-root--resizing");

	const onMove = (e: PointerEvent) => {
		const dx = e.clientX - drag.startX;
		const next = clamp(drag.startWidth + dx, minWidth, maxWidth);
		actions.setColumnWidth(drag.columnId, next);
	};
	const onUp = () => {
		window.removeEventListener("pointermove", onMove);
		window.removeEventListener("pointerup", onUp);
		window.removeEventListener("pointercancel", onUp);
		rootEl?.classList.remove("dgv-root--resizing");
	};
	window.addEventListener("pointermove", onMove);
	window.addEventListener("pointerup", onUp);
	window.addEventListener("pointercancel", onUp);

	return onUp;
}

const clamp = (n: number, min: number, max: number) =>
	Math.max(min, Math.min(max, n));

/**
 * Read the current rendered width of a th by id. Falls back to 0 when the
 * th can't be located (e.g. before mount).
 */
export function measureHeaderWidth(
	rootEl: HTMLElement | null,
	columnId: string,
): number {
	if (!rootEl) return 0;
	const th = rootEl.querySelector<HTMLTableCellElement>(
		`th[data-col-id="${cssEscape(columnId)}"]`,
	);
	return th ? Math.round(th.getBoundingClientRect().width) : 0;
}

const cssEscape = (s: string): string =>
	typeof CSS !== "undefined" && CSS.escape
		? CSS.escape(s)
		: s.replace(/"/g, '\\"');
