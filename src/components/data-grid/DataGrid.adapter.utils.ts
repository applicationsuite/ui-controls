import type { IDataGridIconName } from "./DataGrid.adapter.types";

/** Class-name combinator: drop falsy parts and join with spaces. */
export const cn = (...parts: Array<string | undefined | false>) =>
	parts.filter(Boolean).join(" ") || undefined;

/** Default unicode glyphs used by the native adapter when no icon library
 * is configured. Adapter implementations are free to map `IDataGridIconName`
 * to anything (SVGs, glyph fonts, etc.). */
export const ICON_GLYPH: Record<IDataGridIconName, string> = {
	"chevron-down": "▾",
	"chevron-up": "▴",
	"chevron-right": "▸",
	"sort-asc": "↑",
	"sort-desc": "↓",
	"sort-none": "↕",
	"first-page": "«",
	previous: "‹",
	next: "›",
	"last-page": "»",
	close: "×",
	filter: "⏷",
	group: "▦",
	search: "🔍",
	more: "⋯",
	check: "✓",
	columns: "☰",
	download: "⤓",
	refresh: "↻",
};
