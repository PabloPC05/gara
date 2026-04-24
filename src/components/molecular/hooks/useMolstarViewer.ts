import {
	useEffect,
	useRef,
	type DependencyList,
	type MutableRefObject,
	type RefObject,
} from "react";
import { PluginContext } from "molstar/lib/mol-plugin/context.js";
import { DefaultPluginSpec } from "molstar/lib/mol-plugin/spec.js";

interface UseMolstarViewerParams {
	setup?: (plugin: PluginContext) => Promise<(() => void) | void>;
	deps?: DependencyList;
}

interface UseMolstarViewerReturn {
	containerRef: RefObject<HTMLDivElement | null>;
	pluginRef: MutableRefObject<PluginContext | null>;
}

export function useMolstarViewer({
	setup,
	deps = [],
}: UseMolstarViewerParams): UseMolstarViewerReturn {
	const containerRef = useRef<HTMLDivElement | null>(null);
	const pluginRef = useRef<PluginContext | null>(null);
	const mounted = useRef(false);

	useEffect(() => {
		if (mounted.current) return;
		const container = containerRef.current;
		if (!container) return;
		mounted.current = true;

		let active = true;

		const roRef = { current: null as ResizeObserver | null };
		const extraCleanupRef = { current: null as (() => void) | null };

		const spec = DefaultPluginSpec();
		spec.layout = {
			initial: {
				isExpanded: false,
				showControls: false,
				regionState: {
					bottom: "hidden",
					left: "hidden",
					right: "hidden",
					top: "hidden",
				},
			},
		};

		const plugin = new PluginContext(spec);

		plugin
			.init()
			.then(async () => {
				try {
					if (!active) {
						plugin.dispose();
						return;
					}

					const canvas = document.createElement("canvas");
					canvas.style.cssText =
						"position:absolute;inset:0;width:100%;height:100%;display:block";
					container.insertBefore(canvas, container.firstChild);

					const ok = await plugin.initViewerAsync(canvas, container);
					if (!ok || !active) {
						plugin.dispose();
						container.innerHTML = "";
						return;
					}

					pluginRef.current = plugin;

					roRef.current = new ResizeObserver(() => {
						if (plugin.canvas3d) {
							plugin.canvas3d.handleResize();
						}
					});
					roRef.current.observe(container);

					if (setup) {
						const result = await setup(plugin);
						if (typeof result === "function") {
							extraCleanupRef.current = result;
						}
					}
				} catch (err) {
					if (!String(err).includes("already added")) {
						console.error("[Mol*] Error durante init:", err);
					}
				}
			})
			.catch((err) => {
				if (!String(err).includes("already added")) {
					console.error("[Mol*] Plugin init rechazado:", err);
				}
			});

		return () => {
			active = false;
			mounted.current = false;
			roRef.current?.disconnect();
			if (typeof extraCleanupRef.current === "function") {
				extraCleanupRef.current();
			}
			pluginRef.current?.dispose();
			pluginRef.current = null;
			if (container) container.innerHTML = "";
		};
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, deps);

	return { containerRef, pluginRef };
}
