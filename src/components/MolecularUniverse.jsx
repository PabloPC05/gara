import { useEffect, useRef, useState } from 'react'
import * as $3Dmol from '3dmol'

export default function MolecularUniverse({ proteins = [], background = '#ffffff' }) {
  const containerRef = useRef(null)
  const viewerRef = useRef(null)
  const [status, setStatus] = useState('Initializing Engine...')

  useEffect(() => {
    if (!containerRef.current) return
    let cancelled = false

    const viewer = $3Dmol.createViewer(containerRef.current, {
      backgroundColor: background,
    })
    viewerRef.current = viewer

    const loadModel = async (prot, index) => {
      try {
        const { pdbId, x, y, z } = prot
        const response = await fetch(`https://files.rcsb.org/download/${pdbId}.pdb`)
        if (!response.ok) throw new Error(`HTTP ${response.status}`)
        const data = await response.text()
        if (cancelled) return
        const model = viewer.addModel(data, 'pdb')
        model.translate(x, y, z)
        model.setStyle({}, {
          cartoon: {
            color: 'spectrum',
            opacity: 0.85,
          },
        })
      } catch (err) {
        console.warn(`Error loading ${prot.pdbId}:`, err)
      }
    }

    const loadAll = async () => {
      try {
        setStatus(`Loading ${proteins.length} models...`)
        for (let i = 0; i < proteins.length; i++) {
          await loadModel(proteins[i], i)
          if (cancelled) return
        }
        if (cancelled) return
        viewer.zoomTo()
        viewer.render()
        viewer.resize()
        setStatus('Universe Active')
      } catch (e) {
        setStatus('Engine Error')
        console.error(e)
      }
    }

    loadAll()

    return () => {
      cancelled = true
      if (viewerRef.current) {
        viewerRef.current.clear()
        if (containerRef.current) {
          containerRef.current.innerHTML = ''
        }
        viewerRef.current = null
      }
    }
  }, [proteins, background])

  return (
    <div className="w-full h-full relative bg-white flex items-center justify-center min-h-[500px]">
      <div
        ref={containerRef}
        className="w-full h-full absolute inset-0"
        style={{ minHeight: '500px' }}
      />

      <div className="absolute top-24 left-10 z-30 pointer-events-none">
        <div className="bg-white/90 backdrop-blur-md border border-slate-200 px-4 py-2 rounded-2xl flex items-center gap-3 shadow-sm">
          <div className={`h-2 w-2 rounded-full ${status === 'Universe Active' ? 'bg-emerald-500' : 'bg-blue-500 animate-pulse'}`} />
          <span className="text-[10px] font-bold uppercase tracking-widest text-slate-600">
            {status}
          </span>
        </div>
      </div>

      <div className="absolute inset-0 pointer-events-none opacity-15"
        style={{
          backgroundImage: 'radial-gradient(circle, #94a3b8 1px, transparent 1px)',
          backgroundSize: '80px 80px',
        }}
      />
    </div>
  )
}
