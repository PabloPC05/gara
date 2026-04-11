import { useRef, useEffect, useCallback, useState, useMemo } from 'react'
import { Info } from 'lucide-react'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip'

interface PaeHeatmapProps {
  paeMatrix: number[][]
  meanPae?: number
  compact?: boolean
}

interface PlotlyModule {
  newPlot: (
    graphDiv: HTMLDivElement,
    data: unknown[],
    layout?: unknown,
    config?: unknown,
  ) => Promise<unknown>
  purge: (graphDiv: HTMLDivElement) => void
  Plots: {
    resize: (graphDiv: HTMLDivElement) => void
  }
}

const CDN_URL = 'https://cdn.plot.ly/plotly-2.35.2.min.js'
const COLORSCALE: [number, string][] = [
  [0.0, '#0d1b6e'],
  [0.08, '#1b3a9e'],
  [0.16, '#2264d4'],
  [0.25, '#4a9eed'],
  [0.33, '#7ec8f0'],
  [0.42, '#c4e8c4'],
  [0.5, '#e4f5a0'],
  [0.58, '#fde725'],
  [0.67, '#fdbb2b'],
  [0.75, '#f57d15'],
  [0.83, '#e84d0e'],
  [0.92, '#c91e10'],
  [1.0, '#8b0000'],
]

const MAX_PAE = 31.75

let plotlyPromise: Promise<PlotlyModule> | null = null

function loadPlotly(): Promise<PlotlyModule> {
  if (plotlyPromise) return plotlyPromise

  const w = window as Window & { Plotly?: PlotlyModule }
  if (w.Plotly) {
    plotlyPromise = Promise.resolve(w.Plotly)
    return plotlyPromise
  }

  plotlyPromise = new Promise<PlotlyModule>((resolve, reject) => {
    const script = document.createElement('script')
    script.src = CDN_URL
    script.async = true
    script.onload = () => {
      if (w.Plotly) resolve(w.Plotly)
      else reject(new Error('Plotly failed to initialize'))
    }
    script.onerror = () => reject(new Error('Failed to load Plotly.js from CDN'))
    document.head.appendChild(script)
  })

  return plotlyPromise
}

function computeMaxPae(matrix: number[][]): number {
  let max = 0
  for (let i = 0; i < matrix.length; i++) {
    const row = matrix[i]
    for (let j = 0; j < row.length; j++) {
      if (row[j] > max) max = row[j]
    }
  }
  return max
}

