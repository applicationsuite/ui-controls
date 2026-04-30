import { useEffect, useState } from "react";
import type { IDataGridContext } from "../../DataGrid.plugin";

/**
 * Local debounced search input state. Mirrors `ctx.state.search`, debounces
 * outgoing updates by `options.debounceMs` (default 200ms), and exposes a
 * setter for the input field to call on each keystroke.
 */
export function useDebouncedSearch<T>(
	ctx: IDataGridContext<T>,
	debounceMs: number | undefined,
): [string, (next: string) => void] {
	const [value, setValue] = useState(ctx.state.search);
	useEffect(() => setValue(ctx.state.search), [ctx.state.search]);

	useEffect(() => {
		if (value === ctx.state.search) return;
		const ms = debounceMs ?? 200;
		const t = setTimeout(() => ctx.actions.setSearch(value), ms);
		return () => clearTimeout(t);
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [value]);

	return [value, setValue];
}
