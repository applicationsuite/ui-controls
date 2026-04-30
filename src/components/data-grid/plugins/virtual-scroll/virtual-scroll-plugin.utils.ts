/* =====================================================================
 *  Pure helpers for virtual-scroll: prefix-sum-based windowing that
 *  supports per-row measured heights. No React, no DOM — easy to unit
 *  test and reuse.
 * ===================================================================== */

const DENSITY_HEIGHTS: Record<string, number> = {
	compact: 28,
	comfortable: 36,
	spacious: 44,
};

/**
 * Detect the row-height for the active density by walking up from the
 * scroll container to the nearest `[data-dgv-density]` element.
 */
export function getEstimatedRowHeightFromDensity(
	scrollEl: HTMLElement | null,
	fallback = 36,
): number {
	if (!scrollEl) return fallback;
	const root = scrollEl.closest<HTMLElement>("[data-dgv-density]");
	const key = root?.dataset.dgvDensity ?? "";
	return DENSITY_HEIGHTS[key] ?? fallback;
}

/**
 * Build a prefix-sum of row heights. `prefix[i]` = total height of rows
 * `[0, i)`; `prefix[n]` is the full content height. Unmeasured rows fall
 * back to `estimatedRowHeight`.
 */
export function buildPrefixSum(
	totalRows: number,
	getKey: (index: number) => string | number,
	heights: ReadonlyMap<string | number, number>,
	estimatedRowHeight: number,
): Float64Array {
	const arr = new Float64Array(totalRows + 1);
	for (let i = 0; i < totalRows; i++) {
		const measured = heights.get(getKey(i));
		arr[i + 1] = arr[i] + (measured ?? estimatedRowHeight);
	}
	return arr;
}

/**
 * Find the smallest `i` such that `prefix[i + 1] > offset`. Returns
 * `totalRows - 1` when `offset` is past the end.
 */
export function findRowAtOffset(
	prefix: Float64Array,
	offset: number,
	totalRows: number,
): number {
	if (totalRows === 0) return 0;
	if (offset <= 0) return 0;
	if (offset >= prefix[totalRows]) return totalRows - 1;
	let lo = 0;
	let hi = totalRows - 1;
	while (lo < hi) {
		const mid = (lo + hi) >>> 1;
		if (prefix[mid + 1] <= offset) lo = mid + 1;
		else hi = mid;
	}
	return lo;
}

export interface IVirtualWindow {
	start: number;
	end: number;
	topPad: number;
	bottomPad: number;
}

/**
 * Compute the slice of rows to mount given the current scroll position,
 * viewport height, and a precomputed prefix-sum.
 */
export function computeVirtualWindow(args: {
	scrollTop: number;
	viewportHeight: number;
	overscan: number;
	totalRows: number;
	prefix: Float64Array;
}): IVirtualWindow {
	const { scrollTop, viewportHeight, overscan, totalRows, prefix } = args;
	if (totalRows === 0) {
		return { start: 0, end: 0, topPad: 0, bottomPad: 0 };
	}
	const firstVisible = findRowAtOffset(prefix, scrollTop, totalRows);
	const lastVisible = findRowAtOffset(
		prefix,
		scrollTop + viewportHeight,
		totalRows,
	);
	const start = Math.max(0, firstVisible - overscan);
	const end = Math.min(totalRows, lastVisible + 1 + overscan);
	const topPad = prefix[start];
	const bottomPad = Math.max(0, prefix[totalRows] - prefix[end]);
	return { start, end, topPad, bottomPad };
}

/**
 * Compute the scrollTop that should be used to bring `index` into view
 * with the requested alignment.
 */
export function computeScrollTopForIndex(args: {
	index: number;
	prefix: Float64Array;
	totalRows: number;
	viewportHeight: number;
	currentScrollTop: number;
	align: "start" | "center" | "end" | "auto";
}): number {
	const { index, prefix, totalRows, viewportHeight, currentScrollTop, align } =
		args;
	if (totalRows === 0) return 0;
	const i = Math.max(0, Math.min(index, totalRows - 1));
	const top = prefix[i];
	const bottom = prefix[i + 1];
	const rowHeight = bottom - top;

	if (align === "auto") {
		if (top < currentScrollTop) return top;
		if (bottom > currentScrollTop + viewportHeight)
			return bottom - viewportHeight;
		return currentScrollTop;
	}
	if (align === "end") return Math.max(0, bottom - viewportHeight);
	if (align === "center")
		return Math.max(0, top - (viewportHeight - rowHeight) / 2);
	return top; // "start"
}
