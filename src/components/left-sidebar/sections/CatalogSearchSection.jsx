import React, { useState, useRef, useEffect } from "react";
import { Loader2, Search } from "lucide-react";

import { PersistentJobStatusPanel } from "@/components/ui/PersistentJobStatusPanel";
import { searchCatalogProteins } from "@/lib/apiClient";
import { loadCatalogProtein } from "@/lib/catalogProteinLoader";
import {
  ACTIVE_JOB_STATUSES,
  JOB_PANEL_KEYS,
  useJobStatusStore,
} from "@/stores/useJobStatusStore";

const PROTEIN_CATEGORIES = [
  { value: "enzyme", label: "Enzyme" },
  { value: "receptor", label: "Receptor" },
  { value: "transporter", label: "Transporter" },
  { value: "structural", label: "Structural" },
  { value: "immune", label: "Immune" },
  { value: "hormone", label: "Hormone" },
  { value: "signaling", label: "Signaling" },
  { value: "chaperone", label: "Chaperone" },
  { value: "kinase", label: "Kinase" },
  { value: "protease", label: "Protease" },
];

const INITIAL_CATALOG_LIMIT = 10;
const INITIAL_CATALOG_CACHE_KEY = "catalog:initial-results:v1";

let cachedInitialCatalogResults;

export function __resetInitialCatalogCacheForTests() {
  cachedInitialCatalogResults = undefined;
}

function normalizeCatalogFilters({
  search = "",
  category = "",
  minLength = "",
  maxLength = "",
}) {
  return {
    search: search.trim(),
    category: category.trim(),
    minLength: minLength === "" ? "" : String(minLength),
    maxLength: maxLength === "" ? "" : String(maxLength),
  };
}

function hasActiveCatalogFilters(filters) {
  const normalized = normalizeCatalogFilters(filters);
  return Boolean(
    normalized.search ||
    normalized.category ||
    normalized.minLength !== "" ||
    normalized.maxLength !== "",
  );
}

function isCatalogResultList(value) {
  return (
    Array.isArray(value) &&
    value.every(
      (item) =>
        item &&
        typeof item === "object" &&
        typeof item.proteinId === "string" &&
        item.proteinId.length > 0,
    )
  );
}

function readInitialCatalogCache() {
  if (cachedInitialCatalogResults !== undefined) {
    return cachedInitialCatalogResults;
  }

  if (typeof window === "undefined") {
    cachedInitialCatalogResults = null;
    return cachedInitialCatalogResults;
  }

  try {
    const raw = window.sessionStorage.getItem(INITIAL_CATALOG_CACHE_KEY);
    if (!raw) {
      cachedInitialCatalogResults = null;
      return cachedInitialCatalogResults;
    }

    const parsed = JSON.parse(raw);
    cachedInitialCatalogResults = isCatalogResultList(parsed) ? parsed : null;
  } catch {
    cachedInitialCatalogResults = null;
  }

  return cachedInitialCatalogResults;
}

function writeInitialCatalogCache(results) {
  const nextResults = isCatalogResultList(results)
    ? results.slice(0, INITIAL_CATALOG_LIMIT)
    : [];

  cachedInitialCatalogResults = nextResults;

  if (typeof window === "undefined") return;

  try {
    window.sessionStorage.setItem(
      INITIAL_CATALOG_CACHE_KEY,
      JSON.stringify(nextResults),
    );
  } catch {
    // sessionStorage puede estar deshabilitado; la cache en memoria sigue activa
  }
}

