import type { useFastaBarEditor } from "../hooks/useFastaBarEditor";
import { SequenceCarouselRowLayout } from "./SequenceCarouselRowLayout";

type EditorReturn = ReturnType<typeof useFastaBarEditor>;

export function ComparisonRowsLayout({ editor }: { editor: EditorReturn }) {
  return (
    <div className="flex min-w-0 flex-col overflow-hidden border-y border-zinc-200/50 bg-black/5 pb-1.5">
      {editor.validSelectedIds.slice(0, 2).map((pid: string) => {
        const p = editor.proteinsById[pid];
        if (!p) return null;
        const fr = editor.focusedResidueByProtein[pid];
        return (
          <SequenceCarouselRowLayout
            key={pid}
            proteinId={pid}
            sequence={p.sequence ?? ""}
            focusedSeqId={fr?.seqId ?? null}
            canSelect={editor.canSelect}
            onSelect={editor.handleSelect}
            onDeselect={editor.handleDeselect}
            onApiReady={(api) => editor.registerApi(pid, api)}
            label={p.name || pid}
            showNav
          />
        );
      })}
    </div>
  );
}
