import { useEffect, useRef } from 'react'
import * as $3Dmol from '3dmol'

export function use3DmolViewer({ config, setup, deps = [] }) {
  const containerRef = useRef(null)
  const viewerRef = useRef(null)
  const mounted = useRef(false)

  useEffect(() => {
    if (mounted.current) return
    const container = containerRef.current
    if (!container) return

    mounted.current = true

    let disposed = false
    const viewer = $3Dmol.createViewer(container, config)
    if (!viewer) return
    viewerRef.current = viewer

    const extraCleanup = setup?.(viewer)

    return () => {
      if (disposed) return
      disposed = true
      mounted.current = false
      if (typeof extraCleanup === 'function') extraCleanup()
      if (viewerRef.current) {
        try { viewerRef.current.clear() } catch (_) {}
        container.innerHTML = ''
        viewerRef.current = null
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps)

  return { containerRef, viewerRef }
}
