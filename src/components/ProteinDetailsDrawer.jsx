import { X } from 'lucide-react'
import { useProteinStore } from '../stores/useProteinStore'
import { mockPredictionResult } from '../data/mockData'
import { DrawerBody, ComparisonBody } from './protein-details'

/**
 * Detalles mockeados por ID de proteína. Misma forma que
 * `mockPredictionResult.biological` para poder reusar visualizaciones.
 * Sustitúyelo por datos reales cuando los tengas (p. ej. consultando por
 * UniProt ID o por el valor del entry del sidebar).
 */
const PROTEIN_DETAILS_BY_ID = {
  'helix-0': {
    name: 'Ubiquitina Humana',
    uniprotId: 'P0CG47',
    length: 76,
    organism: 'Homo sapiens',
    plddtMean: mockPredictionResult.plddt.mean,
    biological: mockPredictionResult.biological,
  },
  'helix-1': {
    name: 'Lisozima C',
    uniprotId: 'P00698',
    length: 147,
    organism: 'Gallus gallus',
    plddtMean: 92.1,
    biological: {
      solubility: 83.2,
      solubilityLabel: 'Soluble',
      instabilityIndex: 29.4,
      instabilityLabel: 'Estable',
      toxicityAlert: false,
      toxicityLabel: 'No tóxica',
      molecularWeight: 16239.1,
      isoelectricPoint: 11.35,
      halfLife: '~30 horas (mamíferos)',
      extinctionCoefficient: 38940,
    },
  },
  'helix-2': {
    name: 'Insulina (cadena B)',
    uniprotId: 'P01308',
    length: 30,
    organism: 'Homo sapiens',
    plddtMean: 78.3,
    biological: {
      solubility: 95.7,
      solubilityLabel: 'Muy soluble',
      instabilityIndex: 18.1,
      instabilityLabel: 'Estable',
      toxicityAlert: false,
      toxicityLabel: 'No tóxica',
      molecularWeight: 3429.7,
      isoelectricPoint: 5.39,
      halfLife: '~5 minutos (sangre)',
      extinctionCoefficient: 5960,
    },
  },
}

export function ProteinDetailsDrawer() {
  const selectedProteinIds = useProteinStore((state) => state.selectedProteinIds)
  const clearSelection = useProteinStore((state) => state.clearSelection)

  const proteins = selectedProteinIds
    .map((id) => ({ id, ...PROTEIN_DETAILS_BY_ID[id] }))
    .filter((p) => p.name)
  
  const isOpen = proteins.length > 0
  const isComparison = proteins.length >= 2
  const widthClass = isComparison ? 'w-[44rem]' : 'w-[26rem]'

  // Estado visual derivado de isOpen para la animación manual
  const state = isOpen ? 'open' : 'closed'

  return (
    <div
      data-state={state}
      className={`fixed right-6 top-6 bottom-6 z-50 flex ${widthClass} flex-col overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-2xl shadow-slate-900/10 outline-none transition-all duration-200 ease-out data-[state=closed]:translate-x-12 data-[state=closed]:opacity-0 data-[state=open]:translate-x-0 data-[state=open]:opacity-100 ${!isOpen ? 'pointer-events-none' : ''}`}
    >
      {isComparison ? (
        <ComparisonBody proteins={proteins} />
      ) : proteins.length === 1 ? (
        <DrawerBody protein={proteins[0]} />
      ) : null}

      <button
        onClick={() => clearSelection()}
        aria-label="Cerrar ficha"
        className="absolute top-4 right-4 flex h-8 w-8 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-400 transition hover:border-slate-300 hover:text-slate-700 cursor-pointer"
      >
        <X className="h-4 w-4" strokeWidth={2.5} />
      </button>
    </div>
  )
}
