import { useCallback, useEffect, useMemo, useReducer, useRef } from "react";
import {
	DataGridActions,
	type IDataGridActions,
	type IDataGridDispatchActions,
} from "./DataGrid.actions";
import {
	DataGridSelectionMode,
	type DataGridChangeKind,
	type IDataGridChange,
	type IDataGridColumn,
	type IDataGridState,
} from "./DataGrid.types";
import {
	DATA_GRID_PIPELINE_ORDER,
	type IDataGridContext,
	type IDataGridPlugin,
} from "./DataGrid.plugin";
import {
	ACTION_TO_CHANGE_KIND,
	dataGridReducer,
	getInitialDataGridState,
	type IDataGridInitialStateProps,
} from "./DataGrid.reducers";
import { buildRowKeyResolver } from "./DataGrid.utils";

export interface IUseDataGridProps extends IDataGridInitialStateProps {
	onChange?: (change: IDataGridChange) => void;
}

export interface IUseDataGridResult {
	state: IDataGridState;
	actions: IDataGridActions;
}

/**
 * Initialises the DataGrid reducer + actions. Mirrors the
 * `useAuthInit` / `useSettingsInit` pattern from techtrips-ui.
 */
export const useDataGridInit = (
	props?: IUseDataGridProps,
): IUseDataGridResult => {
	const [state, dispatch] = useReducer(
		dataGridReducer,
		props,
		getInitialDataGridState,
	);

	const stateRef = useRef(state);
	stateRef.current = state;

	const onChangeRef = useRef(props?.onChange);
	onChangeRef.current = props?.onChange;

	const lastChangeRef = useRef<DataGridChangeKind | null>(null);

	const actions = useMemo<IDataGridActions>(() => {
		const wrappedDispatch: React.Dispatch<IDataGridDispatchActions> = (
			action,
		) => {
			lastChangeRef.current = ACTION_TO_CHANGE_KIND[action.type];
			dispatch(action);
		};
		return new DataGridActions(wrappedDispatch, () => stateRef.current);
	}, []);

	useEffect(() => {
		const kind = lastChangeRef.current;
		if (kind && onChangeRef.current) {
			onChangeRef.current({ kind, state });
		}
		lastChangeRef.current = null;
	}, [state]);

	return { state, actions };
};

/**
 * Memoised row-key resolver. Returns a stable function across renders unless
 * `getRowKey` or `itemKey` actually changes.
 */
export function useRowKeyResolver<T>(
	getRowKey: ((item: T, index: number) => string | number) | undefined,
	itemKey: (keyof T & string) | undefined,
) {
	return useCallback(buildRowKeyResolver(getRowKey, itemKey), [
		getRowKey,
		itemKey,
	]);
}

/**
 * Run all transform-bearing plugins in pipeline order, threading the items
 * through each `transform` and recording `pre:` / `post:` snapshots so other
 * plugins (e.g. status, pagination) can inspect intermediate stages.
 */
export function useProcessedItems<T>(args: {
	items: T[];
	columns: IDataGridColumn<T>[];
	allColumns: IDataGridColumn<T>[];
	plugins: IDataGridPlugin<T>[];
	state: IDataGridState;
	actions: IDataGridActions;
	resolveRowKey: (item: T, index: number) => string | number;
	scrollRef: React.MutableRefObject<HTMLDivElement | null>;
}): {
	processedItems: readonly T[];
	pipelineStages: Map<string, readonly T[]>;
	ctx: IDataGridContext<T>;
} {
	const {
		items,
		columns,
		allColumns,
		plugins,
		state,
		actions,
		resolveRowKey,
		scrollRef,
	} = args;

	const orderedPlugins = useMemo(
		() =>
			[...plugins]
				.filter((p) => typeof p.transform === "function")
				.sort(
					(a, b) =>
						(a.order ?? DATA_GRID_PIPELINE_ORDER.Filter) -
						(b.order ?? DATA_GRID_PIPELINE_ORDER.Filter),
				),
		[plugins],
	);

	const { processedItems, pipelineStages } = useMemo(() => {
		let current: readonly T[] = items;
		const stages = new Map<string, readonly T[]>();
		const baseCtx: IDataGridContext<T> = {
			state,
			actions,
			rawItems: items,
			columns,
			allColumns,
			processedItems: current,
			getRowKey: resolveRowKey,
			scrollRef,
			pipelineStages: stages,
		};
		for (const p of orderedPlugins) {
			stages.set(`pre:${p.id}`, current);
			// biome-ignore lint/style/noNonNullAssertion: filtered above
			current = p.transform!(current, {
				...baseCtx,
				processedItems: current,
			});
			stages.set(`post:${p.id}`, current);
		}
		return { processedItems: current, pipelineStages: stages };
	}, [
		items,
		columns,
		allColumns,
		state,
		actions,
		resolveRowKey,
		scrollRef,
		orderedPlugins,
	]);

	const ctx: IDataGridContext<T> = useMemo(
		() => ({
			state,
			actions,
			rawItems: items,
			columns,
			allColumns,
			processedItems,
			getRowKey: resolveRowKey,
			scrollRef,
			pipelineStages,
		}),
		[
			state,
			actions,
			items,
			columns,
			allColumns,
			processedItems,
			resolveRowKey,
			scrollRef,
			pipelineStages,
		],
	);

	return { processedItems, pipelineStages, ctx };
}

/**
 * Derive selection helpers (allSelected flag, toggle-all callback, mode flags)
 * from the current selection mode and processed items.
 */
export function useDataGridSelection<T>(args: {
	selectionMode: DataGridSelectionMode;
	processedItems: readonly T[];
	state: IDataGridState;
	actions: IDataGridActions;
	resolveRowKey: (item: T, index: number) => string | number;
}) {
	const { selectionMode, processedItems, state, actions, resolveRowKey } = args;

	const isMulti = selectionMode === DataGridSelectionMode.Multi;
	const isSingle = selectionMode === DataGridSelectionMode.Single;
	const hasSelection = isMulti || isSingle;

	const allSelected =
		isMulti &&
		processedItems.length > 0 &&
		processedItems.every((item, i) =>
			state.selection.has(resolveRowKey(item, i)),
		);

	const toggleAll = useCallback(() => {
		if (!isMulti) return;
		const next = new Set<string | number>();
		if (!allSelected) {
			processedItems.forEach((it, i) => next.add(resolveRowKey(it, i)));
		}
		actions.setSelection(next);
	}, [isMulti, allSelected, processedItems, resolveRowKey, actions]);

	return { isMulti, isSingle, hasSelection, allSelected, toggleAll };
}
