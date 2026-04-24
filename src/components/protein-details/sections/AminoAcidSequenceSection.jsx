import { useState } from "react";
import { Download, FlaskConical } from "lucide-react";
import { Button } from "@/components/ui/button";
import { SectionContainerLayout } from "../layout/SectionContainerLayout";
import { intFmt, safeFilename, downloadBlob } from "../utils/dataFormatters";
import { ChemicalBackboneSection } from "./ChemicalBackboneSection";

const BLOCK_SIZE = 10;
const BLOCKS_PER_ROW = 5;
const ROW_SIZE = BLOCK_SIZE * BLOCKS_PER_ROW;

function buildRows(sequence) {
  const rows = [];
  for (let i = 0; i < sequence.length; i += ROW_SIZE) {
    const chunk = sequence.slice(i, i + ROW_SIZE);
    const blocks = [];
    for (let j = 0; j < chunk.length; j += BLOCK_SIZE) {
      blocks.push(chunk.slice(j, j + BLOCK_SIZE));
    }
    rows.push({ start: i + 1, blocks });
  }
  return rows;
}

export function AminoAcidSequenceSection({ v }) {
  const sequence = (v.sequence ?? "").replace(/\s+/g, "").toUpperCase();
  const [showChem, setShowChem] = useState(false);

  if (!sequence) return null;

  const rows = buildRows(sequence);

  const handleDownload = () => {
    const content =
      v.fastaReady ??
      `>${v.name ?? "protein"}\n${sequence.replace(/(.{60})/g, "$1\n")}\n`;
    downloadBlob(content, `${safeFilename(v.name)}.fasta`, "text/plain");
  };

  return (
    <SectionContainerLayout title="Secuencia" aside={`${intFmt.format(sequence.length)} aa`}>
      <div
        style={{
          maxWidth: "100%",
          overflow: "hidden",
          overflowY: "auto",
          height: 128,
        }}
        className="w-full border border-slate-200 bg-slate-50/40 p-2 font-mono text-[10px] leading-[1.6] text-slate-700"
      >
        {rows.map((row) => (
          <div key={row.start} className="flex gap-2">
            <span className="w-8 shrink-0 text-right tabular-nums text-slate-400">
              {row.start}
            </span>
            <span className="break-all">{row.blocks.join(" ")}</span>
          </div>
        ))}
      </div>

      <div className="mt-1.5 flex flex-wrap items-center gap-1">
        <Button
          variant="outline"
          size="sm"
          onClick={() => setShowChem((x) => !x)}
          className="h-6 rounded-none border border-slate-200 px-2 py-1 text-[10px] font-medium text-slate-600 hover:border-slate-400 hover:text-slate-900"
        >
          <FlaskConical className="mr-1 h-3 w-3" strokeWidth={2} />
          {showChem ? "Ocultar estructura química" : "Ver estructura química"}
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={handleDownload}
          className="h-6 rounded-none border border-slate-200 px-2 py-1 text-[10px] font-medium text-slate-600 hover:border-slate-400 hover:text-slate-900"
        >
          <Download className="mr-1 h-3 w-3" strokeWidth={2} />
          Descargar FASTA
        </Button>
      </div>

      {showChem && (
        <div className="mt-2 overflow-x-auto border border-slate-200 bg-white">
          <ChemicalBackboneSection sequence={sequence} />
        </div>
      )}
    </SectionContainerLayout>
  );
}
