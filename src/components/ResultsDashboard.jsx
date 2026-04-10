import MolecularViewer from './MolecularViewer'
import PLDDTPanel from './PLDDTPanel'
import PAEHeatmap from './PAEHeatmap'
import BiologicalCards from './BiologicalCards'
import HPCAccounting from './HPCAccounting'

export default function ResultsDashboard({ data, onReset }) {
  const { protein, jobId, plddt, biological, hpc } = data

  return (
    <div className="py-4">

      {/* ── Header del resultado ─────────────────────────────────── */}
      <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-8 mb-12">
        <div className="max-w-2xl">
          {/* Status pill */}
          <div className="flex items-center gap-4 mb-6">
            <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.15em] text-emerald-600 bg-emerald-50 border border-emerald-100 rounded-full px-4 py-1.5 shadow-sm">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
              Predicción Finalizada
            </div>
            <span className="text-[10px] font-black uppercase tracking-widest text-slate-300 border-l border-slate-200 pl-4">{jobId}</span>
          </div>

          {/* Nombre de proteína */}
          <h2 className="text-5xl font-black text-slate-900 leading-[1.1] tracking-tight mb-4">
            {protein.name}
          </h2>
          <div className="flex flex-wrap items-center gap-6">
            {[
              { label: 'UniProt ID', value: protein.uniprotId, icon: '🆔' },
              { label: 'Organismo', value: protein.organism, icon: '🧬' },
              { label: 'Longitud', value: `${protein.length} Aminoácidos`, icon: '📏' },
            ].map(item => (
              <div key={item.label} className="flex items-center gap-2 bg-white/40 px-3 py-1.5 rounded-xl border border-white/60 shadow-sm">
                <span className="text-xs">{item.icon}</span>
                <span className="text-[10px] font-black uppercase tracking-tight text-slate-400">{item.label}:</span>
                <span className="text-xs font-bold text-slate-700">{item.value}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Acciones */}
        <div className="flex items-center gap-4 shrink-0">
          <button
            disabled
            title="Disponible tras integrar el visor 3D"
            className="text-xs font-black uppercase tracking-widest bg-white border-2 border-slate-100 text-slate-300 cursor-not-allowed px-6 py-4 rounded-2xl transition-all flex items-center gap-3 opacity-60"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
            </svg>
            Descargar PDB
          </button>
          <button
            onClick={onReset}
            className="text-xs font-black uppercase tracking-widest bg-slate-900 hover:bg-blue-600
              text-white px-8 py-4 rounded-2xl transition-all flex items-center gap-3 shadow-xl shadow-slate-200 hover:shadow-blue-200 hover:-translate-y-0.5 active:translate-y-0"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M12 4v16m8-8H4" />
            </svg>
            Nueva Predicción
          </button>
        </div>
      </div>

      {/* ── Fila 1: Visor 3D (2/3) + pLDDT (1/3) ─────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-8">
        <div className="lg:col-span-2">
          <MolecularViewer />
        </div>
        <div className="lg:col-span-1">
          <PLDDTPanel data={plddt} />
        </div>
      </div>

      {/* ── Fila 2: PAE Heatmap (1/2) + Datos biológicos (1/2) ──── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
        <PAEHeatmap />
        <BiologicalCards data={biological} />
      </div>

      {/* ── Fila 3: Contabilidad HPC (ancho completo) ────────────── */}
      <HPCAccounting data={hpc} />
    </div>
  )
}
