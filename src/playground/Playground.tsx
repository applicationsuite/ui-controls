import { FluentProvider, webLightTheme } from "@fluentui/react-components";
import { useState } from "react";
import "../themes/index.css";
import { DataGridPlayground } from "./DataGridPlayground";
import "./Playground.css";

interface IPage {
	id: string;
	label: string;
	render: () => React.ReactNode;
}

const PAGES: IPage[] = [
	{
		id: "datagrid",
		label: "DataGrid",
		render: () => <DataGridPlayground />,
	},
];

export function Playground() {
	const [activeId, setActiveId] = useState(PAGES[0].id);
	const active = PAGES.find((p) => p.id === activeId) ?? PAGES[0];

	return (
		<FluentProvider theme={webLightTheme}>
			<div className="pg-app">
				<aside className="pg-side">
					<h1>ui-controls playground</h1>
					{PAGES.map((p) => (
						<button
							key={p.id}
							type="button"
							className={`pg-nav-btn ${
								p.id === activeId ? "pg-nav-btn--active" : ""
							}`}
							onClick={() => setActiveId(p.id)}
						>
							{p.label}
						</button>
					))}
				</aside>
				<main className="pg-main">{active.render()}</main>
			</div>
		</FluentProvider>
	);
}
