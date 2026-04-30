import {
	useCallback,
	useEffect,
	useLayoutEffect,
	useMemo,
	useRef,
	useState,
} from "react";
import type { IDataGridContext, IDataGridPlugin } from "../../DataGrid.plugin";
import { isGroupRow } from "../../DataGrid.utils";
import { useScrollMetrics } from "./virtual-scroll-plugin.hooks";
import type {
	IInternalVirtualScrollOptions,
	IVirtualScrollApi,
	IVirtualScrollPluginOptions,
} from "./virtual-scroll-plugin.types";
import {
	buildPrefixSum,
	computeScrollTopForIndex,
	computeVirtualWindow,
	getEstimatedRowHeightFromDensity,
} from "./virtual-scroll-plugin.utils";

export type {
	IVirtualScrollApi,
	IVirtualScrollPluginOptions,
} from "./virtual-scroll-plugin.types";

const DEFAULT_OVERSCAN = 6;

/**
 * Compute the per-row measurement key. Group sentinels use a `__g:` prefix
 * so they don't collide with data-row keys.
 */
function getMeasurementKey<T>(
	ctx: IDataGridContext<T>,
	item: unknown,
	index: number,
): string | number {
	if (isGroupRow(item)) return `__g:${item.key}`;
	return ctx.getRowKey(item as T, index);
}

interface IVirtualScrollRowRendererProps<T> {
	ctx: IDataGridContext<T>;
	items: readonly unknown[];
	colSpan: number;
	renderRow: (item: unknown, index: number) => React.ReactNode;
	options: IInternalVirtualScrollOptions;
}