export default function PaeHeatmap({ paeMatrix, meanPae, compact = false }: PaeHeatmapProps) {
  const plotRef = useRef<HTMLDivElement>(null)
  const n = paeMatrix.length
  const [status, setStatus] = useState<'loading' | 'ready' | 'error'>('loading')

  const dataMaxPae = useMemo(() => computeMaxPae(paeMatrix), [paeMatrix])

  const tickPositions = useMemo(() => {
    if (n <= 20) return Array.from({ length: n }, (_, i) => i)
    const step = Math.ceil(n / 10)
    return Array.from({ length: Math.ceil(n / step) }, (_, i) => i * step)
  }, [n])

  const drawPlot = useCallback(async () => {
    if (!plotRef.current || n === 0) return

    try {
      const Plotly = await loadPlotly()
      if (!plotRef.current) return

      const maxVal = Math.max(dataMaxPae, MAX_PAE)

      const trace = {
        z: paeMatrix,
        type: 'heatmap' as const,
        colorscale: COLORSCALE,
        zmin: 0,
        zmax: maxVal,
        hovertemplate:
          'Residuo %{y} vs Residuo %{x}<br>Error esperado: %{z:.2f} Å<extra></extra>',
        showscale: !compact,
        colorbar: compact
          ? undefined
          : {
              title: { text: 'Error (Å)', font: { size: 11, color: '#475569' } },
              tickfont: { size: 10, color: '#64748b' },
              thickness: 15,
              len: 0.85,
              outlinewidth: 0,
              bgcolor: 'transparent',
            },
      }

      const layout = {
        xaxis: {
          title: { text: 'Posición del residuo', font: { size: 11, color: '#475569' } },
          tickvals: tickPositions,
          ticktext: tickPositions.map((v: number) => String(v + 1)),
          tickfont: { size: 9, color: '#94a3b8' },
          showgrid: false,
          zeroline: false,
          constrain: 'range' as const,
          fixedrange: true,
        },
        yaxis: {
          title: { text: 'Posición del residuo', font: { size: 11, color: '#475569' } },
          tickvals: tickPositions,
          ticktext: tickPositions.map((v: number) => String(v + 1)),
          tickfont: { size: 9, color: '#94a3b8' },
          showgrid: false,
          zeroline: false,
          constrain: 'range' as const,
          fixedrange: true,
          autorange: 'reversed' as const,
        },
        margin: compact
          ? { l: 40, r: 10, t: 10, b: 30 }
          : { l: 60, r: 20, t: 10, b: 50 },
        paper_bgcolor: 'transparent',
        plot_bgcolor: 'transparent',
        font: { family: 'ui-monospace, monospace' },
        dragmode: false as const,
        hoverlabel: {
          bgcolor: '#1e293b',
          bordercolor: '#334155',
          font: { size: 12, color: '#f1f5f9', family: 'system-ui' },
        },
      }

      const config = {
        displayModeBar: false,
        responsive: true,
        scrollZoom: false,
        doubleClick: false,
      }

      await Plotly.newPlot(plotRef.current, [trace], layout, config)
      setStatus('ready')
    } catch {
      setStatus('error')
    }
  }, [paeMatrix, n, compact, tickPositions, dataMaxPae])

  useEffect(() => {
    drawPlot()
    return () => {
      if (plotRef.current) {
        const w = window as Window & { Plotly?: PlotlyModule }
        if (w.Plotly) w.Plotly.purge(plotRef.current)
      }
    }
  }, [drawPlot])

  useEffect(() => {
    if (!plotRef.current || status !== 'ready') return
    const w = window as Window & { Plotly?: PlotlyModule }
    const handleResize = () => {
      if (plotRef.current && w.Plotly) w.Plotly.Plots.resize(plotRef.current)
    }
    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [status])

  if (n === 0) {
    return (
      <div className="flex items-center justify-center py-8 text-[11px] text-slate-400">
        Sin datos PAE disponibles
      </div>
    )
  }

  const plotDiv = (
    <div className="flex items-center justify-center relative w-full h-full">
      {status === 'loading' && (
        <div className="absolute inset-0 z-10 flex items-center justify-center bg-white/60 backdrop-blur-sm rounded-none">
          <div className="flex items-center gap-2 text-[11px] text-slate-400">
            <div className="h-4 w-4 animate-spin rounded-none border-2 border-slate-200 border-t-slate-500" />
            Cargando visualización...
          </div>
        </div>
      )}
      {status === 'error' && (
        <div className="absolute inset-0 z-10 flex items-center justify-center bg-white/60 backdrop-blur-sm rounded-none">
          <p className="text-[11px] text-slate-400">
            No se pudo cargar la visualización interactiva.
          </p>
        </div>
      )}
      <div
        ref={plotRef}
        className="px-2 " 
        style={{ maxWidth: 200 }}
      />
    </div>
  )

  if (compact) {
    return (
      <div className="flex flex-col gap-1.5">
        {plotDiv}
        <div className="flex items-center justify-between px-1 text-[9px] text-slate-400">
          <span className="flex items-center gap-1">
            <span className="inline-block h-2 w-4 rounded-none" style={{ background: 'linear-gradient(90deg, #1b3a9e, #4a9eed)' }} />
            Bajo error
          </span>
          <span className="flex items-center gap-1">
            Alto error
            <span className="inline-block h-2 w-4 rounded-none" style={{ background: 'linear-gradient(90deg, #f57d15, #8b0000)' }} />
          </span>
        </div>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-3 rounded-none border border-slate-200/60 bg-white/60 px-4 py-3 backdrop-blur-sm">
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-2">
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-none bg-slate-100">
            <svg
              className="h-4 w-4 text-slate-500"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <rect x="3" y="3" width="7" height="7" />
              <rect x="14" y="3" width="7" height="7" />
              <rect x="3" y="14" width="7" height="7" />
              <rect x="14" y="14" width="7" height="7" />
            </svg>
          </div>
          <div className="flex flex-col">
            <div className="flex items-center gap-1.5">
              <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400">
                Heatmap PAE
              </span>
              <TooltipProvider delayDuration={200}>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <button
                      type="button"
                      className="inline-flex h-4 w-4 items-center justify-center rounded-none text-slate-300 transition-colors hover:text-slate-500 cursor-pointer"
                    >
                      <Info className="h-3 w-3" strokeWidth={2.5} />
                    </button>
                  </TooltipTrigger>
                  <TooltipContent
                    side="top"
                    sideOffset={6}
                    className="max-w-[280px] text-center text-[11px] leading-relaxed"
                  >
                    El heatmap PAE (Predicted Aligned Error) muestra el error esperado entre
                    cada par de residuos. Los <strong>bloques azules en la diagonal</strong>{' '}
                    indican dominios con estructura bien definida. Los{' '}
                    <strong>bloques azules fuera de la diagonal</strong> revelan dominios cuya
                    posición relativa se ha predicho con alta confianza.
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </div>
            <span className="text-[9px] text-slate-400">
              Predicted Aligned Error
              {meanPae != null && (
                <span className="ml-1 font-mono tabular-nums">
                  · media {meanPae.toFixed(1)} Å
                </span>
              )}
            </span>
          </div>
        </div>
      </div>

      {plotDiv}

      <div className="flex items-center justify-between text-[9px] text-slate-400">
        <span className="flex items-center gap-1.5">
          <span
            className="inline-block h-2 w-6 rounded-none"
            style={{ background: 'linear-gradient(90deg, #0d1b6e, #2264d4, #7ec8f0)' }}
          />
          Alta confianza (bajo error)
        </span>
        <span className="flex items-center gap-1.5">
          Baja confianza (alto error)
          <span
            className="inline-block h-2 w-6 rounded-none"
            style={{ background: 'linear-gradient(90deg, #fde725, #f57d15, #8b0000)' }}
          />
        </span>
      </div>
    </div>
  )
}
