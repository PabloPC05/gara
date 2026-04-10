const DOT_GRID_STYLE = {
  backgroundImage: 'radial-gradient(circle, #94a3b8 1px, transparent 1px)',
  backgroundSize: '80px 80px',
}

/**
 * Contenedor visual común para todos los visores 3Dmol:
 * canvas ocupando el área completa + rejilla de puntos decorativa.
 */
export default function ViewerCanvas({ containerRef, children }) {
  return (
    <div className="w-full h-full relative bg-[#f7f8fa] flex items-center justify-center min-h-[500px]">
      <div
        ref={containerRef}
        className="w-full h-full absolute inset-0"
        style={{ minHeight: '500px' }}
      />
      <div className="absolute inset-0 pointer-events-none opacity-15" style={DOT_GRID_STYLE} />
      {children}
    </div>
  )
}
