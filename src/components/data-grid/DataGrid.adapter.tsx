import {
	createContext,
	useContext,
	useEffect,
	useLayoutEffect,
	useRef,
	useState,
} from "react";
import { createPortal } from "react-dom";
import type {
	IDataGridAdapter,
	IDataGridButtonProps,
	IDataGridCheckboxProps,
	IDataGridDrawerProps,
	IDataGridIconProps,
	IDataGridInputProps,
	IDataGridLabelProps,
	IDataGridPopoverProps,
	IDataGridSelectProps,
	IDataGridSpinnerProps,
	IDataGridTagProps,
} from "./DataGrid.adapter.types";
import { ICON_GLYPH, cn } from "./DataGrid.adapter.utils";

/* Re-exports so consumers can keep importing from "./DataGrid.adapter". */
export type {
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
} from "./DataGrid.adapter.types";

/* ---------- native primitive components (presentational only) ---------- */

const NativeButton: React.FC<IDataGridButtonProps> = ({
	variant = "default",
	active,
	className,
	type,
	...rest
}) => (
	<button
		type={type ?? "button"}
		className={cn(
			"dgv-button",
			variant !== "default" && `dgv-button--${variant}`,
			className,
		)}
		data-active={active || undefined}
		{...rest}
	/>
);

const NativeIconButton: React.FC<IDataGridButtonProps> = ({
	className,
	...rest
}) => (
	<NativeButton
		variant="subtle"
		className={cn("dgv-icon-button", className)}
		{...rest}
	/>
);

const NativeInput: React.FC<IDataGridInputProps> = ({ className, ...rest }) => (
	<input className={cn("dgv-input", className)} {...rest} />
);

const NativeSelect: React.FC<IDataGridSelectProps> = ({
	className,
	children,
	...rest
}) => (
	<select className={cn("dgv-select", className)} {...rest}>
		{children}
	</select>
);

const NativeCheckbox: React.FC<IDataGridCheckboxProps> = ({
	className,
	...rest
}) => (
	<input type="checkbox" className={cn("dgv-checkbox", className)} {...rest} />
);

const NativeLabel: React.FC<IDataGridLabelProps> = ({ className, ...rest }) => (
	<label className={cn("dgv-label", className)} {...rest} />
);

const NativeIcon: React.FC<IDataGridIconProps> = ({
	name,
	size,
	className,
	style,
	...rest
}) => (
	<span
		aria-hidden="true"
		className={cn("dgv-icon", className)}
		style={size ? { fontSize: size, ...style } : style}
		{...rest}
	>
		{ICON_GLYPH[name]}
	</span>
);

const NativeTag: React.FC<IDataGridTagProps> = ({
	onDismiss,
	dismissLabel,
	className,
	children,
	...rest
}) => (
	<span className={cn("dgv-tag", className)} {...rest}>
		{children}
		{onDismiss && (
			<button
				type="button"
				className="dgv-tag-close"
				onClick={onDismiss}
				aria-label={dismissLabel ?? "Remove"}
			>
				×
			</button>
		)}
	</span>
);

const NativeSpinner: React.FC<IDataGridSpinnerProps> = ({
	size = 14,
	label,
	className,
	style,
	...rest
}) => (
	<span
		role="status"
		aria-label={label ?? "Loading"}
		className={cn("dgv-spinner", className)}
		style={{ width: size, height: size, ...style }}
		{...rest}
	/>
);

