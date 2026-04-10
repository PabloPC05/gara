import { useCallback } from 'react'
import { Plus, Minus, RotateCcw } from 'lucide-react'
import { use3DmolViewer } from '../../hooks/use3DmolViewer'
import { fetchPdb } from '../../lib/pdb'

const VIEWER_CONFIG = {
  backgroundColor: 'white',
  antialias: true,
  disableFog: false,
  cartoonQuality: 12,
  outline: { width: 0.04, color: '#cbd5e1' },
  ambientOcclusion: { strength: 0.7, radius: 6.0 },
}

const VIEW_STYLE = { style: 'ambientOcclusion', strength: 0.7, radius: 6.0 }

const PROTEIN_STYLE = {
  cartoon: {
    color: 'spectrum',
    opacity: 0.95,
    thickness: 0.6,
    style: 'edged',
  },
}

const PLDDT_LEVELS = [
  { color: '#0053D6', label: 'Muy alta (>90)' },
  { color: '#65CBF3', label: 'Alta (70–90)' },
  { color: '#FFDB13', label: 'Baja (50–70)' },
  { color: '#FF7D45', label: 'Muy baja (<50)' },
]

const renderProtein = (viewer) => {
  viewer.setStyle({}, PROTEIN_STYLE)
  viewer.zoomTo()
  viewer.render()
}

/**
 * Rotación multi-eje continua hasta que se cancele.
 * Devuelve la función de cancelación.
 */
const startOrbitAnimation = (viewer) => {
  let frameId = null
  let time = 0

  const tick = () => {
    time += 0.008
    const ySpeed = 0.35 + Math.sin(time * 0.7) * 0.15
    const xSpeed = Math.sin(time * 0.5) * 0.08
    viewer.rotate(ySpeed, 'y')
    viewer.rotate(xSpeed, 'x')
    viewer.render()
    frameId = requestAnimationFrame(tick)
  }

  tick()
  return () => {
    if (frameId !== null) cancelAnimationFrame(frameId)
  }
}

export default function MolecularViewer({ pdbId = '1ubq', data = null }) {
  const { containerRef, viewerRef } = use3DmolViewer({
    config: VIEWER_CONFIG,
    setup: (viewer) => {
      viewer.setViewStyle(VIEW_STYLE)

      if (data) {
        viewer.addModel(data, 'pdb')
        renderProtein(viewer)
        return undefined
      }

      let stopAnimation = null
      let cancelled = false

      fetchPdb(pdbId)
        .then((pdbData) => {
          if (cancelled) return
          viewer.addModel(pdbData, 'pdb')
          renderProtein(viewer)
          stopAnimation = startOrbitAnimation(viewer)
        })
        .catch((err) => console.error('Error loading PDB:', err))

      return () => {
        cancelled = true
        if (stopAnimation) stopAnimation()
      }
    },
    deps: [pdbId, data],
  })

  const zoomBy = useCallback((factor) => {
    const viewer = viewerRef.current
    if (!viewer) return
    viewer.zoom(factor, 300)
    viewer.render()
  }, [viewerRef])

  const resetView = useCallback(() => {
    const viewer = viewerRef.current
    if (!viewer) return
    viewer.zoomTo({}, 500)
    viewer.render()
  }, [viewerRef])

  return (
    <div className="card flex flex-col h-full min-h-[600px] overflow-hidden bg-white/80 backdrop-blur-xl border border-white/40 shadow-2xl rounded-[2rem]">
      <ViewerHeader pdbId={pdbId} />

      <div className="relative flex-1 bg-white overflow-hidden">
        <div
          ref={containerRef}
          className="w-full h-full relative"
          style={{ height: '500px', width: '100%' }}
        />
        <PlddtLegend />
        <ZoomControls
          onZoomIn={() => zoomBy(1.4)}
          onZoomOut={() => zoomBy(0.7)}
          onReset={resetView}
        />
      </div>

      <ViewerFooter />
    </div>
  )
}

function ViewerHeader({ pdbId }) {
  return (
    <div className="shrink-0 py-6 px-8 border-b border-slate-100 flex items-center justify-between">
      <div className="flex items-center gap-4">
        <div className="w-12 h-12 rounded-2xl bg-blue-50 flex items-center justify-center text-blue-600 shadow-sm border border-blue-100">
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 3C7.03 3 3 7.03 3 12s4.03 9 9 9 9-4.03 9-9-4.03-9-9-9z" />
          </svg>
        </div>
        <div>
          <h3 className="font-black text-slate-900 text-base uppercase tracking-widest">Estructura 3D</h3>
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Visualización en tiempo real con 3Dmol.js</p>
        </div>
      </div>

      <span className="text-[10px] font-black uppercase tracking-widest text-slate-400 bg-slate-100 px-3 py-1 rounded-full border border-slate-200">
        PDB: {pdbId.toUpperCase()}
      </span>
    </div>
  )
}

function PlddtLegend() {
  return (
    <div className="absolute bottom-6 right-6 flex flex-col gap-2">
      <div className="bg-white/60 backdrop-blur-md p-4 rounded-2xl border border-white shadow-lg">
        <div className="flex flex-col gap-3">
          {PLDDT_LEVELS.map(({ color, label }) => (
            <div key={label} className="flex items-center gap-3">
              <div
                className="w-3 h-3 rounded-full border border-white/50"
                style={{ backgroundColor: color }}
              />
              <span className="text-[9px] font-bold uppercase tracking-widest text-slate-600">
                {label}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

const ZOOM_BUTTON_CLASS =
  'w-9 h-9 rounded-xl bg-white/80 backdrop-blur-md border border-slate-200 shadow-sm flex items-center justify-center text-slate-500 hover:bg-white hover:text-blue-600 hover:border-blue-200 hover:shadow-md transition-all duration-200 active:scale-95'

function ZoomControls({ onZoomIn, onZoomOut, onReset }) {
  return (
    <div className="absolute bottom-6 left-6 flex flex-col gap-1.5 z-20">
      <button onClick={onZoomIn} className={ZOOM_BUTTON_CLASS} title="Acercar">
        <Plus className="w-4 h-4" strokeWidth={2.5} />
      </button>
      <button onClick={onZoomOut} className={ZOOM_BUTTON_CLASS} title="Alejar">
        <Minus className="w-4 h-4" strokeWidth={2.5} />
      </button>
      <div className="h-px w-5 mx-auto bg-slate-200 my-0.5" />
      <button onClick={onReset} className={ZOOM_BUTTON_CLASS} title="Restablecer vista">
        <RotateCcw className="w-3.5 h-3.5" strokeWidth={2.5} />
      </button>
    </div>
  )
}

function ViewerFooter() {
  return (
    <div className="px-8 py-5 bg-slate-50/50 shrink-0 border-t border-slate-100 flex items-center justify-between">
      <div className="flex items-center gap-6">
        <button className="text-[10px] font-black uppercase tracking-widest text-blue-600 hover:text-blue-700 transition-colors">
          Capturar Imagen
        </button>
        <button className="text-[10px] font-black uppercase tracking-widest text-slate-400 hover:text-slate-600 transition-colors">
          Exportar PDB
        </button>
      </div>
      <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-emerald-500">
        <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
        Renderizador Activo
      </div>
    </div>
  )
}
