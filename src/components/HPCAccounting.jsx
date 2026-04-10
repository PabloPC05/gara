const METRICS = (data) => [
  {
    label: 'CPU Hours',
    value: data.cpuHours.toFixed(3),
    unit: 'h',
    description: 'Preprocesamiento y MSA',
    color: 'text-indigo-600',
    bg: 'bg-indigo-50',
    border: 'border-indigo-100',
    icon: (
      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5}
          d="M9 3H5a2 2 0 00-2 2v4m6-6h10a2 2 0 012 2v4M9 3v18m0 0h10a2 2 0 002-2V9M9 21H5a2 2 0 01-2-2V9m0 0h18" />
      </svg>
    ),
  },
  {
    label: 'GPU Hours',
    value: data.gpuHours.toFixed(3),
    unit: 'h',
    description: 'Inferencia AlphaFold2',
    color: 'text-blue-600',
    bg: 'bg-blue-50',
    border: 'border-blue-100',
    icon: (
      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5}
          d="M13 10V3L4 14h7v7l9-11h-7z" />
      </svg>
    ),
  },
  {
    label: 'Memoria RAM',
    value: data.memoryGb.toFixed(2),
    unit: 'GB',
    description: 'RAM del nodo GPU',
    color: 'text-emerald-600',
    bg: 'bg-emerald-50',
    border: 'border-emerald-100',
    icon: (
      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5}
          d="M4 7v10c0 2.21 3.582 4 8 4s8-1.79 8-4V7M4 7c0 2.21 3.582 4 8 4s8-1.79 8-4M4 7c0-2.21 3.582-4 8-4s8 1.79 8 4" />
      </svg>
    ),
  },
  {
    label: 'Clúster',
    value: data.cluster,
    unit: '',
    description: 'Nodo asignado',
    color: 'text-amber-600',
    bg: 'bg-amber-50',
    border: 'border-amber-100',
    icon: (
      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5}
          d="M5 12H3m2 0a2 2 0 104 0m-4 0a2 2 0 114 0m0 0h6m0 0a2 2 0 104 0m-4 0a2 2 0 114 0m0 0h2" />
      </svg>
    ),
  },
]

export default function HPCAccounting({ data }) {
  const metrics = METRICS(data)

  const completedDate = new Date(data.completedAt).toLocaleString('es-ES', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })

  return (
    <div className="card overflow-hidden">
      {/* ── Header ───────────────────────────────────────────────── */}
      <div className="card-header justify-between border-b-0 pt-8 px-8">
        <div className="flex items-center gap-4">
          <div className="w-10 h-10 rounded-xl bg-amber-50 flex items-center justify-center text-amber-600 shadow-sm border border-amber-100">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
          </div>
          <div>
            <h3 className="font-black text-slate-900 text-sm uppercase tracking-widest">Recursos Computacionales</h3>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-tight">Transparencia de Ejecución HPC</p>
          </div>
        </div>
        <div className="text-[10px] font-black uppercase tracking-widest text-slate-400 bg-slate-50 px-4 py-2 rounded-full border border-slate-100">
          Finalizado: <span className="text-slate-900">{completedDate}</span>
        </div>
      </div>

      <div className="p-8">
        {/* ── Métricas ─────────────────────────────────────────────── */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-8">
          {metrics.map((m) => (
            <div key={m.label} className={`rounded-3xl border-2 ${m.bg} ${m.border} p-6 flex flex-col gap-4 hover:shadow-xl hover:shadow-slate-100 transition-all duration-300 group`}>
              <div className={`${m.color} group-hover:scale-110 transition-transform`}>{m.icon}</div>
              <div>
                <div className={`text-2xl font-black ${m.color} leading-none tracking-tight`}>
                  {m.value}
                  {m.unit && (
                    <span className="text-xs font-black ml-1 uppercase opacity-60">{m.unit}</span>
                  )}
                </div>
                <div className="text-[10px] font-black text-slate-900 uppercase tracking-widest mt-2">{m.label}</div>
                <div className="text-[10px] font-bold text-slate-400 uppercase mt-0.5">{m.description}</div>
              </div>
            </div>
          ))}
        </div>

        {/* ── Estimación de coste ───────────────────────────────────── */}
        <div className="bg-slate-50 border-2 border-slate-100 rounded-3xl p-8 flex flex-col lg:flex-row items-start lg:items-center justify-between gap-8 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-500/5 rounded-full blur-3xl -mr-32 -mt-32" />
          
          <div className="flex-1 relative z-10">
            <div className="flex items-center gap-4 mb-3">
              <div className="text-sm font-black text-slate-900 uppercase tracking-widest">Coste de Computación</div>
              <span className="text-[10px] font-black uppercase tracking-widest bg-emerald-500 text-white px-3 py-1 rounded-full shadow-lg shadow-emerald-200">
                100% Subsidiado
              </span>
            </div>
            <p className="text-xs text-slate-500 font-medium max-w-xl leading-relaxed">
              BioHack cubre el coste total de la infraestructura para investigadores. 
              Este trabajo habría tenido un coste de mercado aproximado de <span className="text-slate-900 font-bold">$2.50 USD</span> en servicios cloud comerciales.
            </p>

            {/* Desglose de tarifas */}
            <div className="mt-6 grid grid-cols-3 gap-4">
              {[
                { label: 'CPU Cluster', cost: `$${(data.cpuHours * 0.04).toFixed(4)}`, sub: '$0.04/h' },
                { label: 'GPU A100', cost: `$${(data.gpuHours * 3.20).toFixed(4)}`, sub: '$3.20/h' },
                { label: 'RAM VRT', cost: `$${(data.memoryGb * 0.01).toFixed(4)}`, sub: '$0.01/GB/h' },
              ].map(item => (
                <div key={item.label} className="bg-white rounded-2xl p-4 border border-slate-100 shadow-sm group hover:border-blue-100 transition-colors">
                  <div className="text-[10px] font-black text-slate-400 uppercase tracking-tighter mb-1">{item.label}</div>
                  <div className="text-sm font-black text-slate-900">{item.cost}</div>
                  <div className="text-[9px] font-bold text-slate-300 uppercase mt-0.5">{item.sub}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Total */}
          <div className="text-center lg:text-right shrink-0 bg-white border-2 border-emerald-100 rounded-3xl px-10 py-8 shadow-xl shadow-emerald-100/50 relative z-10">
            <div className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-2">Coste Final</div>
            <div className="text-5xl font-black text-emerald-500 tracking-tighter">$0.00</div>
            <div className="text-[10px] font-black text-emerald-600/60 uppercase tracking-widest mt-2">Acceso Gratuito</div>
          </div>
        </div>

        {/* ── Nota de transparencia ─────────────────────────────────── */}
        <p className="text-[10px] font-bold text-slate-300 uppercase tracking-widest text-center mt-8">
          Iniciativa de Democratización Científica · BioHack Global Network
        </p>
      </div>
    </div>
  )
}
