import { useDataGridAdapter } from "../../DataGrid.adapter";
import {
	DATA_GRID_PIPELINE_ORDER,
	type IDataGridContext,
	type IDataGridPlugin,
} from "../../DataGrid.plugin";
import { useDebouncedSearch } from "./search-plugin.hooks";
import type { ISearchPluginOptions } from "./search-plugin.types";
import { applySearch } from "./search-plugin.utils";

export type { ISearchPluginOptions } from "./search-plugin.types";

function SearchToolbar<T>({
	ctx,
	options,
}: {
	ctx: IDataGridContext<T>;
	options: ISearchPluginOptions;
}) {
	const { Input } = useDataGridAdapter();
	const [value, setValue] = useDebouncedSearch(ctx, options.debounceMs);
	return (
		<Input
			type="search"
			className="dgv-search-input"
			placeholder={options.placeholder ?? "Search…"}
			value={value}
			onChange={(e) => setValue(e.target.value)}
			aria-label="Search"
		/>
	);
}

export function createSearchPlugin<T>(
	options: ISearchPluginOptions = {},
): IDataGridPlugin<T> {
	return {
		id: "search",
		order: DATA_GRID_PIPELINE_ORDER.Search,
		transform: (items, ctx) => applySearch(items, ctx, options),
		Toolbar: ({ ctx }) => <SearchToolbar ctx={ctx} options={options} />,
	};
}
