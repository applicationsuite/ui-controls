import {
	ArrowDownward,
	ArrowUpward,
	Check,
	ChevronLeft,
	ChevronRight,
	Close,
	ExpandLess,
	ExpandMore,
	FilterList,
	FirstPage,
	LastPage,
	MoreVert,
	Search,
	UnfoldMore,
	ViewColumn,
	Download,
	Refresh,
} from "@mui/icons-material";
import {
	Button as MuiButton,
	Checkbox as MuiCheckbox,
	Chip as MuiChip,
	CircularProgress as MuiSpinner,
	Drawer as MuiDrawer,
	IconButton as MuiIconButton,
	InputLabel as MuiLabel,
	MenuItem,
	Popover as MuiPopover,
	Select as MuiSelect,
	TextField as MuiInput,
} from "@mui/material";
import { Children, useRef } from "react";
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

const ICONS: Record<
	IDataGridIconName,
	React.ComponentType<{ fontSize?: "inherit" | "small" | "medium" | "large" }>
> = {
	"chevron-down": ExpandMore,
	"chevron-up": ExpandLess,
	"chevron-right": ChevronRight,
	"sort-asc": ArrowUpward,
	"sort-desc": ArrowDownward,
	"sort-none": UnfoldMore,
	"first-page": FirstPage,
	previous: ChevronLeft,
	next: ChevronRight,
	"last-page": LastPage,
	close: Close,
	filter: FilterList,
	search: Search,
	more: MoreVert,
	check: Check,
	columns: ViewColumn,
	download: Download,
	refresh: Refresh,
};

export const muiAdapter: Partial<IDataGridAdapter> = {
	Button: ({
		variant = "default",
		active,
		type,
		children,
		onClick,
		disabled,
		className,
		style,
		"aria-label": ariaLabel,
	}: IDataGridButtonProps) => (
		<MuiButton
			size="small"
			variant={
				variant === "primary" || active
					? "contained"
					: variant === "subtle"
						? "text"
						: "outlined"
			}
			color={active ? "primary" : "inherit"}
			type={(type ?? "button") as "button" | "submit" | "reset"}
			onClick={onClick}
			disabled={disabled}
			className={className}
			style={style}
			aria-label={ariaLabel}
		>
			{children}
		</MuiButton>
	),
	IconButton: ({
		children,
		onClick,
		disabled,
		className,
		style,
		"aria-label": ariaLabel,
	}: IDataGridButtonProps) => (
		<MuiIconButton
			size="small"
			onClick={onClick}
			disabled={disabled}
			className={className}
			style={style}
			aria-label={ariaLabel}
		>
			{children}
		</MuiIconButton>
	),
	Input: ({
		value,
		onChange,
		type,
		placeholder,
		className,
		style,
	}: IDataGridInputProps) => (
		<MuiInput
			size="small"
			variant="outlined"
			value={value === undefined || value === null ? "" : String(value)}
			onChange={(e) => onChange?.(e as React.ChangeEvent<HTMLInputElement>)}
			type={(type as string) ?? "text"}
			placeholder={placeholder}
			className={className}
			style={style}
		/>
	),
	Select: ({
		value,
		onChange,
		children,
		className,
		style,
	}: IDataGridSelectProps) => {
		// Convert <option> children to <MenuItem>.
		const items = Children.map(children, (child) => {
			if (
				child &&
				typeof child === "object" &&
				"props" in child &&
				(child as { type?: unknown }).type === "option"
			) {
				const c = child as React.ReactElement<{
					value?: string | number;
					children?: React.ReactNode;
				}>;
				return (
					<MenuItem value={c.props.value ?? ""}>{c.props.children}</MenuItem>
				);
			}
			return child;
		});
		return (
			<MuiSelect
				size="small"
				value={value === undefined || value === null ? "" : String(value)}
				onChange={(e) =>
					onChange?.(e as unknown as React.ChangeEvent<HTMLSelectElement>)
				}
				className={className}
				style={style}
			>
				{items}
			</MuiSelect>
		);
	},
	Checkbox: ({
		checked,
		onChange,
		className,
		style,
		"aria-label": ariaLabel,
	}: IDataGridCheckboxProps) => (
		<MuiCheckbox
			size="small"
			checked={!!checked}
			onChange={(e) => onChange?.(e as React.ChangeEvent<HTMLInputElement>)}
			className={className}
			style={style}
			slotProps={{ input: { "aria-label": ariaLabel ?? undefined } }}
		/>
	),
	Label: ({ children, className, style }: IDataGridLabelProps) => (
		<MuiLabel shrink={false} className={className} style={style}>
			{children}
		</MuiLabel>
	),
	Icon: ({ name, size }: IDataGridIconProps) => {
		const Cmp = ICONS[name];
		const fs = size && size <= 16 ? "small" : "medium";
		return <Cmp fontSize={fs} />;
	},
	Tag: ({ children, onDismiss, dismissLabel }: IDataGridTagProps) => (
		<MuiChip
			size="small"
			label={children}
			onDelete={onDismiss}
			deleteIcon={onDismiss ? <Close aria-label={dismissLabel} /> : undefined}
		/>
	),
	Spinner: ({ size = 16, label }: IDataGridSpinnerProps) => (
		<MuiSpinner size={size} aria-label={label ?? "Loading"} />
	),
	Popover: ({
		open,
		onClose,
		children,
		"aria-label": ariaLabel,
	}: IDataGridPopoverProps) => {
		// MUI Popover needs an anchor element; we anchor to a hidden span placed
		// next to the trigger by using `useRef` on a sentinel span.
		const anchorRef = useRef<HTMLSpanElement>(null);
		return (
			<>
				<span ref={anchorRef} style={{ display: "none" }} />
				<MuiPopover
					open={open}
					anchorEl={anchorRef.current}
					onClose={onClose}
					anchorOrigin={{ vertical: "bottom", horizontal: "left" }}
					slotProps={{ paper: { "aria-label": ariaLabel } }}
				>
					<div style={{ padding: 12 }}>{children}</div>
				</MuiPopover>
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
	}: IDataGridDrawerProps) => (
		<MuiDrawer
			anchor={side === "left" ? "left" : "right"}
			open={open}
			onClose={onClose}
			aria-label={ariaLabel}
			slotProps={{ paper: { sx: { width: 420, maxWidth: "92vw" } } }}
		>
			{title !== undefined && (
				<header
					style={{
						display: "flex",
						alignItems: "center",
						justifyContent: "space-between",
						padding: "12px 16px",
						borderBottom: "1px solid #e0e0e0",
					}}
				>
					<h3 style={{ margin: 0, fontSize: 16, fontWeight: 500 }}>{title}</h3>
					<MuiIconButton size="small" onClick={onClose} aria-label="Close">
						<Close />
					</MuiIconButton>
				</header>
			)}
			<div style={{ flex: 1, overflow: "auto", padding: "12px 16px" }}>
				{children}
			</div>
			{footer && (
				<footer
					style={{
						display: "flex",
						alignItems: "center",
						gap: 8,
						padding: "12px 16px",
						borderTop: "1px solid #e0e0e0",
					}}
				>
					{footer}
				</footer>
			)}
		</MuiDrawer>
	),
};