const NativePopover: React.FC<IDataGridPopoverProps> = ({
	open,
	onClose,
	children,
	"aria-label": ariaLabel,
	anchorRef,
}) => {
	const [pos, setPos] = useState<{ top: number; left: number } | null>(null);
	const popoverRef = useRef<HTMLDivElement | null>(null);

	useLayoutEffect(() => {
		if (!open) {
			setPos(null);
			return;
		}
		const anchor = anchorRef?.current;
		if (!anchor || typeof window === "undefined") return;

		const update = () => {
			const r = anchor.getBoundingClientRect();
			const popover = popoverRef.current;
			const popoverWidth = popover?.offsetWidth ?? 220;
			const popoverHeight = popover?.offsetHeight ?? 0;
			const margin = 8;
			const spaceBelow = window.innerHeight - r.bottom;

			// Flip above the trigger when there isn't enough room below.
			let top =
				popoverHeight > 0 && spaceBelow < popoverHeight + margin
					? r.top - popoverHeight - 4
					: r.bottom + 4;
			top = Math.max(margin, top);

			// Clamp horizontally to the viewport so right-edge triggers don't
			// push the menu off-screen.
			let left = r.left;
			if (left + popoverWidth + margin > window.innerWidth) {
				left = Math.max(margin, window.innerWidth - popoverWidth - margin);
			}
			left = Math.max(margin, left);

			setPos({ top, left });
		};

		update();
		// Re-measure once the popover has rendered so flip math has the real
		// height. A second rAF guards against rare layout-thrash cases.
		const raf = requestAnimationFrame(update);

		window.addEventListener("scroll", update, true);
		window.addEventListener("resize", update);
		return () => {
			cancelAnimationFrame(raf);
			window.removeEventListener("scroll", update, true);
			window.removeEventListener("resize", update);
		};
	}, [open, anchorRef]);

	useEffect(() => {
		if (!open) return;
		const onKey = (e: KeyboardEvent) => {
			if (e.key === "Escape") onClose();
		};
		window.addEventListener("keydown", onKey);
		return () => window.removeEventListener("keydown", onKey);
	}, [open, onClose]);

	if (!open) return null;
	if (typeof document === "undefined") return null;

	// Until we've measured the trigger, render the popover off-screen so
	// it doesn't flash at the wrong location. Anchor-less callers fall
	// back to the legacy inline behaviour (no portal).
	const anchored = !!anchorRef;
	const style: React.CSSProperties | undefined = anchored
		? pos
			? {
					position: "fixed",
					top: pos.top,
					left: pos.left,
				}
			: { position: "fixed", top: -9999, left: -9999, visibility: "hidden" }
		: undefined;

	// Stop click propagation on both the backdrop and popover surface.
	// The popover is portaled in the DOM, but React synthetic events still
	// bubble through the React tree — so without this, a click on the
	// backdrop would bubble up to ancestor handlers (e.g. a header
	// `<button onClick={toggleSort}>` that wraps the filter trigger),
	// causing unrelated state changes when the user merely closes the popover.
	const stop = (e: React.MouseEvent) => e.stopPropagation();
	const node = (
		<>
			<div
				className="dgv-popover-backdrop"
				onClick={(e) => {
					e.stopPropagation();
					onClose();
				}}
				role="presentation"
			/>
			<div
				ref={popoverRef}
				role="dialog"
				aria-label={ariaLabel}
				className="dgv-popover"
				style={style}
				onClick={stop}
			>
				{children}
			</div>
		</>
	);
	if (!anchored) return node;
	// Portal into the nearest `.dgv-root` so CSS custom properties (theme
	// tokens like `--dgv-bg`) resolve. Falling back to `document.body`
	// would render the popover with no background / borders because those
	// vars are scoped to the grid root.
	const portalTarget =
		anchorRef?.current?.closest<HTMLElement>(".dgv-root") ?? document.body;
	return createPortal(node, portalTarget);
};

const NativeDrawer: React.FC<IDataGridDrawerProps> = ({
	open,
	onClose,
	side = "right",
	title,
	footer,
	"aria-label": ariaLabel,
	children,
}) => {
	if (!open) return null;
	return (
		<>
			<div
				className="dgv-drawer-backdrop"
				onClick={onClose}
				role="presentation"
			/>
			<aside
				className={`dgv-drawer dgv-drawer--${side}`}
				role="dialog"
				aria-modal="true"
				aria-label={ariaLabel}
			>
				{title !== undefined && (
					<header className="dgv-drawer-head">
						<h3>{title}</h3>
						<button
							type="button"
							className="dgv-button"
							onClick={onClose}
							aria-label="Close"
						>
							×
						</button>
					</header>
				)}
				<div className="dgv-drawer-body">{children}</div>
				{footer && <footer className="dgv-drawer-foot">{footer}</footer>}
			</aside>
		</>
	);
};

export const defaultDataGridAdapter: IDataGridAdapter = {
	Button: NativeButton,
	IconButton: NativeIconButton,
	Input: NativeInput,
	Select: NativeSelect,
	Checkbox: NativeCheckbox,
	Label: NativeLabel,
	Icon: NativeIcon,
	Tag: NativeTag,
	Spinner: NativeSpinner,
	Popover: NativePopover,
	Drawer: NativeDrawer,
};

/* ---------- context provider + hook ---------- */

const DataGridAdapterContext = createContext<IDataGridAdapter>(
	defaultDataGridAdapter,
);

export interface IDataGridAdapterProviderProps {
	adapter?: Partial<IDataGridAdapter>;
	children: React.ReactNode;
}

/**
 * Override one or more DataGrid UI primitives for the subtree. Pass a
 * `Partial<IDataGridAdapter>` to override only the pieces you want; the rest
 * fall back to the native defaults.
 */
export function DataGridAdapterProvider(props: IDataGridAdapterProviderProps) {
	const parent = useContext(DataGridAdapterContext);
	const merged: IDataGridAdapter = props.adapter
		? { ...parent, ...props.adapter }
		: parent;
	return (
		<DataGridAdapterContext.Provider value={merged}>
			{props.children}
		</DataGridAdapterContext.Provider>
	);
}

export function useDataGridAdapter(): IDataGridAdapter {
	return useContext(DataGridAdapterContext);
}
