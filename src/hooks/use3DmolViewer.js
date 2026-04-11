import { useEffect, useRef } from 'react'

export function use3DmolViewer({ config, setup, deps = [] }) {
  const containerRef = useRef(null)
  const viewerRef = useRef(null)
  const mounted = useRef(false)

  useEffect(() => {
    if (mounted.current) return
    const container = containerRef.current
    if (!container) return

    mounted.current = true

    const $3Dmol = window.$3Dmol
    if (!$3Dmol) {
      mounted.current = false
      console.error('use3DmolViewer: window.$3Dmol not found — ensure the CDN script is loaded')
      return
    }

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
