import { useState } from 'react'
import { mockPAEMatrix } from '../../data/mockData'

// Interpola un color según el valor PAE:
// 0 Å → verde oscuro | 15 Å → amarillo | 30 Å → rojo
function getPAEColor(value) {
  const t = Math.min(Math.max(value / 30, 0), 1)
  let r, g, b

  if (t < 0.35) {
    // Verde → amarillo-verde
    const u = t / 0.35
    r = Math.round(10 + u * 160)
    g = Math.round(140 - u * 30)
    b = Math.round(40 - u * 40)
  } else if (t < 0.65) {
    // Amarillo → naranja
    const u = (t - 0.35) / 0.3
    r = Math.round(170 + u * 85)
    g = Math.round(110 - u * 60)
    b = 0
  } else {
    // Naranja → rojo
    const u = (t - 0.65) / 0.35
    r = 255
    g = Math.round(50 - u * 50)
    b = 0
  }
  return `rgb(${r},${g},${b})`
}

export default function PAEHeatmap() {
  const [tooltip, setTooltip] = useState(null)
  const [showInfo, setShowInfo] = useState(false)

  const matrix = mockPAEMatrix
  const size = matrix.length
  // La matriz es 20×20, los residuos reales van de 1 a 76, escalamos el label
  const toRealResidue = (i) => Math.round(1 + (i / (size - 1)) * 75)

  return (
    <div className="card flex flex-col">

      {/* ── Header ────────────────────────────────────────────────── */}
      <div className="card-header justify-between shrink-0 border-b-0 pt-8 px-8">
        <div className="flex items-center gap-4">
          <div className="w-10 h-10 rounded-xl bg-purple-50 flex items-center justify-center text-purple-600 shadow-sm border border-purple-100">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
            </svg>
          </div>
          <div>
            <h3 className="font-black text-slate-900 text-sm uppercase tracking-widest">Error de Alineación (PAE)</h3>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-tight">Predicted Aligned Error Matrix</p>
          </div>
        </div>
        <button
          onClick={() => setShowInfo(v => !v)}
          className={`flex items-center gap-2 text-[10px] font-black uppercase tracking-widest border-2 rounded-xl px-4 py-2 transition-all ${
            showInfo
              ? 'bg-purple-600 border-purple-600 text-white shadow-lg shadow-purple-200'
              : 'bg-white border-slate-50 text-slate-400 hover:border-purple-100 hover:text-purple-600'
          }`}
        >
          {showInfo ? '✕ Cerrar' : '¿Qué es esto?'}
        </button>
      </div>

      {/* ── Banner explicativo ───────────────────────────────────── */}
      {showInfo && (
        <div className="mx-8 mt-6 bg-purple-50 border-2 border-purple-100 rounded-2xl p-6 animate-in fade-in zoom-in-95 duration-300">
          <p className="font-black text-purple-900 text-xs uppercase tracking-widest mb-3">
            Interpretación del Mapa PAE
          </p>
          <p className="text-slate-600 leading-relaxed text-xs font-medium">
            El <span className="text-purple-700 font-bold">PAE (Predicted Aligned Error)</span> cuantifica la confianza en la posición relativa de los residuos. 
            Las zonas <span className="text-emerald-600 font-bold">verdes</span> indican una orientación relativa fiable, mientras que las <span className="text-red-600 font-bold">rojas</span> sugieren incertidumbre posicional, común en regiones de unión flexibles o dominios independientes.
          </p>
        </div>
      )}

      <div className="p-8">
        {/* ── Heatmap + ejes ───────────────────────────────────────── */}
        <div className="relative flex gap-4">
          {/* Eje Y */}
          <div className="flex flex-col justify-between text-[10px] font-black text-slate-300 py-1 shrink-0 w-6 text-right uppercase tracking-tighter">
            <span>1</span>
            <span className="text-slate-200 rotate-180 [writing-mode:vertical-lr] my-2">Residue</span>
            <span>76</span>
          </div>

          {/* Grid */}
          <div className="relative flex-1">
            <div
              className="rounded-2xl overflow-hidden border-4 border-slate-50 shadow-inner"
              style={{
                display: 'grid',
                gridTemplateColumns: `repeat(${size}, 1fr)`,
                gridTemplateRows: `repeat(${size}, 1fr)`,
                aspectRatio: '1/1',
                gap: '1px',
              }}
            >
              {matrix.map((row, i) =>
                row.map((value, j) => (
                  <div
                    key={`${i}-${j}`}
                    style={{ backgroundColor: getPAEColor(value) }}
                    className="cursor-crosshair transition-transform hover:scale-150 hover:z-20 hover:shadow-xl"
                    onMouseEnter={() =>
                      setTooltip({
                        r1: toRealResidue(i),
                        r2: toRealResidue(j),
                        value: value.toFixed(1),
                      })
                    }
                    onMouseLeave={() => setTooltip(null)}
                  />
                ))
              )}
            </div>

            {/* Tooltip */}
            {tooltip && (
              <div className="absolute top-4 right-4 bg-white/95 backdrop-blur border-2 border-slate-100 rounded-2xl px-5 py-4 text-xs shadow-2xl pointer-events-none z-30 animate-in fade-in zoom-in-95 duration-200">
                <div className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2">
                  Coordenadas <span className="text-slate-900">{tooltip.r1}</span>
                  {' : '}
                  <span className="text-slate-900">{tooltip.r2}</span>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-4 h-4 rounded-lg shadow-sm" style={{ backgroundColor: getPAEColor(parseFloat(tooltip.value)) }} />
                  <span className="font-black text-slate-900 text-lg tracking-tighter">{tooltip.value} Å</span>
                  <span className="text-[10px] font-black text-slate-400 uppercase tracking-tighter">Error</span>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Eje X */}
        <div className="flex justify-between text-[10px] font-black text-slate-300 mt-3 ml-10 uppercase tracking-widest">
          <span>1</span>
          <span className="text-slate-200">Aligned Residue</span>
          <span>76</span>
        </div>

        {/* ── Escala de colores ─────────────────────────────────────── */}
        <div className="mt-10 bg-slate-50 rounded-2xl p-6 border border-slate-100">
          <div className="text-[10px] font-black text-slate-400 mb-4 uppercase tracking-widest">Gradiente de Incertidumbre</div>
          <div
            className="h-3 rounded-full shadow-inner"
            style={{
              background: `linear-gradient(to right,
                rgb(10,140,40), rgb(100,120,20), rgb(170,110,0), rgb(255,50,0)
              )`,
            }}
          />
          <div className="flex justify-between text-[10px] font-black uppercase tracking-tighter mt-3">
            <span className="text-emerald-600">0 Å · Máxima Precisión</span>
            <span className="text-slate-300">15 Å</span>
            <span className="text-red-500">30+ Å · Baja Fiabilidad</span>
          </div>
        </div>
      </div>
    </div>
  )
}
