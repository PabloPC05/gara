import { BookOpen, Database, ExternalLink, Link2 } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { pubmedUrl } from '../formatters'

export function IdentityPanel({ v }) {
  const links = [
    v.uniprotId && {
      label: 'UniProt',
      href: `https://www.uniprot.org/uniprot/${v.uniprotId}`,
      icon: Database,
    },
    v.pdbId && {
      label: 'RCSB',
      href: `https://www.rcsb.org/structure/${v.pdbId}`,
      icon: Link2,
    },
    v.uniprotId && {
      label: 'AlphaFold',
      href: `https://alphafold.ebi.ac.uk/entry/${v.uniprotId}`,
      icon: ExternalLink,
    },
    v.name && {
      label: 'PubMed',
      href: pubmedUrl(`${v.name} structure`),
      icon: BookOpen,
    },
  ].filter(Boolean)

  return (
    <header style={{ maxWidth: '100%', overflow: 'hidden', paddingTop: 24, paddingBottom: 12 }} className="min-w-0">
      <span className="text-[9px] font-semibold uppercase tracking-[0.18em] text-slate-400">
        Ficha proteína
      </span>
      <h2 className="mt-0.5 text-base font-bold leading-tight tracking-tight text-slate-900 break-words min-w-0">
        {v.name ?? 'Proteína sin identificar'}
      </h2>

      <div className="mt-0.5 flex flex-wrap items-center gap-x-1.5 text-[11px] text-slate-500 min-w-0">
        {v.organism && <span className="italic">{v.organism}</span>}
        {v.organism && v.length != null && <span className="text-slate-300">&middot;</span>}
        {v.length != null && (
          <span className="font-mono tabular-nums">
            {new Intl.NumberFormat('es-ES').format(v.length)} aa
          </span>
        )}
        {v.dataSource && (
          <>
            <span className="text-slate-300">&middot;</span>
            <span className="text-slate-400">{v.dataSource}</span>
          </>
        )}
      </div>

      {v.description && (
        <p className="mt-1 line-clamp-2 text-[11px] leading-snug text-slate-500">
          {v.description}
        </p>
      )}

      {v.tags.length > 0 && (
        <div className="mt-1.5 flex flex-wrap gap-1">
          {v.tags.map((tag) => (
            <Badge
              key={tag}
              variant="outline"
              className="rounded-none border border-slate-200 bg-slate-50/60 px-1.5 py-0.5 text-[9px] font-medium text-slate-600 font-sans"
            >
              {tag}
            </Badge>
          ))}
        </div>
      )}

      {(v.proteinId || v.uniprotId || v.pdbId || v.modelType || v.jobId) && (
        <div className="mt-2 flex flex-wrap gap-x-3 gap-y-0.5 font-mono text-[9px] text-slate-400">
          {v.proteinId && (
            <span>
              id <span className="text-slate-600">{v.proteinId}</span>
            </span>
          )}
          {v.uniprotId && (
            <span>
              uniprot <span className="text-slate-600">{v.uniprotId}</span>
            </span>
          )}
          {v.pdbId && (
            <span>
              pdb <span className="text-slate-600">{v.pdbId}</span>
            </span>
          )}
          {v.modelType && (
            <span>
              model <span className="text-slate-600">{v.modelType}</span>
            </span>
          )}
          {v.jobId && (
            <span title={v.jobId}>
              job{' '}
              <span className="text-slate-600">
                {v.jobId.slice(0, 12)}
                {v.jobId.length > 12 ? '…' : ''}
              </span>
            </span>
          )}
        </div>
      )}

      {links.length > 0 && (
        <div className="mt-2 flex flex-wrap gap-1">
          {links.map(({ label, href, icon: Icon }) => (
            <a
              key={label}
              href={href}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 rounded-none border border-slate-200 px-1.5 py-0.5 text-[9px] font-medium text-slate-500 transition-colors hover:border-slate-400 hover:text-slate-900"
            >
              <Icon className="h-2.5 w-2.5" strokeWidth={2} />
              {label}
            </a>
          ))}
        </div>
      )}
    </header>
  )
}
