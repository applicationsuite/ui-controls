import { useEffect, useMemo, useState } from "react";
import {
	DataGrid,
	DataGridSelectionMode,
	createFilterPlugin,
	createGroupPlugin,
	createColumnVisibilityPlugin,
	createInfiniteScrollPlugin,
	createPaginationPlugin,
	createSearchPlugin,
	createSortPlugin,
	createStatusPlugin,
	type IDataGridAdapter,
	type IDataGridChange,
	type IDataGridColumn,
	type IDataGridPlugin,
} from "../components/data-grid";
import { generatePeople, type IPerson } from "./data";
import { fluentAdapter } from "../../examples/adapters/fluent-adapter";
import { materialLikeAdapter } from "../../examples/adapters/material-like-adapter";
import { muiAdapter } from "../../examples/adapters/mui-adapter";

type PagingMode = "none" | "pagination" | "infinite";
type Mode = "client" | "server";
type FilterPanelMode = "off" | "on";
type StatusPosition = "off" | "subtoolbar" | "toolbar" | "footer";
type AdapterKind = "native" | "material-like" | "fluent" | "mui";

const ADAPTERS: Record<AdapterKind, Partial<IDataGridAdapter> | undefined> = {
	native: undefined,
	"material-like": materialLikeAdapter,
	fluent: fluentAdapter,
	mui: muiAdapter,
};

const TOOLBAR_SLOTS = [
	"sort",
	"filter",
	"group",
	"status",
	"columnVisibility",
	"search",
] as const;
type ToolbarSlot = (typeof TOOLBAR_SLOTS)[number];

type ToolbarSide = "left" | "right";
type ToolbarPlacement = Record<ToolbarSlot, ToolbarSide>;

const THEMES = ["light", "dark", "auto", "fluent", "material"] as const;
type ThemeKind = (typeof THEMES)[number];

interface IFlags {
	search: boolean;
	filter: boolean;
	sort: boolean;
	group: boolean;
	pagingMode: PagingMode;
	multiSelect: boolean;
	multiLevelSort: boolean;
	searchMode: Mode;
	filterMode: Mode;
	sortMode: Mode;
	groupMode: Mode;
	pagingModeKind: Mode;
	filterPanel: FilterPanelMode;
	status: StatusPosition;
	toolbarOrder: ToolbarSlot[];
	toolbarPlacement: ToolbarPlacement;
	adapter: AdapterKind;
	theme: ThemeKind;
}

const DEFAULT_FLAGS: IFlags = {
	search: true,
	filter: true,
	sort: true,
	group: true,
	pagingMode: "pagination",
	multiSelect: true,
	multiLevelSort: true,
	searchMode: "client",
	filterMode: "client",
	sortMode: "client",
	groupMode: "client",
	pagingModeKind: "client",
	filterPanel: "on",
	status: "toolbar",
	toolbarOrder: [
		"status",
		"sort",
		"group",
		"filter",
		"columnVisibility",
		"search",
	],
	toolbarPlacement: {
		sort: "right",
		filter: "right",
		group: "right",
		status: "left",
		columnVisibility: "right",
		search: "right",
	},
	adapter: "native",
	theme: "light",
};

const COLUMNS: IDataGridColumn<IPerson>[] = [
	{
		id: "id",
		name: "#",
		field: "id",
		width: 60,
		align: "start",
		sortable: true,
		required: true,
	},
	{
		id: "name",
		name: "Name",
		field: "name",
		sortable: true,
		searchable: true,
		minWidth: 160,
		required: true,
	},
	{
		id: "email",
		name: "Email",
		field: "email",
		searchable: true,
		minWidth: 220,
		required: true,
	},
	{
		id: "department",
		name: "Department",
		field: "department",
		sortable: true,
		filterable: true,
		groupable: true,
	},
	{
		id: "role",
		name: "Role",
		field: "role",
		sortable: true,
		filterable: true,
		groupable: true,
	},
	{
		id: "location",
		name: "Location",
		field: "location",
		sortable: true,
		filterable: true,
		groupable: true,
	},
	{
		id: "salary",
		name: "Salary",
		field: "salary",
		sortable: true,
		align: "end",
		defaultVisible: false,
		renderCell: (it) => `$${it.salary.toLocaleString()}`,
	},
	{ id: "joinedOn", name: "Joined", field: "joinedOn", sortable: true },
	{
		id: "active",
		name: "Active",
		field: "active",
		filterable: true,
		align: "center",
		meta: {
			filter: {
				type: "checkbox",
				items: [
					{ value: true, label: "Active" },
					{ value: false, label: "Inactive" },
				],
			},
		},
		renderCell: (it) => (it.active ? "✅" : "—"),
	},
];

