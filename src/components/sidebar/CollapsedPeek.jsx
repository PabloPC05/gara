import { ChevronRight } from 'lucide-react'

export function CollapsedPeek() {
  return (
    <div className="pointer-events-none absolute inset-0 flex items-center justify-center opacity-0 transition-opacity duration-[120ms] group-data-[collapsible=icon]:pointer-events-auto group-data-[collapsible=icon]:opacity-100">
      <ChevronRight
        className="h-5 w-5 text-slate-400 transition-colors duration-[120ms] hover:text-[#e31e24]"
        strokeWidth={2.5}
      />
    </div>
  )
}
