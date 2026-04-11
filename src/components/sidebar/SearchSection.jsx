import React, { useState, useRef, useEffect } from 'react'
import { Loader2, Search } from 'lucide-react'

import { useProteinLoader } from '@/hooks/useProteinLoader'
import {
  ApiError,
  getCatalogProteinDetail,
  searchCatalogProteins,
} from '@/lib/apiClient'
import { useProteinStore } from '@/stores/useProteinStore'

const PROTEIN_CATEGORIES = [
  { value: 'enzyme',      label: 'Enzyme' },
  { value: 'receptor',    label: 'Receptor' },
  { value: 'transporter', label: 'Transporter' },
  { value: 'structural',  label: 'Structural' },
  { value: 'immune',      label: 'Immune' },
  { value: 'hormone',     label: 'Hormone' },
  { value: 'signaling',   label: 'Signaling' },
  { value: 'chaperone',   label: 'Chaperone' },
  { value: 'kinase',      label: 'Kinase' },
  { value: 'protease',    label: 'Protease' },
]

export function SearchSection() {
  const [query, setQuery]         = useState('')
  const [category, setCategory]   = useState('')
  const [minLength, setMinLength] = useState('')
  const [maxLength, setMaxLength] = useState('')

  const [results, setResults]                   = useState([])
  const [hasSearched, setHasSearched]           = useState(false)
  const [isSearching, setIsSearching]           = useState(false)
  const [loadingProteinId, setLoadingProteinId] = useState(null)
  const [searchError, setSearchError]           = useState(null)
  const [loadError, setLoadError]               = useState(null)
  const [activeIndex, setActiveIndex]           = useState(-1)

  const itemRefs = useRef([])

  const { load } = useProteinLoader()
  const setSelectedProteinIds = useProteinStore((state) => state.setSelectedProteinIds)

  const isBusy     = isSearching || Boolean(loadingProteinId)
  const hasFilters = Boolean(category || minLength || maxLength)

  const doSearch = async ({ search, category, minLength, maxLength }) => {
    setIsSearching(true)
    setHasSearched(true)
    setSearchError(null)
    setLoadError(null)
    setResults([])
    setActiveIndex(-1)

    try {
      const nextResults = await searchCatalogProteins({ search, category, minLength, maxLength })
      setResults(nextResults)
    } catch (error) {
      setSearchError(error?.message ?? 'No se pudo consultar el catálogo')
    } finally {
      setIsSearching(false)
    }
  }

  // Debounce unificado para todos los filtros
  useEffect(() => {
    const hasAnyFilter = query.trim() || category || minLength || maxLength
    if (!hasAnyFilter) {
      setResults([])
      setHasSearched(false)
      setSearchError(null)
      return
    }
    const timer = setTimeout(() => {
      doSearch({ search: query, category, minLength, maxLength })
    }, 350)
    return () => clearTimeout(timer)
  }, [query, category, minLength, maxLength]) // eslint-disable-line react-hooks/exhaustive-deps

  const handleQueryChange = (e) => {
    setQuery(e.target.value)
    setActiveIndex(-1)
  }

  const handleKeyDown = (e) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault()
      setActiveIndex(i => Math.min(i + 1, results.length - 1))
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      setActiveIndex(i => Math.max(i - 1, 0))
    } else if (e.key === 'Enter') {
      e.preventDefault()
      if (activeIndex >= 0 && !isBusy) handleSelectProtein(results[activeIndex])
    }
  }

  useEffect(() => {
    if (activeIndex >= 0 && itemRefs.current[activeIndex]) {
      itemRefs.current[activeIndex].scrollIntoView({ block: 'nearest' })
    }
  }, [activeIndex])

  const clearFilters = () => {
    setCategory('')
    setMinLength('')
    setMaxLength('')
  }

  const handleSelectProtein = async (result) => {
    if (!result?.proteinId || loadingProteinId) return

    setLoadingProteinId(result.proteinId)
    setLoadError(null)

    try {
      const detail = await getCatalogProteinDetail(result.proteinId)
      if (!detail.fastaReady) {
        throw new ApiError('La respuesta del detalle no incluye fasta_ready')
      }

      const loadedProteinId = await load(detail.fastaReady)
      if (loadedProteinId) {
        setSelectedProteinIds([loadedProteinId])
      }
    } catch (error) {
      setLoadError(error?.message ?? 'No se pudo cargar la proteína seleccionada')
    } finally {
      setLoadingProteinId(null)
    }
  }

  const inputClass =
    'w-full px-2 py-1.5 border border-slate-200 rounded-none text-sm bg-white ' +
    'focus:outline-none focus:ring-2 focus:ring-[#e31e24] shadow-sm ' +
    'disabled:bg-slate-100 disabled:text-slate-400'

  const filterLabelClass =
    'text-[11px] font-medium text-slate-400 uppercase tracking-wide'

  const renderResults = () => {
    if (isSearching) {
      return (
        <div className="flex-1 overflow-auto mt-4 border border-slate-200 rounded-none bg-slate-50 p-4 flex flex-col items-center justify-center text-center text-slate-500">
          <Loader2 size={28} className="mb-3 animate-spin text-[#e31e24]" />
          <p className="font-medium text-slate-700">Consultando catalogo...</p>
          <p className="mt-2 text-xs text-slate-500">
            La primera petición puede tardar hasta 30 s si la API estaba en reposo.
          </p>
        </div>
      )
    }

    if (searchError) {
      return (
        <div className="flex-1 overflow-auto mt-4 border border-rose-200 rounded-none bg-rose-50 p-4 flex flex-col items-center justify-center text-center text-rose-700">
          <p className="font-medium">No se pudo consultar el catálogo.</p>
          <p className="mt-2 text-xs">{searchError}</p>
        </div>
      )
    }

    if (!hasSearched) {
      return (
        <div className="flex-1 overflow-auto mt-4 border border-slate-100 rounded-none bg-slate-50 p-4 flex flex-col items-center justify-center text-center text-slate-400">
          <Search size={32} className="mb-2 opacity-20" />
          <p>Los resultados aparecerán aquí</p>
        </div>
      )
    }

    if (results.length === 0) {
      return (
        <div className="flex-1 overflow-auto mt-4 border border-slate-100 rounded-none bg-slate-50 p-4 flex flex-col items-center justify-center text-center text-slate-500">
          <p className="font-medium text-slate-700">Sin resultados</p>
          <p className="mt-2 text-xs">
            No se encontraron proteínas con los filtros aplicados.
          </p>
        </div>
      )
    }

    return (
      <div className="flex-1 overflow-auto mt-4 border border-slate-200 rounded-none bg-white shadow-sm">
        <div className="flex flex-col divide-y divide-slate-100">
          {results.map((result, index) => {
            const isLoadingThisProtein = loadingProteinId === result.proteinId
            const isHighlighted = index === activeIndex
            return (
              <button
                key={result.proteinId}
                ref={el => (itemRefs.current[index] = el)}
                type="button"
                onClick={() => handleSelectProtein(result)}
                disabled={isBusy}
                className={`w-full text-left p-4 transition-colors disabled:cursor-wait disabled:opacity-70 ${
                  isHighlighted
                    ? 'bg-[#fde8e8]/70 border-l-2 border-l-[#e31e24]'
                    : 'hover:bg-slate-50'
                }`}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="font-semibold text-slate-900">{result.proteinName}</p>
                    <p className="mt-1 text-xs text-slate-500">
                      {result.organism}
                    </p>
                  </div>
                  {isLoadingThisProtein ? (
                    <span className="inline-flex items-center gap-2 text-xs font-medium text-[#e31e24] whitespace-nowrap">
                      <Loader2 size={14} className="animate-spin" />
                      Loading
                    </span>
                  ) : null}
                </div>

                <div className="mt-3 flex flex-wrap gap-2 text-[11px] text-slate-600">
                  <span className="rounded-none bg-slate-100 px-2 py-1 font-medium">
                    ID {result.proteinId}
                  </span>
                  {result.uniprotId ? (
                    <span className="rounded-none bg-slate-100 px-2 py-1">
                      UniProt {result.uniprotId}
                    </span>
                  ) : null}
                  {result.pdbId ? (
                    <span className="rounded-none bg-slate-100 px-2 py-1">
                      PDB {result.pdbId}
                    </span>
                  ) : null}
                  {result.length != null ? (
                    <span className="rounded-none bg-slate-100 px-2 py-1">
                      {result.length} aa
                    </span>
                  ) : null}
                  {result.category ? (
                    <span className="rounded-none bg-slate-100 px-2 py-1 capitalize">
                      {result.category}
                    </span>
                  ) : null}
                </div>

                {result.description ? (
                  <p className="mt-3 text-xs leading-5 text-slate-500">
                    {result.description}
                  </p>
                ) : null}
              </button>
            )
          })}
        </div>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-3 text-sm text-slate-700 h-full">
      <h2 className="font-semibold text-xs text-slate-500 uppercase tracking-wider px-1">
        Explore Catalog
      </h2>

      {/* Text search */}
      <form onSubmit={(e) => e.preventDefault()} className="relative mt-1">
        <Search className="absolute left-3 top-2.5 text-slate-400" size={16} />
        <input
          type="text"
          placeholder="Search proteins by name, organism or tag..."
          className="w-full pl-9 pr-3 py-2 border border-slate-200 rounded-none focus:outline-none focus:ring-2 focus:ring-[#e31e24] shadow-sm text-sm bg-white disabled:bg-slate-100 disabled:text-slate-400"
          value={query}
          onChange={handleQueryChange}
          onKeyDown={handleKeyDown}
          disabled={isBusy}
        />
      </form>

      {/* Category filter */}
      <div className="flex flex-col gap-1">
        <label className={filterLabelClass}>Category</label>
        <select
          value={category}
          onChange={e => setCategory(e.target.value)}
          disabled={isBusy}
          className={inputClass}
        >
          <option value="">All categories</option>
          {PROTEIN_CATEGORIES.map(c => (
            <option key={c.value} value={c.value}>{c.label}</option>
          ))}
        </select>
      </div>

      {/* Length range filter */}
      <div className="flex flex-col gap-1">
        <label className={filterLabelClass}>Length (aa)</label>
        <div className="flex items-center gap-2">
          <input
            type="number"
            min={1}
            placeholder="Min"
            value={minLength}
            onChange={e => setMinLength(e.target.value)}
            disabled={isBusy}
            className={inputClass}
          />
          <span className="text-slate-400 text-xs shrink-0">–</span>
          <input
            type="number"
            min={1}
            placeholder="Max"
            value={maxLength}
            onChange={e => setMaxLength(e.target.value)}
            disabled={isBusy}
            className={inputClass}
          />
        </div>
      </div>

      {/* Clear filters */}
      {hasFilters ? (
        <div className="flex justify-end">
          <button
            type="button"
            onClick={clearFilters}
            disabled={isBusy}
            className="text-xs text-slate-400 hover:text-slate-600 transition-colors disabled:opacity-40"
          >
            ✕ Clear filters
          </button>
        </div>
      ) : null}

      {/* Loading protein indicator */}
      {loadingProteinId ? (
        <div className="border border-slate-200 rounded-none p-3 bg-slate-50 shadow-sm text-xs text-slate-600">
          <div className="flex items-center gap-2 font-medium text-slate-700">
            <Loader2 size={14} className="animate-spin text-[#e31e24]" />
            Loading selected protein...
          </div>
          <p className="mt-2">
            Se consulta el detalle, se usa <code>fasta_ready</code> y se lanza el flujo actual de carga.
          </p>
          <p className="mt-1 text-slate-500">
            Si la API estaba fría, esta operación puede tardar algunos segundos.
          </p>
        </div>
      ) : null}

      {/* Load error */}
      {loadError ? (
        <div className="border border-rose-200 rounded-none p-3 bg-rose-50 text-rose-700 text-xs">
          {loadError}
        </div>
      ) : null}

      {renderResults()}
    </div>
  )
}