export function DataGridPlayground() {
	const [flags, setFlags] = useState<IFlags>(DEFAULT_FLAGS);
	const [lastChange, setLastChange] = useState<IDataGridChange | null>(null);
	const allItems = useMemo(() => generatePeople(500), []);

	// Simulated server state for infinite-scroll server mode.
	const [serverLoaded, setServerLoaded] = useState(25);
	const isInfiniteServer =
		flags.pagingMode === "infinite" && flags.pagingModeKind === "server";

	// Reset server-loaded count when entering infinite-server mode.
	useEffect(() => {
		if (isInfiniteServer) setServerLoaded(25);
	}, [isInfiniteServer]);

	const items = useMemo(
		() => (isInfiniteServer ? allItems.slice(0, serverLoaded) : allItems),
		[allItems, isInfiniteServer, serverLoaded],
	);

	const plugins = useMemo(() => {
		const list: IDataGridPlugin<IPerson>[] = [];
		if (flags.search)
			list.push(
				createSearchPlugin({
					debounceMs: 150,
					serverSide: flags.searchMode === "server",
				}),
			);
		if (flags.filter)
			list.push(
				createFilterPlugin({
					serverSide: flags.filterMode === "server",
					panel: flags.filterPanel === "on",
				}),
			);
		if (flags.sort)
			list.push(
				createSortPlugin({
					allowMultiLevel: flags.multiLevelSort,
					serverSide: flags.sortMode === "server",
				}),
			);
		if (flags.group)
			list.push(
				createGroupPlugin({ serverSide: flags.groupMode === "server" }),
			);
		list.push(createColumnVisibilityPlugin());
		if (flags.pagingMode === "pagination") {
			list.push(
				createPaginationPlugin({
					pageSizeOptions: [10, 25, 50, 100],
					serverSide: flags.pagingModeKind === "server",
				}),
			);
		} else if (flags.pagingMode === "infinite") {
			const serverSide = flags.pagingModeKind === "server";
			list.push(
				createInfiniteScrollPlugin({
					initialChunkSize: 25,
					chunkSize: 25,
					thresholdPx: 150,
					serverSide,
					...(serverSide && {
						hasMore: (loaded: number) => loaded < allItems.length,
						onLoadMore: ({ nextChunk }: { nextChunk: number }) =>
							new Promise<void>((resolve) =>
								setTimeout(() => {
									setServerLoaded((n) =>
										Math.min(allItems.length, n + nextChunk),
									);
									resolve();
								}, 250),
							),
					}),
				}),
			);
		}
		if (flags.status !== "off") {
			list.push(
				createStatusPlugin({
					position: flags.status as "subtoolbar" | "toolbar" | "footer",
				}),
			);
		}
		return list;
	}, [flags, allItems]);

	const toggleBool = (key: keyof IFlags) =>
		setFlags((f) => {
			const v = f[key];
			if (typeof v === "boolean") return { ...f, [key]: !v };
			return f;
		});

	const setMode = (key: keyof IFlags, value: Mode) =>
		setFlags((f) => ({ ...f, [key]: value }));

	const featureRows: {
		id: string;
		flag: keyof IFlags;
		modeKey: keyof IFlags;
	}[] = [
		{ id: "Search", flag: "search", modeKey: "searchMode" },
		{ id: "Filter", flag: "filter", modeKey: "filterMode" },
		{ id: "Sort", flag: "sort", modeKey: "sortMode" },
		{ id: "Group", flag: "group", modeKey: "groupMode" },
	];

	return (
		<div>
			<div className="pg-page-header">
				<div>
					<h2>DataGrid</h2>
					<p>
						Each feature can run client-side (in-memory) or server-side (host
						handles via <code>onChange</code>).
					</p>
				</div>
			</div>

			<div className="pg-card">
				<h3>Features</h3>
				<table className="pg-feature-table">
					<thead>
						<tr>
							<th>Feature</th>
							<th>Enabled</th>
							<th>Mode</th>
						</tr>
					</thead>
					<tbody>
						{featureRows.map(({ id, flag, modeKey }) => (
							<tr key={id}>
								<td>{id}</td>
								<td>
									<input
										type="checkbox"
										checked={flags[flag] as boolean}
										onChange={() => toggleBool(flag)}
									/>
								</td>
								<td>
									{(["client", "server"] as Mode[]).map((m) => (
										<label key={m} style={{ marginInlineEnd: 8 }}>
											<input
												type="radio"
												name={`mode-${id}`}
												checked={flags[modeKey] === m}
												disabled={!flags[flag]}
												onChange={() => setMode(modeKey, m)}
											/>{" "}
											{m}
										</label>
									))}
								</td>
							</tr>
						))}
						<tr>
							<td>Paging</td>
							<td>
								{(["none", "pagination", "infinite"] as PagingMode[]).map(
									(m) => (
										<label key={m} style={{ marginInlineEnd: 8 }}>
											<input
												type="radio"
												name="pagingMode"
												checked={flags.pagingMode === m}
												onChange={() =>
													setFlags((f) => ({ ...f, pagingMode: m }))
												}
											/>{" "}
											{m}
										</label>
									),
								)}
							</td>
							<td>
								{(["client", "server"] as Mode[]).map((m) => (
									<label key={m} style={{ marginInlineEnd: 8 }}>
										<input
											type="radio"
											name="paging-mode-kind"
											checked={flags.pagingModeKind === m}
											disabled={flags.pagingMode === "none"}
											onChange={() => setMode("pagingModeKind", m)}
										/>{" "}
										{m}
									</label>
								))}
							</td>
						</tr>
					</tbody>
				</table>
				<div className="pg-options" style={{ marginTop: 12 }}>
					<strong>Filter panel:</strong>
					{(["off", "on"] as FilterPanelMode[]).map((m) => (
						<label key={m}>
							<input
								type="radio"
								name="filterPanel"
								checked={flags.filterPanel === m}
								disabled={!flags.filter}
								onChange={() => setFlags((f) => ({ ...f, filterPanel: m }))}
							/>
							<span>{m}</span>
						</label>
					))}
				</div>
				<div className="pg-options" style={{ marginTop: 8 }}>
					<label>
						<input
							type="checkbox"
							checked={flags.multiSelect}
							onChange={() => toggleBool("multiSelect")}
						/>
						<span>multi-select</span>
					</label>
					<label>
						<input
							type="checkbox"
							checked={flags.multiLevelSort}
							onChange={() => toggleBool("multiLevelSort")}
						/>
						<span>multi-level sort (shift-click)</span>
					</label>
				</div>
				<div className="pg-options" style={{ marginTop: 8 }}>
					<strong>Status message:</strong>
					{(["off", "subtoolbar", "toolbar", "footer"] as StatusPosition[]).map(
						(m) => (
							<label key={m}>
								<input
									type="radio"
									name="status"
									checked={flags.status === m}
									onChange={() => setFlags((f) => ({ ...f, status: m }))}
								/>
								<span>{m}</span>
							</label>
						),
					)}
				</div>
				<div className="pg-options" style={{ marginTop: 8 }}>
					<strong>UI adapter:</strong>
					{(["native", "material-like", "fluent", "mui"] as AdapterKind[]).map(
						(m) => (
							<label key={m}>
								<input
									type="radio"
									name="adapter"
									checked={flags.adapter === m}
									onChange={() => setFlags((f) => ({ ...f, adapter: m }))}
								/>
								<span>{m}</span>
							</label>
						),
					)}
				</div>
				<div className="pg-options" style={{ marginTop: 8 }}>
					<strong>Theme:</strong>
					{THEMES.map((t) => (
						<label key={t}>
							<input
								type="radio"
								name="theme"
								checked={flags.theme === t}
								onChange={() => setFlags((f) => ({ ...f, theme: t }))}
							/>
							<span>{t}</span>
						</label>
					))}
				</div>
				<div className="pg-options" style={{ marginTop: 8 }}>
					<strong>Toolbar order &amp; alignment:</strong>
					{flags.toolbarOrder.map((id, i) => (
						<span key={id} className="pg-order-chip">
							<span>{id}</span>
							<button
								type="button"
								disabled={i === 0}
								onClick={() =>
									setFlags((f) => {
										const next = [...f.toolbarOrder];
										[next[i - 1], next[i]] = [next[i], next[i - 1]];
										return { ...f, toolbarOrder: next };
									})
								}
								aria-label={`Move ${id} earlier`}
							>
								◀
							</button>
							<button
								type="button"
								disabled={i === flags.toolbarOrder.length - 1}
								onClick={() =>
									setFlags((f) => {
										const next = [...f.toolbarOrder];
										[next[i + 1], next[i]] = [next[i], next[i + 1]];
										return { ...f, toolbarOrder: next };
									})
								}
								aria-label={`Move ${id} later`}
							>
								▶
							</button>
							<button
								type="button"
								className="pg-side-toggle"
								onClick={() =>
									setFlags((f) => ({
										...f,
										toolbarPlacement: {
											...f.toolbarPlacement,
											[id]:
												f.toolbarPlacement[id] === "left" ? "right" : "left",
										},
									}))
								}
								aria-label={`Toggle ${id} side`}
							>
								{flags.toolbarPlacement[id] === "left" ? "L" : "R"}
							</button>
						</span>
					))}
					<button
						type="button"
						className="dgv-button"
						onClick={() =>
							setFlags((f) => ({
								...f,
								toolbarOrder: [...TOOLBAR_SLOTS],
								toolbarPlacement: DEFAULT_FLAGS.toolbarPlacement,
							}))
						}
					>
						Reset
					</button>
				</div>
			</div>

			<div className="pg-card">
				<h3>Grid ({items.length} items)</h3>
				<DataGrid
					items={items}
					columns={COLUMNS}
					itemKey="id"
					plugins={plugins}
					adapter={ADAPTERS[flags.adapter]}
					theme={flags.theme}
					toolbarOrder={{
						left: flags.toolbarOrder.filter(
							(id) => flags.toolbarPlacement[id] === "left",
						),
						right: flags.toolbarOrder.filter(
							(id) => flags.toolbarPlacement[id] === "right",
						),
					}}
					selectionMode={
						flags.multiSelect
							? DataGridSelectionMode.Multi
							: DataGridSelectionMode.Single
					}
					initialState={
						flags.pagingMode === "infinite"
							? { page: { index: 0, size: 25 } }
							: undefined
					}
					className={
						flags.pagingMode === "infinite" ? "dgv-fixed-height" : undefined
					}
					onChange={setLastChange}
					ariaLabel="People grid"
				/>
			</div>

			<div className="pg-card">
				<h3>
					Last change event (this is what your server handler would receive)
				</h3>
				<pre className="pg-pre">
					{lastChange
						? JSON.stringify(
								{
									kind: lastChange.kind,
									sort: lastChange.state.sort,
									filters: lastChange.state.filters,
									search: lastChange.state.search,
									page: lastChange.state.page,
									groupBy: lastChange.state.groupBy,
									selection: [...lastChange.state.selection],
								},
								null,
								2,
							)
						: "(interact with the grid to see change events)"}
				</pre>
			</div>
		</div>
	);
}
