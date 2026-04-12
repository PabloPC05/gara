import { getAminoAcidInfo } from '../../utils/aminoAcids';

const DOT_GRID_STYLE = {
  backgroundImage: 'radial-gradient(circle, #cbd5e1 1px, transparent 1px)',
  backgroundSize: '80px 80px',
}

/** Devuelve el color AlphaFold para el valor numérico de pLDDT. */
function plddtColor(score) {
  const b = parseFloat(score)
  if (b >= 90) return '#0053D6'   // Azul oscuro
  if (b >= 70) return '#65CBF3'   // Cyan
  if (b >= 50) return '#eab308'   // Amarillo
  return '#FF7D45'                 // Naranja
}

/**
 * Contenedor visual para el visor Mol*:
 *  - El div `containerRef` recibe el <canvas> que Mol* crea internamente.
 *  - La rejilla de puntos se superpone sobre el canvas (pointer-events-none).
 *  - `tooltip` (opcional): { code, seqId, chainId, plddt, x, y }
 */
export default function ViewerCanvas({ containerRef, tooltip, hasSelection, children }) {
  const aminoInfo = tooltip ? getAminoAcidInfo(tooltip.code) : null;

  return (
    <div
      data-role="molecular-viewer"
      className="w-full h-full relative isolate bg-white flex items-center justify-center min-h-[500px]"
    >
      {/* Mol* inyecta su propio <canvas> aquí */}
      <div
        ref={containerRef}
        className="w-full h-full absolute inset-0 z-0"
        style={{ minHeight: '500px' }}
      />

      {/* Marca de agua base del visor: visible, pero siempre por debajo del resto de overlays */}
      {!hasSelection && (
        <div
          aria-hidden="true"
          className="absolute inset-0 z-[1] flex items-center justify-center pointer-events-none select-none animate-in fade-in duration-700"
        >
          <img 
            src="/src/assets/logo.png" 
            alt="Camelia Logo" 
            className="w-64 h-64 md:w-96 md:h-96 object-contain opacity-[0.07] grayscale contrast-125"
          />
        </div>
      )}

      {/* Rejilla decorativa de puntos */}
      <div className="absolute inset-0 pointer-events-none opacity-15 z-10" style={DOT_GRID_STYLE} />

      {/* Tooltip — posicionado dentro del visor (absolute) para aislamiento en split-screen */}
      <div 
        className={`pointer-events-none absolute bottom-6 right-6 z-50 transition-all duration-300 ease-in-out ${tooltip ? 'opacity-100 translate-x-0 scale-100' : 'opacity-0 translate-x-4 scale-95'}`}
      >
        {tooltip && aminoInfo && (
          <div className="rounded-none bg-white/95 border border-slate-200 p-4 shadow-2xl backdrop-blur-md min-w-[240px] flex flex-col gap-3">
            {/* Cabecera: Nombre y Badge de Código */}
            <div className="flex justify-between items-center border-b border-slate-100 pb-2.5">
              <div className="flex flex-col">
                <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Residuo en foco</span>
                <span className="text-[13px] font-bold text-slate-900 leading-none mt-0.5">{aminoInfo.name}</span>
              </div>
              <div className="bg-blue-600 px-2 py-1 rounded-none font-mono font-bold text-xs text-white shadow-sm shadow-blue-200">
                {tooltip.code}
              </div>
            </div>

            {/* Detalles Técnicos en Grid */}
            <div className="grid grid-cols-2 gap-3 text-[11px]">
              <div className="flex flex-col">
                <span className="text-[9px] font-bold uppercase text-slate-400 tracking-tight">Posición</span>
                <span className="font-mono font-bold text-slate-700">#{tooltip.seqId}</span>
              </div>
              <div className="flex flex-col">
                <span className="text-[9px] font-bold uppercase text-slate-400 tracking-tight">Cadena</span>
                <span className="font-mono font-bold text-slate-700">{tooltip.chainId}</span>
              </div>
              <div className="col-span-2 flex flex-col pt-0.5">
                <span className="text-[9px] font-bold uppercase text-slate-400 tracking-tight">Propiedades</span>
                <div className="flex items-center gap-1.5 mt-0.5">
                   <div className="w-2 h-2 rounded-none shadow-sm" style={{ backgroundColor: aminoInfo.color }} />
                   <span className="text-slate-600 font-semibold">{aminoInfo.category}</span>
                </div>
              </div>
            </div>

            {/* Confianza pLDDT con Barra Estilizada */}
            <div className="pt-2.5 border-t border-slate-100">
              <div className="flex items-center justify-between mb-2">
                <span className="text-[9px] font-black uppercase text-slate-400 tracking-widest">Confianza pLDDT</span>
                <span className="font-black text-xs" style={{ color: plddtColor(tooltip.plddt) }}>
                  {tooltip.plddt}%
                </span>
              </div>
              <div className="w-full bg-slate-100 h-2 rounded-none overflow-hidden shadow-inner">
                <div 
                  className="h-full transition-all duration-1000 ease-out shadow-sm" 
                  style={{ 
                    width: `${tooltip.plddt}%`, 
                    backgroundColor: plddtColor(tooltip.plddt) 
                  }} 
                />
              </div>
            </div>
          </div>
        )}
      </div>

      <div className="relative z-20">
        {children}
      </div>
    </div>
  )
}
