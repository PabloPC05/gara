/**
 * useMolstarViewer – React hook that initialises a headless Mol* PluginContext
 * and attaches it to a DOM container.
 *
 * Drop-in replacement for `use3DmolViewer`:
 *   - Returns `{ containerRef, pluginRef }` with the same shape.
 *   - `setup(plugin)` – optional async callback fired once after the canvas is
 *     ready.  May return a cleanup function that runs on unmount.
 *   - `deps` – extra dependencies that trigger re-initialisation (same as 3Dmol
 *     version, though Mol* rarely needs it).
 */

import { useEffect, useRef } from 'react'
import { PluginContext } from 'molstar/lib/mol-plugin/context.js'
import { DefaultPluginSpec } from 'molstar/lib/mol-plugin/spec.js'

export function useMolstarViewer({ setup, deps = [] }) {
  const containerRef = useRef(null)
  const pluginRef    = useRef(null)
  const mounted      = useRef(false)

  useEffect(() => {
    if (mounted.current) return
    const container = containerRef.current
    if (!container) return
    mounted.current = true

    // `active` is a closure variable scoped to THIS effect run.
    // Unlike `mounted.current`, it is NOT reset by a subsequent remount,
    // so React StrictMode's unmount→remount cycle correctly aborts only
    // the first (orphaned) plugin, not the second (live) one.
    let active = true

    // Capture mutable refs so the cleanup closure can reach them even after
    // the async initialisation completes out-of-order.
    const roRef          = { current: null }   // ResizeObserver
    const extraCleanupRef = { current: null }  // optional cleanup from `setup()`

    // ── Spec: use all default behaviours but hide every built-in UI panel ──
    const spec = DefaultPluginSpec()
    spec.layout = {
      initial: {
        isExpanded: false,
        showControls: false,
        regionState: {
          bottom: 'hidden',
          left:   'hidden',
          right:  'hidden',
          top:    'hidden',
        },
      },
    }

    const plugin = new PluginContext(spec)

    plugin.init().then(async () => {
      try {
        if (!active) {
          plugin.dispose()
          return
        }

        // Mol* requires an explicit <canvas> element passed to initViewerAsync.
        // We create one and insert it as the first child of the container so it
        // sits behind the dot-grid overlay rendered by ViewerCanvas.
        const canvas = document.createElement('canvas')
        canvas.style.cssText =
          'position:absolute;inset:0;width:100%;height:100%;display:block'
        container.insertBefore(canvas, container.firstChild)

        const ok = await plugin.initViewerAsync(canvas, container)
        if (!ok || !active) {
          plugin.dispose()
          container.innerHTML = ''
          return
        }

        pluginRef.current = plugin

        // Responsive canvas: re-compute when the container size changes.
        roRef.current = new ResizeObserver(() => {
          if (plugin.canvas3d) {
            plugin.canvas3d.handleResize()
          }
        })
        roRef.current.observe(container)

        // Caller-supplied post-initialisation.
        if (setup) {
          const result = await setup(plugin)
          if (typeof result === 'function') {
            extraCleanupRef.current = result
          }
        }
      } catch (err) {
        // Silencing double-init warnings common in React 19 StrictMode dev
        if (!String(err).includes('already added')) {
          console.error('[Mol*] Error during init:', err)
        }
      }
    }).catch(err => {
      if (!String(err).includes('already added')) {
        console.error('[Mol*] Plugin init rejected:', err)
      }
    })

    // ── Cleanup (runs on unmount or when deps change) ───────────────────────
    return () => {
      active = false
      mounted.current = false
      roRef.current?.disconnect()
      if (typeof extraCleanupRef.current === 'function') {
        extraCleanupRef.current()
      }
      pluginRef.current?.dispose()
      pluginRef.current = null
      if (container) container.innerHTML = ''
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps)

  return { containerRef, pluginRef }
}
