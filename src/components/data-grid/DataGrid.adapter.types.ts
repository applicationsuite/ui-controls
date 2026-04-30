/* =====================================================================
 *  Adapter primitive types — pure type declarations. Override these to
 *  render the DataGrid with any UI framework (Fluent UI, Material UI,
 *  Radix, plain CSS, etc.). Pass a `Partial<IDataGridAdapter>` to
 *  `<DataGrid adapter={...} />` or `<DataGridAdapterProvider>`; only the
 *  primitives you set are replaced.
 * ===================================================================== */

export type IDataGridIconName =
	| "chevron-down"
	| "chevron-up"
	| "chevron-right"
	| "sort-asc"
	| "sort-desc"
	| "sort-none"
	| "first-page"
	| "previous"
	| "next"
	| "last-page"
	| "close"
	| "filter"
	| "group"
	| "search"
	| "more"
	| "check"
	| "columns"
	| "download"
	| "refresh";

export interface IDataGridButtonProps
	extends React.ButtonHTMLAttributes<HTMLButtonElement> {
	variant?: "default" | "primary" | "subtle";
	active?: boolean;
}

export interface IDataGridInputProps
	extends React.InputHTMLAttributes<HTMLInputElement> {}

export interface IDataGridSelectProps
	extends React.SelectHTMLAttributes<HTMLSelectElement> {}

export interface IDataGridCheckboxProps
	extends Omit<React.InputHTMLAttributes<HTMLInputElement>, "type"> {}

export interface IDataGridLabelProps
	extends React.LabelHTMLAttributes<HTMLLabelElement> {}

export interface IDataGridIconProps
	extends React.HTMLAttributes<HTMLSpanElement> {
	name: IDataGridIconName;
	size?: number;
}

export interface IDataGridTagProps
	extends React.HTMLAttributes<HTMLSpanElement> {
	onDismiss?: () => void;
	dismissLabel?: string;
}

export interface IDataGridSpinnerProps
	extends React.HTMLAttributes<HTMLSpanElement> {
	size?: number;
	label?: string;
}

export interface IDataGridPopoverProps {
	open: boolean;
	onClose: () => void;
	"aria-label"?: string;
	children?: React.ReactNode;
	/**
	 * Ref to the trigger element. When provided, the popover positions
	 * itself relative to the trigger's bounding rect and renders into a
	 * portal so it can escape clipping `overflow: auto` ancestors (e.g.
	 * the grid's scroll container).
	 */
	anchorRef?: React.RefObject<HTMLElement | null>;
}

export interface IDataGridDrawerProps {
	open: boolean;
	onClose: () => void;
	side?: "left" | "right";
	title?: React.ReactNode;
	footer?: React.ReactNode;
	"aria-label"?: string;
	children?: React.ReactNode;
}

export interface IDataGridAdapter {
	Button: React.ComponentType<IDataGridButtonProps>;
	IconButton: React.ComponentType<IDataGridButtonProps>;
	Input: React.ComponentType<IDataGridInputProps>;
	Select: React.ComponentType<IDataGridSelectProps>;
	Checkbox: React.ComponentType<IDataGridCheckboxProps>;
	Label: React.ComponentType<IDataGridLabelProps>;
	Icon: React.ComponentType<IDataGridIconProps>;
	Tag: React.ComponentType<IDataGridTagProps>;
	Spinner: React.ComponentType<IDataGridSpinnerProps>;
	Popover: React.ComponentType<IDataGridPopoverProps>;
	Drawer: React.ComponentType<IDataGridDrawerProps>;
}
