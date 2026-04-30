import type {
	IDataGridAdapter,
	IDataGridButtonProps,
	IDataGridCheckboxProps,
	IDataGridDrawerProps,
	IDataGridIconName,
	IDataGridIconProps,
	IDataGridInputProps,
	IDataGridLabelProps,
	IDataGridPopoverProps,
	IDataGridSelectProps,
	IDataGridSpinnerProps,
	IDataGridTagProps,
} from "@techtrips/ui-controls";
import "./material-like.css";

/**
 * Example adapter showing how to skin the DataGrid with a different design
 * system. This one mimics Material's filled buttons / floating-label inputs
 * using only CSS — drop-in replace with `@mui/material`, `@fluentui/react-components`,
 * `@radix-ui/themes`, etc., by mapping their components into the same shape.
 */

const ICONS: Record<IDataGridIconName, string> = {
	"chevron-down": "▾",
	"chevron-up": "▴",
	"chevron-right": "▸",
	"sort-asc": "↑",
	"sort-desc": "↓",
	"sort-none": "↕",
	"first-page": "⇤",
	previous: "‹",
	next: "›",
	"last-page": "⇥",
	close: "×",
	filter: "▼",
	search: "🔍",
	more: "⋮",
	check: "✓",
	columns: "☰",
	download: "⤓",
	refresh: "↻",
};

export const materialLikeAdapter: Partial<IDataGridAdapter> = {
	Button: ({
		variant = "default",
		active,
		className,
		type,
		...rest
	}: IDataGridButtonProps) => (
		<button
			type={type ?? "button"}
			className={[
				"mat-btn",
				`mat-btn--${variant}`,
				active ? "mat-btn--active" : "",
				className ?? "",
			]
				.filter(Boolean)
				.join(" ")}
			{...rest}
		/>
	),
	IconButton: ({ className, ...rest }: IDataGridButtonProps) => (
		<button
			type="button"
			className={["mat-icon-btn", className ?? ""].filter(Boolean).join(" ")}
			{...rest}
		/>
	),
	Input: ({ className, ...rest }: IDataGridInputProps) => (
		<span
			className={["mat-input-wrap", className ?? ""].filter(Boolean).join(" ")}
		>
			<input className="mat-input" {...rest} />
		</span>
	),
	Select: ({ className, children, ...rest }: IDataGridSelectProps) => (
		<span
			className={["mat-select-wrap", className ?? ""].filter(Boolean).join(" ")}
		>
			<select className="mat-select" {...rest}>
				{children}
			</select>
		</span>
	),
	Checkbox: ({ className, ...rest }: IDataGridCheckboxProps) => (
		<input
			type="checkbox"
			className={["mat-checkbox", className ?? ""].filter(Boolean).join(" ")}
			{...rest}
		/>
	),
	Label: ({ className, ...rest }: IDataGridLabelProps) => (
		<label
			className={["mat-label", className ?? ""].filter(Boolean).join(" ")}
			{...rest}
		/>
	),
	Icon: ({ name, size, className, style, ...rest }: IDataGridIconProps) => (
		<span
			aria-hidden="true"
			className={["mat-icon", className ?? ""].filter(Boolean).join(" ")}
			style={size ? { fontSize: size, ...style } : style}
			{...rest}
		>
			{ICONS[name]}
		</span>
	),
	Tag: ({
		onDismiss,
		dismissLabel,
		className,
		children,
		...rest
	}: IDataGridTagProps) => (
		<span
			className={["mat-chip", className ?? ""].filter(Boolean).join(" ")}
			{...rest}
		>
			{children}
			{onDismiss && (
				<button
					type="button"
					className="mat-chip-close"
					onClick={onDismiss}
					aria-label={dismissLabel ?? "Remove"}
				>
					×
				</button>
			)}
		</span>
	),
	Spinner: ({
		size = 16,
		label,
		className,
		style,
		...rest
	}: IDataGridSpinnerProps) => (
		<span
			role="status"
			aria-label={label ?? "Loading"}
			className={["mat-spinner", className ?? ""].filter(Boolean).join(" ")}
			style={{ width: size, height: size, ...style }}
			{...rest}
		/>
	),
	Popover: ({
		open,
		onClose,
		children,
		"aria-label": ariaLabel,
	}: IDataGridPopoverProps) => {
		if (!open) return null;
		return (
			<>
				<div
					className="mat-popover-backdrop"
					onClick={onClose}
					role="presentation"
				/>
				<div role="dialog" aria-label={ariaLabel} className="mat-popover">
					{children}
				</div>
			</>
		);
	},
	Drawer: ({
		open,
		onClose,
		side = "right",
		title,
		footer,
		"aria-label": ariaLabel,
		children,
	}: IDataGridDrawerProps) => {
		if (!open) return null;
		return (
			<>
				<div
					className="mat-drawer-backdrop"
					onClick={onClose}
					role="presentation"
				/>
				<aside
					className={`mat-drawer mat-drawer--${side}`}
					role="dialog"
					aria-modal="true"
					aria-label={ariaLabel}
				>
					{title !== undefined && (
						<header className="mat-drawer-head">
							<h3>{title}</h3>
							<button
								type="button"
								className="mat-icon-btn"
								onClick={onClose}
								aria-label="Close"
							>
								×
							</button>
						</header>
					)}
					<div className="mat-drawer-body">{children}</div>
					{footer && <footer className="mat-drawer-foot">{footer}</footer>}
				</aside>
			</>
		);
	},
};
