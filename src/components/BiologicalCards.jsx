const CARDS = (data) => [
  {
    title: 'Solubilidad',
    value: `${data.solubility}/100`,
    badge: data.solubilityLabel,
    badgeOk: true,
    description: 'Probabilidad de que la proteína sea soluble al expresarse en E. coli. Calculado con SOLpro.',
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 21a7 7 0 000-14c-2.5 0-4.6 1.3-5.8 3.2M12 3v4M8 5l4 2 4-2" />
      </svg>
    ),
    barValue: data.solubility,
    barColor: 'bg-emerald-500',
    accentColor: 'border-l-emerald-500',
  },
  {
    title: 'Índice de Inestabilidad',
    value: data.instabilityIndex.toFixed(1),
    badge: data.instabilityLabel,
    badgeOk: data.instabilityIndex < 40,
    description: 'Valores < 40 predicen proteína estable in vivo. Método de Guruprasad (1990).',
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M3 17l4-8 4 4 4-6 4 4" />
      </svg>
    ),
    barValue: Math.min(data.instabilityIndex * 1.5, 100),
    barColor: data.instabilityIndex < 40 ? 'bg-emerald-500' : 'bg-red-500',
    accentColor: data.instabilityIndex < 40 ? 'border-l-emerald-500' : 'border-l-red-500',
  },
  {
    title: 'Alerta de Toxicidad',
    value: data.toxicityAlert ? 'POSITIVO' : 'NEGATIVO',
    badge: data.toxicityLabel,
    badgeOk: !data.toxicityAlert,
    description: 'Predicción de propiedades hemolíticas o tóxicas basada en el método ToxinPred.',
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
      </svg>
    ),
    barValue: data.toxicityAlert ? 75 : 5,
    barColor: data.toxicityAlert ? 'bg-red-500' : 'bg-emerald-500',
    accentColor: data.toxicityAlert ? 'border-l-red-500' : 'border-l-emerald-500',
  },
  {
    title: 'Punto Isoeléctrico (pI)',
    value: `pH ${data.isoelectricPoint}`,
    badge: 'Ligeramente ácido',
    badgeOk: null, // neutral
    description: 'pH al que la carga neta de la proteína es cero. Relevante para protocolos de purificación por IEF.',
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" />
      </svg>
    ),
    barValue: (data.isoelectricPoint / 14) * 100,
    barColor: 'bg-blue-500',
    accentColor: 'border-l-blue-500',
  },
  {
    title: 'Peso Molecular',
    value: `${(data.molecularWeight / 1000).toFixed(2)} kDa`,
    badge: 'Proteína pequeña',
    badgeOk: null,
    description: 'Masa calculada a partir de la composición de aminoácidos. Relevante para diseño de ensayos y expresión.',
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M3 6l3 1m0 0l-3 9a5.002 5.002 0 006.001 0M6 7l3 9M6 7l6-2m6 2l3-1m-3 1l-3 9a5.002 5.002 0 006.001 0M18 7l3 9m-3-9l-6-2m0-2v2m0 16V5m0 16H9m3 0h3" />
      </svg>
    ),
    barValue: Math.min((data.molecularWeight / 150000) * 100, 100),
    barColor: 'bg-indigo-500',
    accentColor: 'border-l-indigo-500',
  },
  {
    title: 'Vida Media in vivo',
    value: data.halfLife,
    badge: 'Larga duración',
    badgeOk: true,
    description: 'Tiempo estimado de degradación en células de mamífero. Regla de ProtParam (N-end rule).',
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    ),
    barValue: 88,
    barColor: 'bg-cyan-500',
    accentColor: 'border-l-cyan-500',
  },
]

function BadgePill({ ok, label }) {
  const cls =
    ok === true  ? 'text-emerald-600 bg-emerald-50 border-emerald-100' :
    ok === false ? 'text-red-600 bg-red-50 border-red-100' :
                   'text-slate-500 bg-slate-100 border-slate-200'
  return (
    <span className={`text-[10px] px-2.5 py-1 rounded-full border font-black uppercase tracking-tighter ${cls}`}>
      {label}
    </span>
  )
}

export default function BiologicalCards({ data }) {
  const cards = CARDS(data)

  return (
    <div className="card flex flex-col">
      <div className="card-header shrink-0 border-b-0 pt-8 px-8">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-emerald-50 flex items-center justify-center text-emerald-600 shadow-sm border border-emerald-100">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" />
            </svg>
          </div>
          <div>
            <h3 className="font-black text-slate-900 text-sm uppercase tracking-widest">Análisis Fisicoquímico</h3>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-tight">Propiedades Biológicas Predichas</p>
          </div>
        </div>
      </div>

      <div className="p-8 grid grid-cols-1 sm:grid-cols-2 gap-4">
        {cards.map((card) => (
          <div
            key={card.title}
            className={`bg-white/60 border-2 ${card.accentColor} rounded-2xl p-5
              hover:bg-white hover:shadow-xl hover:shadow-slate-200/50 hover:-translate-y-0.5 transition-all duration-300 group relative overflow-hidden`}
          >
            {/* Top row */}
            <div className="flex items-start justify-between mb-4 gap-2">
              <div className="flex items-start gap-4">
                <div className="text-slate-300 group-hover:text-slate-900 transition-colors mt-1 shrink-0 bg-slate-50 p-2 rounded-lg group-hover:bg-white group-hover:shadow-sm">
                  {card.icon}
                </div>
                <div>
                  <div className="text-[10px] text-slate-400 font-black uppercase tracking-widest mb-1 group-hover:text-slate-500">{card.title}</div>
                  <div className="text-xl font-black text-slate-900 leading-tight tracking-tight">{card.value}</div>
                </div>
              </div>
            </div>
            
            <BadgePill ok={card.badgeOk} label={card.badge} />

            {/* Mini progress bar */}
            <div className="h-2 bg-slate-100 rounded-full overflow-hidden my-4 p-0.5">
              <div
                className={`h-full rounded-full ${card.barColor} transition-all duration-1000 shadow-sm`}
                style={{ width: `${card.barValue}%` }}
              />
            </div>

            {/* Description */}
            <p className="text-[11px] text-slate-400 font-medium group-hover:text-slate-600 transition-colors leading-relaxed">
              {card.description}
            </p>
          </div>
        ))}
      </div>
    </div>
  )
}
