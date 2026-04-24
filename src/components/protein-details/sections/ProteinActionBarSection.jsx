import { useState } from "react";
import { Download, FileText, Image, Terminal } from "lucide-react";
import { Button } from "@/components/ui/button";
import ExportDriveButton from "../../ExportDriveButton";
import { safeFilename, downloadBlob } from "../utils/dataFormatters";
import { useMolstarStore } from "@/stores/useMolstarStore";
import { exportViewerImage } from "@/lib/exportImage";
import { exportProteinPdf } from "@/lib/exportPdf";

export function ProteinActionBarSection({ protein, v }) {
	const hasPdb = !!v.pdbFile;
	const hasLogs = !!v.logs;
	const [showLogs, setShowLogs] = useState(false);
	const pluginRef = useMolstarStore((s) => s.pluginRef);

	const handleExportImage = async () => {
		const plugin = pluginRef?.current;
		if (!plugin) return;
		try {
			await exportViewerImage(plugin, {
				scale: 2,
				format: "png",
				transparent: false,
				filename: safeFilename(v.name),
			});
		} catch (e) {
			console.error("Export image failed:", e);
		}
	};

	const handleExportPdf = async () => {
		const plugin = pluginRef?.current ?? null;
		try {
			await exportProteinPdf(protein, plugin);
		} catch (e) {
			console.error("Export PDF failed:", e);
		}
	};

	return (
		<div className="min-w-0 shrink-0 space-y-2 overflow-hidden border-t border-slate-100 bg-white px-5 py-3">
			<ExportDriveButton
				proteinData={protein}
				summary={`Análisis: ${protein.name}\nOrganismo: ${protein.organism || "N/A"}\nLongitud: ${protein.length} aa`}
				paeData={protein?._raw?.structural_data?.confidence?.pae_matrix}
				metrics={{
					Proteína: protein.name,
					Organismo: protein.organism,
					"Longitud (aa)": protein.length,
					"pLDDT Medio": protein.plddtMean,
					"PAE Medio": protein.meanPae,
					"ID UniProt": protein.uniprotId,
					"ID PDB": protein.pdbId,
				}}
			/>

			<div className="flex min-w-0 gap-2">
				<Button
					variant="default"
					disabled={!hasPdb}
					onClick={() =>
						downloadBlob(
							v.pdbFile,
							`${safeFilename(v.name)}.pdb`,
							"chemical/x-pdb",
						)
					}
					className="h-9 min-w-0 flex-1 rounded-none bg-blue-600 px-3 py-2 text-[10px] font-bold uppercase tracking-wider text-white shadow-lg shadow-blue-200/60 hover:bg-blue-700"
				>
					<Download className="mr-1.5 h-3 w-3 shrink-0" strokeWidth={2.5} />
					PDB
				</Button>
				<Button
					variant="outline"
					disabled={!pluginRef}
					onClick={handleExportImage}
					className="h-9 min-w-0 flex-1 rounded-none border border-slate-200 bg-white px-3 py-2 text-[10px] font-bold uppercase tracking-wider text-slate-600 shadow-sm hover:bg-slate-50"
				>
					<Image className="mr-1.5 h-3 w-3 shrink-0" strokeWidth={2.5} />
					PNG
				</Button>
				<Button
					variant="outline"
					disabled={!pluginRef}
					onClick={handleExportPdf}
					className="h-9 min-w-0 flex-1 rounded-none border border-slate-200 bg-white px-3 py-2 text-[10px] font-bold uppercase tracking-wider text-slate-600 shadow-sm hover:bg-slate-50"
				>
					<FileText className="mr-1.5 h-3 w-3 shrink-0" strokeWidth={2.5} />
					PDF
				</Button>
			</div>

			<Button
				variant="outline"
				disabled={!hasLogs}
				onClick={() => setShowLogs((x) => !x)}
				className="h-9 w-full rounded-none border border-slate-200 bg-white px-3 py-2 text-[10px] font-bold uppercase tracking-wider text-slate-600 shadow-sm hover:bg-slate-50"
			>
				<Terminal className="mr-1.5 h-3 w-3" strokeWidth={2.5} />
				{showLogs ? "Ocultar logs" : "Ver logs HPC"}
			</Button>

			{showLogs && hasLogs && (
				<div className="mt-2 max-h-40 overflow-y-auto border border-slate-200 bg-slate-900 p-3">
					<div className="mb-1.5 flex items-center gap-1.5">
						<FileText className="h-3 w-3 text-slate-500" strokeWidth={2} />
						<span className="text-[9px] font-bold uppercase tracking-widest text-slate-500">
							Logs HPC
						</span>
					</div>
					<pre className="whitespace-pre-wrap font-mono text-[10px] leading-relaxed text-emerald-400">
						{v.logs}
					</pre>
				</div>
			)}
		</div>
	);
}
