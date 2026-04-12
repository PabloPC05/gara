import { memo } from 'react'
import { intFmt } from '../formatters'
import { RES_WIDTH, CHAIN_HEIGHT, MAX_RENDERED_RESIDUES } from '../constants'

function Residue({ letter, index, isFirst, isLast }) {
  const baseX = 30 + index * RES_WIDTH
  const xN = baseX
  const xCA = baseX + 30
  const xC = baseX + 60
  const y = 62

  return (
    <g>
      {isFirst && (
        <text x={xN - 18} y={y + 3} fontSize="10" fill="#475569" fontFamily="ui-monospace, monospace">
          H₂N
        </text>
      )}

      {/* Nitrogen */}
      <circle cx={xN} cy={y} r="7" fill="#dbeafe" stroke="#1e40af" strokeWidth="1" />
      <text x={xN} y={y + 3} fontSize="8" textAnchor="middle" fill="#1e40af" fontFamily="ui-monospace, monospace">
        N
      </text>
      {!isFirst && (
        <text x={xN} y={y - 11} fontSize="7" textAnchor="middle" fill="#64748b" fontFamily="ui-monospace, monospace">
          H
        </text>
      )}

      {/* N—Cα bond */}
      <line x1={xN + 7} y1={y} x2={xCA - 9} y2={y} stroke="#475569" strokeWidth="1.5" />

      {/* Residue label */}
      <text x={xCA} y={y - 30} fontSize="8" textAnchor="middle" fill="#94a3b8" fontFamily="ui-monospace, monospace">
        {index + 1}
      </text>
      <text x={xCA} y={y - 18} fontSize="12" textAnchor="middle" fill="#0f172a" fontWeight="700" fontFamily="ui-monospace, monospace">
        {letter}
      </text>

      {/* Cα */}
      <circle cx={xCA} cy={y} r="9" fill="#f1f5f9" stroke="#334155" strokeWidth="1.5" />
      <text x={xCA} y={y + 3} fontSize="8" textAnchor="middle" fill="#0f172a" fontFamily="ui-monospace, monospace">
        Cα
      </text>

      {/* Side chain */}
      <line x1={xCA} y1={y + 9} x2={xCA} y2={y + 22} stroke="#94a3b8" strokeWidth="1" />
      <text x={xCA} y={y + 33} fontSize="8" textAnchor="middle" fill="#94a3b8" fontFamily="ui-monospace, monospace">
        R
      </text>

      {/* Cα—C bond */}
      <line x1={xCA + 9} y1={y} x2={xC - 7} y2={y} stroke="#475569" strokeWidth="1.5" />

      {/* Carbonyl C */}
      <circle cx={xC} cy={y} r="7" fill="#fee2e2" stroke="#b91c1c" strokeWidth="1" />
      <text x={xC} y={y + 3} fontSize="8" textAnchor="middle" fill="#b91c1c" fontFamily="ui-monospace, monospace">
        C
      </text>

      {/* C=O double bond */}
      <line x1={xC - 2} y1={y - 7} x2={xC - 2} y2={y - 18} stroke="#b91c1c" strokeWidth="1.3" />
      <line x1={xC + 2} y1={y - 7} x2={xC + 2} y2={y - 18} stroke="#b91c1c" strokeWidth="1.3" />
      <text x={xC} y={y - 22} fontSize="8" textAnchor="middle" fill="#b91c1c" fontFamily="ui-monospace, monospace">
        O
      </text>

      {/* Peptide bond or terminal OH */}
      {!isLast ? (
        <line x1={xC + 7} y1={y} x2={xC + RES_WIDTH - 30 - 7} y2={y} stroke="#f59e0b" strokeWidth="2.5" />
      ) : (
        <>
          <line x1={xC + 7} y1={y} x2={xC + 20} y2={y} stroke="#475569" strokeWidth="1.5" />
          <text x={xC + 24} y={y + 3} fontSize="10" fill="#475569" fontFamily="ui-monospace, monospace">
            OH
          </text>
        </>
      )}
    </g>
  )
}

export const ChemicalBackbone = memo(function ChemicalBackbone({ sequence }) {
  const residues = sequence.slice(0, MAX_RENDERED_RESIDUES)
  const width = residues.length * RES_WIDTH + 60

  return (
    <>
      <div className="flex items-center justify-between border-b border-slate-100 px-2 py-1 font-mono text-[10px] text-slate-500 overflow-hidden min-w-0">
        <span className="truncate">
          Esqueleto peptídico — {intFmt.format(residues.length)}{' '}
          {residues.length === 1 ? 'residuo' : 'residuos'}
          {residues.length < sequence.length && (
            <span className="ml-1 text-slate-400">
              (de {intFmt.format(sequence.length)}, truncado)
            </span>
          )}
        </span>
      </div>

      <div className="overflow-x-auto">
        <svg width={width} height={CHAIN_HEIGHT} viewBox={`0 0 ${width} ${CHAIN_HEIGHT}`} className="block">
          {residues.split('').map((letter, i) => (
            <Residue
              key={i}
              letter={letter}
              index={i}
              isFirst={i === 0}
              isLast={i === residues.length - 1}
            />
          ))}
        </svg>
      </div>

      <div className="flex flex-wrap items-center gap-x-3 gap-y-1 border-t border-slate-100 px-2 py-1 font-mono text-[9px] text-slate-500 overflow-hidden min-w-0">
        <span className="inline-flex items-center gap-1">
          <span className="inline-block h-0.5 w-4 bg-amber-500" />
          enlace peptídico
        </span>
        <span className="inline-flex items-center gap-1">
          <span className="inline-block h-2 w-2 border border-blue-800 bg-blue-100" />N
        </span>
        <span className="inline-flex items-center gap-1">
          <span className="inline-block h-2.5 w-2.5 border border-slate-600 bg-slate-100" />
          Cα
        </span>
        <span className="inline-flex items-center gap-1">
          <span className="inline-block h-2 w-2 border border-red-800 bg-red-100" />
          C=O
        </span>
        <span className="ml-auto text-slate-400">R = cadena lateral</span>
      </div>
    </>
  )
})
