import { useEffect } from "react";
import { useFastaBarEditor } from "./hooks/useFastaBarEditor";
import { AminoAcidGridPicker } from "../left-sidebar/widgets/AminoAcidGridPicker";
import { KeyboardIcon } from "./utils/fastaBarIcons";
import { ComparisonRowsLayout } from "./layout/ComparisonRowsLayout";
import { SingleRowLayout } from "./layout/SingleRowLayout";
import { useLayoutStore } from "../../stores/useLayoutStore";
import { useProteinStore } from "@/stores/useProteinStore";
import { useViewerConfigStore } from "@/stores/useViewerConfigStore";

export function FastaBar() {
	const editor = useFastaBarEditor();

	useEffect(() => {
		const handleGlobalArrow = (e: KeyboardEvent) => {
			if (e.key !== "ArrowLeft" && e.key !== "ArrowRight") return;
			const tag = (e.target as HTMLElement).tagName;
			if (tag === "INPUT" || tag === "TEXTAREA") return;

			const viewerState = useViewerConfigStore.getState() as Record<
				string,
				any
			>;
			const focusedResidueByProtein =
				viewerState.focusedResidueByProtein as Record<
					string,
					{ seqId: number } | null
				>;
			const setFocusedResidue = viewerState.setFocusedResidue as (
				pid: string,
				r: { seqId: number } | null,
			) => void;

			const proteinState = useProteinStore.getState();
			const selectedProteinIds = proteinState.selectedProteinIds as string[];
			const proteinsById = proteinState.proteinsById as Record<
				string,
				{ sequence?: string }
			>;

			let targetPid: string | null = null;
			let currentSeqId = 0;
			for (const pid of selectedProteinIds) {
				const fr = focusedResidueByProtein[pid];
				if (fr?.seqId) {
					targetPid = pid;
					currentSeqId = fr.seqId;
					break;
				}
			}
			if (!targetPid) return;

			const seq = (proteinsById[targetPid] as { sequence?: string })?.sequence;
			if (!seq) return;

			e.preventDefault();
			const next =
				e.key === "ArrowLeft"
					? Math.max(1, currentSeqId - 1)
					: Math.min(seq.length, currentSeqId + 1);
			if (next !== currentSeqId) setFocusedResidue(targetPid, { seqId: next });
		};

		window.addEventListener("keydown", handleGlobalArrow);
		return () => window.removeEventListener("keydown", handleGlobalArrow);
	}, []);
	const activeTab = useLayoutStore((s) => s.activeTab);
	const detailsPanelOpen = useLayoutStore((s) => s.detailsPanelOpen);

	const leftOpen = activeTab !== null;
	const leftW = leftOpen ? "var(--left-sidebar-width, 22rem)" : "0px";
	const rightW = detailsPanelOpen ? "var(--right-sidebar-width, 26rem)" : "0px";

	const headerLabel =
		editor.draftSequence.length > 0
			? "Editando Borrador"
			: editor.showComparison
				? "Comparación"
				: "Secuencia";

	return (
		<>
			<div
				data-slot="fasta-bar"
				data-testid="fasta-bar"
				tabIndex={0}
				onFocus={() => editor.setFocused(true)}
				onBlur={() => editor.setFocused(false)}
				onKeyDownCapture={editor.handleKeyDownCapture}
				onKeyDown={editor.handleKeyDown}
				style={{
					marginLeft: leftW,
					marginRight: rightW,
					maxWidth: `max(200px, calc(100% - ${leftW} - ${rightW}))`,
					minWidth: "200px",
					transition: "margin 140ms ease-out, max-width 140ms ease-out",
				}}
				className={[
					"flex min-w-0 shrink-0 overflow-hidden outline-none",
					"border-b",
					editor.focused
						? "border-zinc-400 bg-white/95"
						: "border-zinc-300 bg-[#e4e4e7]/95",
				].join(" ")}
			>
				<div className="flex min-w-0 flex-1 flex-col justify-center">
					<div className="flex items-center gap-2 px-3 py-1">
						<span className="text-[9px] font-bold uppercase tracking-[0.15em] text-zinc-500">
							{headerLabel}
						</span>
						{!editor.showComparison && editor.displaySequence.length > 0 && (
							<span className="text-[9px] text-zinc-400">
								{editor.displaySequence.length} aa
							</span>
						)}
					</div>

					{editor.showComparison ? (
						<ComparisonRowsLayout editor={editor} />
					) : (
						<SingleRowLayout editor={editor} />
					)}
				</div>

				<button
					onClick={editor.toggleKeyboard}
					className={[
						"flex w-10 shrink-0 items-center justify-center border-l transition-colors",
						editor.isPickerOpen
							? "bg-zinc-200/60 text-zinc-600 hover:bg-zinc-300/60"
							: "text-zinc-400 hover:bg-zinc-300/40 hover:text-zinc-600",
					].join(" ")}
					title={
						editor.isPickerOpen
							? "Cerrar teclado"
							: "Abrir teclado de aminoácidos"
					}
				>
					<KeyboardIcon />
				</button>
			</div>

			<AminoAcidGridPicker
				open={editor.isPickerOpen}
				onOpenChange={editor.handleSheetOpenChange}
				onAppendLetter={editor.handlePickerAppendLetter}
				onDeleteLast={editor.handlePickerDeleteLast}
				onClear={editor.handleClearDraft}
				onConfirm={editor.handleConfirm}
				canConfirm={editor.canProcess}
			/>

			<style>{`
        [data-resizing="true"] [data-slot="fasta-bar"] {
          transition: none !important;
        }
      `}</style>
		</>
	);
}
