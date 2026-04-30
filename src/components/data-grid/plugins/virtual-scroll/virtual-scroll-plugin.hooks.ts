import { useEffect, useState } from "react";

/**
 * Subscribe to a scroll container's `scrollTop` and `clientHeight`,
 * throttled via `requestAnimationFrame`. Re-measures on container
 * resize via `ResizeObserver`.
 */
export function useScrollMetrics(
	scrollRef: React.RefObject<HTMLDivElement | null>,
): { scrollTop: number; viewportHeight: number } {
	const [metrics, setMetrics] = useState({ scrollTop: 0, viewportHeight: 0 });

	useEffect(() => {
		const el = scrollRef.current;
		if (!el) return;

		let frame = 0;
		const read = () => {
			frame = 0;
			setMetrics((prev) =>
				prev.scrollTop === el.scrollTop &&
				prev.viewportHeight === el.clientHeight
					? prev
					: { scrollTop: el.scrollTop, viewportHeight: el.clientHeight },
			);
		};

		const schedule = () => {
			if (frame) return;
			frame = requestAnimationFrame(read);
		};

		read();

		el.addEventListener("scroll", schedule, { passive: true });

		const ro =
			typeof ResizeObserver !== "undefined"
				? new ResizeObserver(schedule)
				: null;
		ro?.observe(el);

		return () => {
			el.removeEventListener("scroll", schedule);
			ro?.disconnect();
			if (frame) cancelAnimationFrame(frame);
		};
	}, [scrollRef]);

	return metrics;
}
