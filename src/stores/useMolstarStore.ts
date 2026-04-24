import { create } from "zustand";
import type { MutableRefObject } from "react";
import type { PluginContext } from "molstar/lib/mol-plugin/context";

interface MolstarState {
	pluginRef: MutableRefObject<PluginContext | null> | null;
	setPluginRef: (ref: MutableRefObject<PluginContext | null> | null) => void;
	clearPluginRef: () => void;
}

export const useMolstarStore = create<MolstarState>()((set) => ({
	pluginRef: null,
	setPluginRef: (ref) => set({ pluginRef: ref }),
	clearPluginRef: () => set({ pluginRef: null }),
}));
