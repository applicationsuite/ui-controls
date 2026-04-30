import {
	Button as FluentButton,
	Checkbox as FluentCheckbox,
	Drawer as FluentDrawer,
	DrawerBody as FluentDrawerBody,
	DrawerFooter as FluentDrawerFooter,
	DrawerHeader as FluentDrawerHeader,
	DrawerHeaderTitle as FluentDrawerHeaderTitle,
	Input as FluentInput,
	Label as FluentLabel,
	Popover as FluentPopover,
	PopoverSurface as FluentPopoverSurface,
	Select as FluentSelect,
	Spinner as FluentSpinner,
	Tag as FluentTag,
	type ButtonProps as FluentButtonProps,
} from "@fluentui/react-components";
import {
	ArrowDownRegular,
	ArrowSortRegular,
	ArrowUpRegular,
	AppsListRegular,
	ArrowClockwiseRegular,
	ArrowDownloadRegular,
	CheckmarkRegular,
	ChevronDoubleLeftRegular,
	ChevronDoubleRightRegular,
	ChevronDownRegular,
	ChevronLeftRegular,
	ChevronRightRegular,
	ChevronUpRegular,
	DismissRegular,
	FilterRegular,
	MoreVerticalRegular,
	SearchRegular,
} from "@fluentui/react-icons";
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
} from "../../components/data-grid";

const ICONS: Record<
	IDataGridIconName,
	React.ComponentType<{ fontSize?: number | string }>
> = {
	"chevron-down": ChevronDownRegular,
	"chevron-up": ChevronUpRegular,
	"chevron-right": ChevronRightRegular,
	"sort-asc": ArrowUpRegular,
	"sort-desc": ArrowDownRegular,
	"sort-none": ArrowSortRegular,
	"first-page": ChevronDoubleLeftRegular,
	previous: ChevronLeftRegular,
	next: ChevronRightRegular,
	"last-page": ChevronDoubleRightRegular,
	close: DismissRegular,
	filter: FilterRegular,
	search: SearchRegular,
	more: MoreVerticalRegular,
	check: CheckmarkRegular,
	columns: AppsListRegular,
	download: ArrowDownloadRegular,
	refresh: ArrowClockwiseRegular,
};

const VARIANT_TO_APPEARANCE: Record<
	NonNullable<IDataGridButtonProps["variant"]>,
	FluentButtonProps["appearance"]
> = {
	default: "secondary",
	primary: "primary",
	subtle: "subtle",
};

export const fluentAdapter: Partial<IDataGridAdapter> = {
	Button: ({ variant = "default", active, type, children, ...rest }) => (
		<FluentButton
			appearance={
				active ? "primary" : (VARIANT_TO_APPEARANCE[variant] ?? "secondary")
			}
			type={(type ?? "button") as "button" | "submit" | "reset"}
			{...(rest as FluentButtonProps)}
		>
			{children}
		</FluentButton>
	),
	IconButton: ({ children, type, ...rest }: IDataGridButtonProps) => (
		<FluentButton
			appearance="subtle"
			type={(type ?? "button") as "button" | "submit" | "reset"}
			{...(rest as FluentButtonProps)}
		>
			{children}
		</FluentButton>
	),
	Input: ({
		value,
		onChange,
		type,
		placeholder,
		className,
		...rest
	}: IDataGridInputProps) => (
		<FluentInput
			value={value === undefined || value === null ? "" : String(value)}
			onChange={(_e, data) => {
				if (!onChange) return;
				const synthetic = {
					target: { value: data.value },
					currentTarget: { value: data.value },
				} as unknown as React.ChangeEvent<HTMLInputElement>;
				onChange(synthetic);
			}}
			type={(type as never) ?? "text"}
			placeholder={placeholder}
			className={className}
			{...(rest as Record<string, unknown>)}
		/>
	),
	Select: ({
		children,
		value,
		onChange,
		className,
		...rest
	}: IDataGridSelectProps) => (
		<FluentSelect
			value={value === undefined || value === null ? "" : String(value)}
			onChange={(e) =>
				onChange?.(e as unknown as React.ChangeEvent<HTMLSelectElement>)
			}
			className={className}
			{...(rest as Record<string, unknown>)}
		>
			{children}
		</FluentSelect>
	),
	Checkbox: ({ checked, onChange, ...rest }: IDataGridCheckboxProps) => (
		<FluentCheckbox
			checked={!!checked}
			onChange={(_e, data) => {
				if (!onChange) return;
				const synthetic = {
					target: { checked: !!data.checked, value: "" },
					currentTarget: { checked: !!data.checked, value: "" },
				} as unknown as React.ChangeEvent<HTMLInputElement>;
				onChange(synthetic);
			}}
			{...(rest as Record<string, unknown>)}
		/>
	),
	Label: ({ children, ...rest }: IDataGridLabelProps) => (
		<FluentLabel {...(rest as Record<string, unknown>)}>{children}</FluentLabel>
	),
	Icon: ({ name, size }: IDataGridIconProps) => {
		const Cmp = ICONS[name];
		return <Cmp fontSize={size ?? 16} />;
	},
	Tag: ({ children, onDismiss, dismissLabel }: IDataGridTagProps) => (
		<FluentTag
			dismissible={!!onDismiss}
			dismissIcon={{ "aria-label": dismissLabel ?? "Remove" }}
			onClick={(e) => {
				// Fluent's Tag fires onClick when dismiss button is hit; rely on it.
				if (onDismiss && (e.target as HTMLElement).closest("[aria-label]")) {
					onDismiss();
				}
			}}
		>
			{children}
		</FluentTag>
	),
	Spinner: ({ size = 16, label }: IDataGridSpinnerProps) => (
		<FluentSpinner
			size={size <= 16 ? "tiny" : size <= 24 ? "small" : "medium"}
			label={label}
		/>
	),
	Popover: ({
		open,
		onClose,
		children,
		"aria-label": ariaLabel,
	}: IDataGridPopoverProps) => (
		<FluentPopover
			open={open}
			onOpenChange={(_e, data) => {
				if (!data.open) onClose();
			}}
			positioning="below-start"
		>
			<FluentPopoverSurface aria-label={ariaLabel}>
				{children}
			</FluentPopoverSurface>
		</FluentPopover>
	),
	Drawer: ({
		open,
		onClose,
		side = "right",
		title,
		footer,
		"aria-label": ariaLabel,
		children,
	}: IDataGridDrawerProps) => (
		<FluentDrawer
			type="overlay"
			separator
			position={side === "left" ? "start" : "end"}
			open={open}
			onOpenChange={(_e, { open: next }) => {
				if (!next) onClose();
			}}
			aria-label={ariaLabel}
		>
			{title !== undefined && (
				<FluentDrawerHeader>
					<FluentDrawerHeaderTitle>{title}</FluentDrawerHeaderTitle>
				</FluentDrawerHeader>
			)}
			<FluentDrawerBody>{children}</FluentDrawerBody>
			{footer && <FluentDrawerFooter>{footer}</FluentDrawerFooter>}
		</FluentDrawer>
	),
};
