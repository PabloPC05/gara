import { useState } from 'react'

// Colores estándar de AlphaFold para pLDDT
function getPLDDTColor(score) {
  if (score >= 90) return '#0053D6'  // Azul oscuro · muy alta confianza
  if (score >= 70) return '#65CBF3'  // Azul claro  · alta confianza
  if (score >= 50) return '#FFDB13'  // Amarillo    · baja confianza
  return '#FF7D45'                   // Naranja     · muy baja confianza
}

function getPLDDTBand(score) {
  if (score >= 90) return { label: 'Muy alta', textColor: 'text-blue-600' }
  if (score >= 70) return { label: 'Alta',     textColor: 'text-blue-400' }
  if (score >= 50) return { label: 'Baja',     textColor: 'text-amber-500' }
  return                { label: 'Muy baja',  textColor: 'text-orange-600' }
}

export default function PLDDTPanel({ data }) {
  const [hoveredResidue, setHoveredResidue] = useState(null)
  const { mean, perResidue } = data
  const band = getPLDDTBand(mean)

  // Distribución por bandas
  const total = perResidue.length
  const bands = [
    { key: '>90',    label: 'Muy alta', range: '> 90',    color: '#0053D6', count: perResidue.filter(s => s >= 90).length },
    { key: '70-90',  label: 'Alta',     range: '70 – 90', color: '#65CBF3', count: perResidue.filter(s => s >= 70 && s < 90).length },
    { key: '50-70',  label: 'Baja',     range: '50 – 70', color: '#FFDB13', count: perResidue.filter(s => s >= 50 && s < 70).length },
    { key: '<50',    label: 'Muy baja', range: '< 50',    color: '#FF7D45', count: perResidue.filter(s => s < 50).length },
  ]

  return (
    <div className="card flex flex-col h-full">

      {/* ── Header ───────────────────────────────────────────────── */}
      <div className="card-header justify-between shrink-0 border-b-0 pt-8 px-8">
        <div className="flex items-center gap-4">
          <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center text-blue-600 shadow-sm border border-blue-100">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
            </svg>
          </div>
          <div>
            <h3 className="font-black text-slate-900 text-sm uppercase tracking-widest">Confianza Local</h3>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-tight">pLDDT Metric Analysis</p>
          </div>
        </div>
        {/* Tooltip informativo */}
        <div className="group relative">
          <button className="w-8 h-8 rounded-xl bg-slate-50 hover:bg-slate-100 flex items-center justify-center text-xs text-slate-400 transition-all border border-slate-100 shadow-sm">
            ?
          </button>
          <div className="absolute right-0 top-10 z-40 hidden group-hover:block w-80 bg-white border-2 border-slate-100 rounded-2xl p-6 text-xs text-slate-500 shadow-2xl animate-in fade-in zoom-in-95 duration-200">
            <p className="font-black text-slate-900 mb-3 uppercase tracking-widest text-[10px]">Puntuación pLDDT</p>
            <p className="leading-relaxed font-medium">
              El <span className="text-blue-600 font-bold">predicted Local Distance Difference Test</span> estima la fiabilidad de la estructura local (0–100). 
              Regiones con <span className="text-slate-900 font-bold">{'>'}70</span> son fiables; las inferiores a <span className="text-slate-900 font-bold">50</span> suelen ser intrínsecamente desordenadas.
            </p>
          </div>
        </div>
      </div>

      <div className="p-8 flex flex-col gap-8 flex-1">

        {/* ── Score principal ──────────────────────────────────────── */}
        <div className="text-center bg-slate-50/50 rounded-3xl py-8 border border-slate-100 shadow-inner">
          <div
            className="text-8xl font-black tracking-tighter leading-none"
            style={{ color: getPLDDTColor(mean) }}
          >
            {mean}
          </div>
          <div className={`text-xs font-black uppercase tracking-[0.2em] mt-4 ${band.textColor}`}>
            Confianza {band.label}
          </div>
          <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">Media Global del Proteoma</div>
        </div>

        {/* ── Barra de distribución ────────────────────────────────── */}
        <div>
          <div className="text-[10px] font-black text-slate-400 mb-3 uppercase tracking-widest">Distribución por Residuos</div>
          <div className="h-4 bg-slate-100 rounded-full overflow-hidden flex gap-1 p-1 shadow-inner">
            {bands.map(b => (
              <div
                key={b.key}
                style={{ width: `${(b.count / total) * 100}%`, backgroundColor: b.color }}
                className="h-full rounded-full transition-all hover:opacity-80 cursor-help shadow-sm"
                title={`${b.label}: ${b.count} aa`}
              />
            ))}
          </div>
        </div>

        {/* ── Gráfico por residuo ──────────────────────────────────── */}
        <div>
          <div className="text-[10px] font-black text-slate-400 mb-3 uppercase tracking-widest">Perfil por Posición</div>
          <div className="flex items-end gap-0.5 h-28 rounded-2xl overflow-hidden bg-white border-2 border-slate-50 p-2 shadow-sm">
            {perResidue.map((score, i) => (
              <div
                key={i}
                className="flex-1 rounded-full cursor-pointer transition-all hover:scale-y-110"
                style={{
                  height: `${(score / 100) * 100}%`,
                  backgroundColor: getPLDDTColor(score),
                  minWidth: '2px',
                }}
                onMouseEnter={() => setHoveredResidue({ idx: i + 1, score })}
                onMouseLeave={() => setHoveredResidue(null)}
              />
            ))}
          </div>

          {/* Tooltip del residuo hover */}
          <div className="h-10 mt-3 flex items-center bg-slate-50 rounded-xl px-4 border border-slate-100 shadow-inner">
            {hoveredResidue ? (
              <div className="flex items-center gap-3 text-[10px] font-black uppercase tracking-widest animate-in fade-in duration-200">
                <div
                  className="w-3 h-3 rounded-full shadow-sm"
                  style={{ backgroundColor: getPLDDTColor(hoveredResidue.score) }}
                />
                <span className="text-slate-400">
                  Residuo <span className="text-slate-900">{hoveredResidue.idx}</span>
                  {' · '}
                  pLDDT: <span style={{ color: getPLDDTColor(hoveredResidue.score) }}>
                    {hoveredResidue.score.toFixed(1)}
                  </span>
                </span>
              </div>
            ) : (
              <div className="flex justify-between w-full text-[9px] font-black text-slate-300 uppercase tracking-widest">
                <span>Residuo 1</span>
                <span>Proteína Completa ({total} aa)</span>
              </div>
            )}
          </div>
        </div>

        {/* ── Leyenda ──────────────────────────────────────────────── */}
        <div className="space-y-3 mt-auto bg-white p-4 rounded-2xl border border-slate-50">
          {bands.map(b => (
            <div key={b.key} className="flex items-center justify-between group">
              <div className="flex items-center gap-3 text-[10px] font-black uppercase tracking-widest">
                <div className="w-3 h-3 rounded-full shadow-sm shrink-0" style={{ backgroundColor: b.color }}></div>
                <span className="text-slate-500 group-hover:text-slate-900 transition-colors">{b.label}</span>
                <span className="text-slate-300 font-bold">{b.range}</span>
              </div>
              <div className="text-[10px] font-black text-slate-400 uppercase tracking-tighter">
                {b.count} <span className="text-slate-200">aa</span>
                <span className="bg-slate-50 px-2 py-0.5 rounded-lg ml-2 text-slate-600 border border-slate-100">
                  {Math.round((b.count / total) * 100)}%
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
