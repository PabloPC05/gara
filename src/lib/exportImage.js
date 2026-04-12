import { useUIStore } from '../stores/useUIStore'

/**
 * Captura el canvas WebGL de Mol* y devuelve una imagen como data URL.
 * @param {import('molstar/lib/mol-plugin/context').PluginContext} plugin
 * @param {object} options
 * @param {'png'|'jpeg'} options.format
 * @param {number} options.scale - Factor de multiplicación de resolución (1, 2, 4).
 * @param {boolean} options.transparent - Si true, fondo transparente (solo PNG).
 * @param {string|null} options.background - Color hex de fondo. Si null, usa el del store.
 * @returns {Promise<string>} Data URL de la imagen.
 */
export async function captureViewerImage(plugin, options = {}) {
  const {
    format = 'png',
    scale = 2,
    transparent = false,
    background = null,
  } = options

  if (!plugin?.canvas3d) throw new Error('Plugin Mol* no disponible')

  const canvas = plugin.canvas3d.getCanvas()
  if (!canvas) throw new Error('Canvas WebGL no disponible')

  const w = canvas.width
  const h = canvas.height
  const sw = w * scale
  const sh = h * scale

  const offscreen = document.createElement('canvas')
  offscreen.width = sw
  offscreen.height = sh
  const ctx = offscreen.getContext('2d')

  if (!transparent) {
    const bgColor = background || useUIStore.getState().viewerBackground || '#ffffff'
    ctx.fillStyle = bgColor
    ctx.fillRect(0, 0, sw, sh)
  }

  ctx.drawImage(canvas, 0, 0, sw, sh)

  const mime = format === 'jpeg' ? 'image/jpeg' : 'image/png'
  const quality = format === 'jpeg' ? 0.92 : undefined
  return offscreen.toDataURL(mime, quality)
}

/**
 * Captura y descarga directamente la imagen del visor.
 */
export async function exportViewerImage(plugin, options = {}) {
  const {
    format = 'png',
    scale = 2,
    transparent = false,
    filename = null,
  } = options

  const dataUrl = await captureViewerImage(plugin, { format, scale, transparent })

  const proteinName = filename || 'camelia_structure'
  const safeName = proteinName.replace(/[^a-z0-9_-]+/gi, '_').toLowerCase()
  const ext = format === 'jpeg' ? 'jpg' : 'png'

  const a = document.createElement('a')
  a.href = dataUrl
  a.download = `${safeName}_${scale}x.${ext}`
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
}

/**
 * Captura un canvas de Plotly como imagen PNG.
 * @param {HTMLElement} plotlyContainer
 * @returns {Promise<string|null>}
 */
export function capturePlotlyImage(plotlyContainer) {
  return new Promise((resolve) => {
    if (!plotlyContainer || typeof window.Plotly === 'undefined') {
      resolve(null)
      return
    }
    window.Plotly.toImage(plotlyContainer, {
      format: 'png',
      width: 800,
      height: 800,
      scale: 2,
    }).then(resolve).catch(() => resolve(null))
  })
}