function VirtualScrollRowRenderer<T>({
	ctx,
	items,
	colSpan,
	renderRow,
	options,
}: IVirtualScrollRowRendererProps<T>) {
	const { scrollTop, viewportHeight } = useScrollMetrics(ctx.scrollRef);

	// Resolve the estimated row height once, on mount, by reading the
	// density attribute from the DOM. Falls back to 36 when unavailable.
	const estimatedRowHeight = useMemo(() => {
		if (typeof options.estimatedRowHeight === "number") {
			return options.estimatedRowHeight;
		}
		return getEstimatedRowHeightFromDensity(ctx.scrollRef.current);
		// We deliberately read ctx.scrollRef.current at construction time;
		// the density doesn't change without remount.
		// biome-ignore lint/correctness/useExhaustiveDependencies: see comment above
	}, [options.estimatedRowHeight]);

	// Measured heights cache. Lives in a ref so updates don't trigger a
	// render until we explicitly bump `version`.
	const heightsRef = useRef<Map<string | number, number>>(new Map());
	const [version, setVersion] = useState(0);
	const bumpVersion = useCallback(() => setVersion((v) => (v + 1) | 0), []);

	// Per-row key resolver, stable across the items array.
	const getKey = useCallback(
		(index: number) => getMeasurementKey(ctx, items[index], index),
		[ctx, items],
	);

	const prefix = useMemo(
		() =>
			buildPrefixSum(
				items.length,
				getKey,
				heightsRef.current,
				estimatedRowHeight,
			),
		// `version` triggers a rebuild when measured heights change.
		// biome-ignore lint/correctness/useExhaustiveDependencies: version is the explicit invalidation signal
		[items, getKey, estimatedRowHeight, version],
	);

	const win = useMemo(
		() =>
			computeVirtualWindow({
				scrollTop,
				viewportHeight: viewportHeight || 400,
				overscan: options.overscan,
				totalRows: items.length,
				prefix,
			}),
		[scrollTop, viewportHeight, options.overscan, items.length, prefix],
	);

	// After each render of the windowed slice, walk the tbody siblings
	// and record actual heights. Sums the primary `<tr>` plus any
	// immediately-following `dgv-tr--detail` row.
	const tbodyRef = useRef<HTMLTableSectionElement | null>(null);

	useLayoutEffect(() => {
		const tbody = tbodyRef.current;
		if (!tbody) return;

		const children = Array.from(tbody.children) as HTMLElement[];
		let cursor = 0;
		// Skip top spacer if present.
		if (children[cursor]?.classList.contains("dgv-tr--virtual-spacer")) {
			cursor++;
		}

		let changed = false;
		for (let r = win.start; r < win.end; r++) {
			const tr = children[cursor];
			if (!tr || tr.classList.contains("dgv-tr--virtual-spacer")) break;
			let h = tr.offsetHeight;
			cursor++;
			const next = children[cursor];
			if (next && next.classList.contains("dgv-tr--detail")) {
				h += next.offsetHeight;
				cursor++;
			}
			const key = getKey(r);
			if (heightsRef.current.get(key) !== h) {
				heightsRef.current.set(key, h);
				changed = true;
			}
		}
		if (changed) bumpVersion();
	});

	// Imperative API: keep apiRef populated with closures that always read
	// the latest prefix sums via a ref.
	const latestRef = useRef({
		prefix,
		totalRows: items.length,
		viewportHeight: viewportHeight || 400,
		scrollTop,
		scrollEl: ctx.scrollRef.current,
	});
	latestRef.current = {
		prefix,
		totalRows: items.length,
		viewportHeight: viewportHeight || 400,
		scrollTop,
		scrollEl: ctx.scrollRef.current,
	};

	const apiRef = options.apiRef;
	useEffect(() => {
		if (!apiRef) return;
		const api: IVirtualScrollApi = {
			scrollToIndex: (index, opts) => {
				const l = latestRef.current;
				if (!l.scrollEl || l.totalRows === 0) return;
				const top = computeScrollTopForIndex({
					index,
					prefix: l.prefix,
					totalRows: l.totalRows,
					viewportHeight: l.viewportHeight,
					currentScrollTop: l.scrollTop,
					align: opts?.align ?? "auto",
				});
				l.scrollEl.scrollTo({ top, behavior: opts?.behavior });
			},
			resetMeasurements: () => {
				heightsRef.current.clear();
				bumpVersion();
			},
		};
		apiRef.current = api;
		return () => {
			if (apiRef.current === api) apiRef.current = null;
		};
	}, [apiRef, bumpVersion]);

	const rows: React.ReactNode[] = [];
	for (let i = win.start; i < win.end; i++) {
		rows.push(renderRow(items[i], i));
	}

	return (
		<>
			{/*
			 * The plugin slot returns into <tbody>; we cannot render a wrapper
			 * tbody. Instead we render spacer rows whose <td>s carry the
			 * appropriate heights to preserve the scrollbar. tbodyRef points
			 * at the actual tbody by walking the DOM via a ref callback on
			 * the first spacer.
			 */}
			{win.topPad > 0 ? (
				<tr
					aria-hidden="true"
					className="dgv-tr dgv-tr--virtual-spacer"
					ref={(el) => {
						tbodyRef.current =
							el?.parentElement as HTMLTableSectionElement | null;
					}}
				>
					<td
						className="dgv-td dgv-td--virtual-spacer"
						colSpan={colSpan}
						style={{ height: win.topPad }}
					/>
				</tr>
			) : (
				<tr
					aria-hidden="true"
					className="dgv-tr dgv-tr--virtual-spacer"
					style={{ height: 0 }}
					ref={(el) => {
						tbodyRef.current =
							el?.parentElement as HTMLTableSectionElement | null;
					}}
				>
					<td className="dgv-td dgv-td--virtual-spacer" colSpan={colSpan} />
				</tr>
			)}
			{rows}
			{win.bottomPad > 0 && (
				<tr aria-hidden="true" className="dgv-tr dgv-tr--virtual-spacer">
					<td
						className="dgv-td dgv-td--virtual-spacer"
						colSpan={colSpan}
						style={{ height: win.bottomPad }}
					/>
				</tr>
			)}
		</>
	);
}

export function createVirtualScrollPlugin<T>(
	options: IVirtualScrollPluginOptions = {},
): IDataGridPlugin<T> {
	const opts: IInternalVirtualScrollOptions = {
		estimatedRowHeight:
			options.estimatedRowHeight ?? options.rowHeight ?? "auto",
		overscan: options.overscan ?? DEFAULT_OVERSCAN,
		enabled: options.enabled ?? true,
		apiRef: options.apiRef,
	};

	if (
		process.env.NODE_ENV !== "production" &&
		options.rowHeight !== undefined
	) {
		// One-time migration warning.
		// biome-ignore lint/suspicious/noConsole: dev-only deprecation notice
		console.warn(
			"[dgv:virtual-scroll] `rowHeight` is deprecated. Pass `estimatedRowHeight` instead — rows are now measured per-row via ResizeObserver.",
		);
	}

	return {
		id: "virtualScroll",
		RowRenderer: opts.enabled
			? (props) => <VirtualScrollRowRenderer {...props} options={opts} />
			: undefined,
	};
}