export function CatalogSearchSection() {
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState("");
  const [minLength, setMinLength] = useState("");
  const [maxLength, setMaxLength] = useState("");

  const [initialResults, setInitialResults] = useState(
    () => readInitialCatalogCache() ?? [],
  );
  const [isLoadingInitialCatalog, setIsLoadingInitialCatalog] = useState(
    () => readInitialCatalogCache() === null,
  );
  const [initialCatalogError, setInitialCatalogError] = useState(null);
  const [filteredResults, setFilteredResults] = useState([]);
  const [isSearchingFiltered, setIsSearchingFiltered] = useState(false);
  const [filteredSearchError, setFilteredSearchError] = useState(null);
  const [activeIndex, setActiveIndex] = useState(-1);

  const itemRefs = useRef([]);
  const latestFilteredSearchIdRef = useRef(0);

  const catalogJobPanel = useJobStatusStore(
    (s) => s.panelsByKey[JOB_PANEL_KEYS.catalog] ?? null,
  );

  const normalizedFilters = normalizeCatalogFilters({
    search: query,
    category,
    minLength,
    maxLength,
  });
  const { search: normalizedQuery, category: normalizedCategory } =
    normalizedFilters;
  const normalizedMinLength = normalizedFilters.minLength;
  const normalizedMaxLength = normalizedFilters.maxLength;
  const isFilteredMode = hasActiveCatalogFilters(normalizedFilters);
  const visibleResults = isFilteredMode ? filteredResults : initialResults;
  const visibleError = isFilteredMode
    ? filteredSearchError
    : initialCatalogError;
  const isLoadingVisibleResults = isFilteredMode
    ? isSearchingFiltered
    : isLoadingInitialCatalog;
  const isJobActive = ACTIVE_JOB_STATUSES.has(catalogJobPanel?.status);
  const catalogLoadingProteinId = isJobActive
    ? (catalogJobPanel?.subjectId ?? null)
    : null;
  const isProteinLoadBusy = isJobActive;
  const isResultActionBusy = isProteinLoadBusy || isLoadingVisibleResults;

  // Load initial catalog results on mount
  useEffect(() => {
    const cachedResults = readInitialCatalogCache();
    if (cachedResults !== null) {
      setInitialResults(cachedResults);
      setInitialCatalogError(null);
      setIsLoadingInitialCatalog(false);
      return;
    }

    let cancelled = false;

    const loadInitialCatalog = async () => {
      setIsLoadingInitialCatalog(true);
      setInitialCatalogError(null);

      try {
        const nextResults = await searchCatalogProteins({
          limit: INITIAL_CATALOG_LIMIT,
        });
        if (cancelled) return;
        setInitialResults(nextResults);
        writeInitialCatalogCache(nextResults);
      } catch (error) {
        if (cancelled) return;
        setInitialCatalogError(
          error?.message ?? "No se pudo consultar el catalogo",
        );
      } finally {
        if (!cancelled) {
          setIsLoadingInitialCatalog(false);
        }
      }
    };

    loadInitialCatalog();

    return () => {
      cancelled = true;
    };
  }, []);

  // Debounced filtered search
  useEffect(() => {
    if (!isFilteredMode) {
      latestFilteredSearchIdRef.current += 1;
      setFilteredResults([]);
      setFilteredSearchError(null);
      setIsSearchingFiltered(false);
      setActiveIndex(-1);
      return;
    }

    const searchId = ++latestFilteredSearchIdRef.current;
    setIsSearchingFiltered(true);
    setFilteredSearchError(null);
    setFilteredResults([]);
    setActiveIndex(-1);

    const timer = setTimeout(async () => {
      try {
        const nextResults = await searchCatalogProteins(normalizedFilters);
        if (searchId !== latestFilteredSearchIdRef.current) return;
        setFilteredResults(nextResults);
      } catch (error) {
        if (searchId !== latestFilteredSearchIdRef.current) return;
        setFilteredSearchError(
          error?.message ?? "No se pudo consultar el catalogo",
        );
      } finally {
        if (searchId === latestFilteredSearchIdRef.current) {
          setIsSearchingFiltered(false);
        }
      }
    }, 350);

    return () => {
      clearTimeout(timer);
    };
  }, [
    isFilteredMode,
    normalizedQuery,
    normalizedCategory,
    normalizedMinLength,
    normalizedMaxLength,
  ]);

  const handleQueryChange = (e) => {
    setQuery(e.target.value);
    setActiveIndex(-1);
  };

  const handleKeyDown = (e) => {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setActiveIndex((i) => Math.min(i + 1, visibleResults.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActiveIndex((i) => Math.max(i - 1, 0));
    } else if (e.key === "Enter") {
      e.preventDefault();
      if (activeIndex >= 0 && !isResultActionBusy)
        handleSelectProtein(visibleResults[activeIndex]);
    }
  };

  useEffect(() => {
    if (activeIndex >= 0 && itemRefs.current[activeIndex]) {
      itemRefs.current[activeIndex].scrollIntoView({ block: "nearest" });
    }
  }, [activeIndex]);

  // Cleanup: invalidate in-flight filtered searches on unmount
  useEffect(
    () => () => {
      latestFilteredSearchIdRef.current += 1;
    },
    [],
  );

  const clearFilters = () => {
    setQuery("");
    setCategory("");
    setMinLength("");
    setMaxLength("");
    setActiveIndex(-1);
  };

  const handleSelectProtein = async (result) => {
    if (!result?.proteinId || isResultActionBusy) return;

    try {
      await loadCatalogProtein(result.proteinId);
    } catch {
      // El servicio ya refleja el error en el store global del catalogo.
    }
  };

  const inputClass =
    "w-full px-2 py-1.5 border border-slate-200 rounded-none text-sm bg-white " +
    "focus:outline-none focus:ring-2 focus:ring-[#e31e24] shadow-sm " +
    "disabled:bg-slate-100 disabled:text-slate-400";

  const filterLabelClass =
    "text-[11px] font-medium text-slate-400 uppercase tracking-wide";

  const renderResults = () => {
    if (isLoadingVisibleResults) {
      return (
        <div className="mt-4 flex flex-1 flex-col items-center justify-center overflow-auto rounded-none border border-slate-200 bg-slate-50 p-4 text-center text-slate-500">
          <Loader2 size={28} className="mb-3 animate-spin text-[#e31e24]" />
          <p className="font-medium text-slate-700">
            {isFilteredMode
              ? "Consultando catalogo..."
              : "Cargando catalogo..."}
          </p>
          <p className="mt-2 text-xs text-slate-500">
            La primera peticion puede tardar hasta 30 s si la API estaba en
            reposo.
          </p>
        </div>
      );
    }

    if (visibleError) {
      return (
        <div className="mt-4 flex flex-1 flex-col items-center justify-center overflow-auto rounded-none border border-rose-200 bg-rose-50 p-4 text-center text-rose-700">
          <p className="font-medium">No se pudo consultar el catalogo.</p>
          <p className="mt-2 text-xs">{visibleError}</p>
        </div>
      );
    }

    if (visibleResults.length === 0) {
      return (
        <div className="mt-4 flex flex-1 flex-col items-center justify-center overflow-auto rounded-none border border-slate-100 bg-slate-50 p-4 text-center text-slate-500">
          <p className="font-medium text-slate-700">Sin resultados</p>
          <p className="mt-2 text-xs">
            {isFilteredMode
              ? "No se encontraron proteinas con los filtros aplicados."
              : "No hay proteinas disponibles para el listado inicial."}
          </p>
        </div>
      );
    }

    return (
      <div className="mt-4 flex-1 overflow-auto rounded-none border border-slate-200 bg-white shadow-sm">
        <div className="flex flex-col divide-y divide-slate-100">
          {visibleResults.map((result, index) => {
            const isLoadingThisProtein =
              catalogLoadingProteinId === result.proteinId;
            const isHighlighted = index === activeIndex;
            return (
              <button
                key={result.proteinId}
                ref={(el) => (itemRefs.current[index] = el)}
                type="button"
                onClick={() => handleSelectProtein(result)}
                disabled={isResultActionBusy}
                className={`w-full p-4 text-left transition-colors disabled:cursor-wait disabled:opacity-70 ${
                  isHighlighted
                    ? "border-l-2 border-l-[#e31e24] bg-[#fde8e8]/70"
                    : "hover:bg-slate-50"
                }`}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="font-semibold text-slate-900">
                      {result.proteinName}
                    </p>
                    <p className="mt-1 text-xs text-slate-500">
                      {result.organism}
                    </p>
                  </div>
                  {isLoadingThisProtein ? (
                    <span className="inline-flex items-center gap-2 whitespace-nowrap text-xs font-medium text-[#e31e24]">
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
            );
          })}
        </div>
      </div>
    );
  };

  return (
    <div className="flex h-full flex-col gap-3 text-sm text-slate-700">
      <h2 className="px-1 text-xs font-semibold uppercase tracking-wider text-slate-500">
        Explore Catalog
      </h2>

      {/* Text search */}
      <form onSubmit={(e) => e.preventDefault()} className="relative mt-1">
        <Search className="absolute left-3 top-2.5 text-slate-400" size={16} />
        <input
          type="text"
          placeholder="Search proteins by name, organism or tag..."
          className="w-full rounded-none border border-slate-200 bg-white py-2 pl-9 pr-3 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-[#e31e24] disabled:bg-slate-100 disabled:text-slate-400"
          value={query}
          onChange={handleQueryChange}
          onKeyDown={handleKeyDown}
          disabled={isProteinLoadBusy}
        />
      </form>

      {/* Category filter */}
      <div className="flex flex-col gap-1">
        <label className={filterLabelClass}>Category</label>
        <select
          value={category}
          onChange={(e) => setCategory(e.target.value)}
          disabled={isProteinLoadBusy}
          className={inputClass}
        >
          <option value="">All categories</option>
          {PROTEIN_CATEGORIES.map((c) => (
            <option key={c.value} value={c.value}>
              {c.label}
            </option>
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
            onChange={(e) => setMinLength(e.target.value)}
            disabled={isProteinLoadBusy}
            className={inputClass}
          />
          <span className="shrink-0 text-xs text-slate-400">&ndash;</span>
          <input
            type="number"
            min={1}
            placeholder="Max"
            value={maxLength}
            onChange={(e) => setMaxLength(e.target.value)}
            disabled={isProteinLoadBusy}
            className={inputClass}
          />
        </div>
      </div>

      {/* Clear filters */}
      {isFilteredMode ? (
        <div className="flex justify-end">
          <button
            type="button"
            onClick={clearFilters}
            disabled={isProteinLoadBusy}
            className="text-xs text-slate-400 transition-colors hover:text-slate-600 disabled:opacity-40"
          >
            Clear filters
          </button>
        </div>
      ) : null}

      <PersistentJobStatusPanel panelKey={JOB_PANEL_KEYS.catalog} />

      {renderResults()}
    </div>
  );
}
