import React, { useState } from 'react'
import { Loader2, Search } from 'lucide-react'

import { useProteinLoader } from '@/hooks/useProteinLoader'
import {
  ApiError,
  getCatalogProteinDetail,
  searchCatalogProteins,
} from '@/lib/apiClient'
import { useProteinStore } from '@/stores/useProteinStore'

export function SearchSection() {
  const [query, setQuery] = useState('')
  const [results, setResults] = useState([])
  const [hasSearched, setHasSearched] = useState(false)
  const [isSearching, setIsSearching] = useState(false)
  const [loadingProteinId, setLoadingProteinId] = useState(null)
  const [searchError, setSearchError] = useState(null)
  const [loadError, setLoadError] = useState(null)

  const { load } = useProteinLoader()
  const setSelectedProteinIds = useProteinStore((state) => state.setSelectedProteinIds)

  const isBusy = isSearching || Boolean(loadingProteinId)

  const handleSearch = async (event) => {
    event.preventDefault()

    const trimmed = query.trim()
    if (!trimmed) {
      setResults([])
      setHasSearched(false)
      setSearchError(null)
      setLoadError(null)
      return
    }

    setIsSearching(true)
    setHasSearched(true)
    setSearchError(null)
    setLoadError(null)
    setResults([])

    try {
      const nextResults = await searchCatalogProteins(trimmed)
      setResults(nextResults)
    } catch (error) {
      setSearchError(error?.message ?? 'No se pudo consultar el catálogo')
    } finally {
      setIsSearching(false)
    }
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

  const renderResults = () => {
    if (isSearching) {
      return (
        <div className="flex-1 overflow-auto mt-4 border border-slate-200 rounded-md bg-slate-50 p-4 flex flex-col items-center justify-center text-center text-slate-500">
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
        <div className="flex-1 overflow-auto mt-4 border border-rose-200 rounded-md bg-rose-50 p-4 flex flex-col items-center justify-center text-center text-rose-700">
          <p className="font-medium">No se pudo consultar el catálogo.</p>
          <p className="mt-2 text-xs">{searchError}</p>
        </div>
      )
    }

    if (!hasSearched) {
      return (
        <div className="flex-1 overflow-auto mt-4 border border-slate-100 rounded-md bg-slate-50 p-4 flex flex-col items-center justify-center text-center text-slate-400">
          <Search size={32} className="mb-2 opacity-20" />
          <p>Los resultados aparecerán aquí</p>
        </div>
      )
    }

    if (results.length === 0) {
      return (
        <div className="flex-1 overflow-auto mt-4 border border-slate-100 rounded-md bg-slate-50 p-4 flex flex-col items-center justify-center text-center text-slate-500">
          <p className="font-medium text-slate-700">Sin resultados</p>
          <p className="mt-2 text-xs">No se encontraron proteinas para "{query.trim()}".</p>
        </div>
      )
    }

    return (
      <div className="flex-1 overflow-auto mt-4 border border-slate-200 rounded-md bg-white shadow-sm">
        <div className="flex flex-col divide-y divide-slate-100">
          {results.map((result) => {
            const isLoadingThisProtein = loadingProteinId === result.proteinId
            return (
              <button
                key={result.proteinId}
                type="button"
                onClick={() => handleSelectProtein(result)}
                disabled={isBusy}
                className="w-full text-left p-4 hover:bg-slate-50 transition-colors disabled:cursor-wait disabled:opacity-70"
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
                  <span className="rounded-full bg-slate-100 px-2 py-1 font-medium">
                    ID {result.proteinId}
                  </span>
                  {result.uniprotId ? (
                    <span className="rounded-full bg-slate-100 px-2 py-1">
                      UniProt {result.uniprotId}
                    </span>
                  ) : null}
                  {result.pdbId ? (
                    <span className="rounded-full bg-slate-100 px-2 py-1">
                      PDB {result.pdbId}
                    </span>
                  ) : null}
                  {result.length != null ? (
                    <span className="rounded-full bg-slate-100 px-2 py-1">
                      {result.length} aa
                    </span>
                  ) : null}
                  {result.category ? (
                    <span className="rounded-full bg-slate-100 px-2 py-1 capitalize">
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
    <div className="flex flex-col gap-4 text-sm text-slate-700 h-full">
      <h2 className="font-semibold text-xs text-slate-500 uppercase tracking-wider px-1">
        Explore Catalog
      </h2>

      <form onSubmit={handleSearch} className="relative mt-1">
        <Search className="absolute left-3 top-2.5 text-slate-400" size={16} />
        <input
          type="text"
          placeholder="Search proteins by name, organism or tag..."
          className="w-full pl-9 pr-3 py-2 border border-slate-200 rounded-md focus:outline-none focus:ring-2 focus:ring-[#e31e24] shadow-sm text-sm bg-white disabled:bg-slate-100 disabled:text-slate-400"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          disabled={isBusy}
        />
      </form>

      <div className="text-xs text-slate-500 mt-2 px-1">
        <p>Press Enter to query the catalog endpoint.</p>
      </div>

      {loadingProteinId ? (
        <div className="border border-slate-200 rounded-md p-3 bg-slate-50 shadow-sm text-xs text-slate-600">
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

      {loadError ? (
        <div className="border border-rose-200 rounded-md p-3 bg-rose-50 text-rose-700 text-xs">
          {loadError}
        </div>
      ) : null}

      {renderResults()}
    </div>
  )
}
