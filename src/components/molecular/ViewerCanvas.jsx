const DOT_GRID_STYLE = {
  backgroundImage: 'radial-gradient(circle, #94a3b8 1px, transparent 1px)',
  backgroundSize: '80px 80px',
}

/**
 * Contenedor visual para el visor Mol*:
 *  - El div `containerRef` recibe el <canvas> que Mol* crea internamente.
 *  - La rejilla de puntos se superpone sobre el canvas (pointer-events-none).
 *  - `tooltip` (opcional): { label, plddt, x, y } muestra la etiqueta de
 *    residuo + confianza pLDDT al pasar el ratón sobre la molécula.
 */
export default function ViewerCanvas({ containerRef, tooltip, children }) {
  return (
    <div
      data-role="molecular-viewer"
      className="w-full h-full relative bg-[#08090d] flex items-center justify-center min-h-[500px]"
    >
      {/* Mol* inyecta su propio <canvas> aquí */}
      <div
        ref={containerRef}
        className="w-full h-full absolute inset-0"
        style={{ minHeight: '500px' }}
      />

      {/* Rejilla decorativa de puntos */}
      <div className="absolute inset-0 pointer-events-none opacity-15" style={DOT_GRID_STYLE} />

      {/* Tooltip de residuo pLDDT */}
      {tooltip && (
        <div
          className="pointer-events-none absolute z-50 rounded-lg bg-[#111113]/90 border border-white/10 px-3 py-2 text-xs text-white backdrop-blur-sm shadow-xl"
          style={{ left: tooltip.x + 14, top: tooltip.y + 14 }}
        >
          <span className="font-semibold tracking-wide">{tooltip.label}</span>
          <span className="mx-1.5 text-white/30">·</span>
          <span className="text-slate-400">pLDDT</span>
          <span className="mx-1 text-white/30">:</span>
          <span className="font-mono" style={{ color: plddtColor(tooltip.plddt) }}>
            {tooltip.plddt}
          </span>
        </div>
      )}

      {children}
    </div>
  )
}

/** Devuelve el color AlphaFold para el valor numérico de pLDDT. */
function plddtColor(score) {
  const b = parseFloat(score)
  if (b >= 90) return '#65CBF3'   // muy alto → cyan (legible sobre fondo oscuro)
  if (b >= 70) return '#65CBF3'   // alto     → cyan
  if (b >= 50) return '#FFE91E'   // medio    → amarillo
  return '#FF7D45'                 // bajo     → naranja
}
