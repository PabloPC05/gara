import type { useFastaBarEditor } from "../hooks/useFastaBarEditor";
import { SCROLL_JUMP } from "../utils/fastaBarConstants";
import { ChevronLeft, ChevronRight } from "../utils/fastaBarIcons";
import { SequenceCarouselRowLayout } from "./SequenceCarouselRowLayout";

type EditorReturn = ReturnType<typeof useFastaBarEditor>;

export function SingleRowLayout({ editor }: { editor: EditorReturn }) {
  const inDraftMode = editor.draftSequence.length > 0;

  return (
    <div className="flex min-w-0 items-center overflow-hidden border-y border-zinc-200/50 bg-black/5">
      <button
        onClick={() => editor.scrollAllBy(-SCROLL_JUMP)}
        className="flex w-8 shrink-0 items-center justify-center self-stretch border-r border-zinc-200/50 text-zinc-500 transition-colors hover:bg-zinc-200/50 hover:text-zinc-700"
        aria-label="Anterior"
      >
        <ChevronLeft />
      </button>

      <div className="min-w-0 flex-1 overflow-hidden">
        <SequenceCarouselRowLayout
          proteinId={editor.activeProteinId}
          sequence={editor.displaySequence}
          focusedSeqId={
            editor.activeProteinId
              ? (editor.focusedResidueByProtein[editor.activeProteinId]
                  ?.seqId ?? null)
              : null
          }
          canSelect={editor.canSelect}
          onSelect={editor.handleSelect}
          onDeselect={editor.handleDeselect}
          onApiReady={(api) =>
            editor.registerApi(editor.activeProteinId ?? "_single", api)
          }
          editSelectedIndex={inDraftMode ? editor.selectedIndex : undefined}
          onEditSelect={inDraftMode ? editor.setSelectedIndex : undefined}
        />
      </div>

      <button
        onClick={() => editor.scrollAllBy(SCROLL_JUMP)}
        className="flex w-10 shrink-0 items-center justify-center self-stretch border-l border-zinc-200/50 text-zinc-500 transition-colors hover:bg-zinc-200/50 hover:text-zinc-700"
        aria-label="Siguiente"
      >
        <ChevronRight />
      </button>
    </div>
  );
}
