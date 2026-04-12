/**
 * useMolstarViewer – Hook que inicializa Mol* y lo conecta a un div contenedor.
 *
 * Mol* no monta su propio DOM: necesita que le pasemos un <canvas> explícito y
 * el div que lo contiene. Este hook se encarga de todo ese ciclo de vida.
 *
 * Devuelve:
 *   - containerRef → ref al div donde vive el canvas (úsalo en el JSX)
 *   - pluginRef    → ref al PluginContext de Mol* (para llamar a la API después)
 *
 * Parámetros:
 *   - setup(plugin) → callback async que se ejecuta UNA vez tras init. Puede
 *                     devolver una función de limpieza que se llama al desmontar.
 *   - deps          → dependencias extra que fuerzan re-inicialización (raro).
 */

import { useEffect, useRef } from 'react'
import { PluginContext } from 'molstar/lib/mol-plugin/context.js'
import { DefaultPluginSpec } from 'molstar/lib/mol-plugin/spec.js'

export function useMolstarViewer({ setup, deps = [] }) {
  const containerRef = useRef(null)   // div del DOM donde Mol* inyecta el canvas
  const pluginRef    = useRef(null)   // instancia activa de PluginContext
  const mounted      = useRef(false)  // evita doble-init en React StrictMode dev

  useEffect(() => {
    // Protección contra doble montaje (React 18+ StrictMode ejecuta effects dos veces en dev)
    if (mounted.current) return
    const container = containerRef.current
    if (!container) return
    mounted.current = true

    // `active` es una variable de closure ligada a ESTA ejecución del effect.
    // Cuando React desmonta y remonta (StrictMode), la primera ejecución queda
    // con active=false, abortando su init async sin afectar la segunda (activa).
    let active = true

    const roRef           = { current: null }  // ResizeObserver → redibuja si cambia el tamaño
    const extraCleanupRef = { current: null }  // función de limpieza opcional del callback setup()

    // ── Spec: configuración del plugin ────────────────────────────────────────
    // Usamos todos los comportamientos por defecto de Mol* pero ocultamos su UI
    // (controles, paneles laterales, etc.) porque nosotros ponemos la nuestra.
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

    // ── Inicialización asíncrona ──────────────────────────────────────────────
    const plugin = new PluginContext(spec)

    plugin.init().then(async () => {
      try {
        if (!active) {
          plugin.dispose()
          return
        }

        // Mol* requiere un <canvas> explícito. Lo creamos y lo insertamos como
        // primer hijo del contenedor, detrás de cualquier overlay de React.
        const canvas = document.createElement('canvas')
        canvas.style.cssText =
          'position:absolute;inset:0;width:100%;height:100%;display:block'
        container.insertBefore(canvas, container.firstChild)

        // initViewerAsync conecta el plugin al canvas y al contenedor.
        // Retorna false si falló (p.ej. WebGL no disponible).
        const ok = await plugin.initViewerAsync(canvas, container)
        if (!ok || !active) {
          plugin.dispose()
          container.innerHTML = ''
          return
        }

        pluginRef.current = plugin

        // ResizeObserver: cuando el contenedor cambia de tamaño (sidebar, drawer, ventana)
        // le avisamos a Mol* para que reajuste el canvas y la proyección de la cámara.
        roRef.current = new ResizeObserver(() => {
          if (plugin.canvas3d) {
            plugin.canvas3d.handleResize()
          }
        })
        roRef.current.observe(container)

        // Ejecuta el callback post-init proporcionado por el componente padre.
        // Aquí es donde se configura iluminación, temas, suscripciones hover, etc.
        if (setup) {
          const result = await setup(plugin)
          if (typeof result === 'function') {
            extraCleanupRef.current = result
          }
        }
      } catch (err) {
        // Los warnings "already added" son normales en React 19 StrictMode dev
        if (!String(err).includes('already added')) {
          console.error('[Mol*] Error durante init:', err)
        }
      }
    }).catch(err => {
      if (!String(err).includes('already added')) {
        console.error('[Mol*] Plugin init rechazado:', err)
      }
    })

    // ── Limpieza ──────────────────────────────────────────────────────────────
    // Se ejecuta cuando el componente se desmonta o cuando cambian las deps.
    return () => {
      active = false
      mounted.current = false
      roRef.current?.disconnect()                          // para el observer de tamaño
      if (typeof extraCleanupRef.current === 'function') {
        extraCleanupRef.current()                          // limpieza de suscripciones (hover, etc.)
      }
      pluginRef.current?.dispose()                         // destruye el plugin WebGL
      pluginRef.current = null
      if (container) container.innerHTML = ''              // limpia el canvas del DOM
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps)

  return { containerRef, pluginRef }
}
