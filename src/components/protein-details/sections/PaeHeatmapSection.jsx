import { Section } from '../layout/Section'
import PaeHeatmap from '@/components/PaeHeatmap'

export function PaeHeatmapSection({ v }) {
  if (!v.paeMatrix || v.paeMatrix.length === 0) return null

  return (
    <Section title="Mapa de error PAE">
      <div style={{ maxWidth: '100%', overflow: 'hidden' }}>
        <PaeHeatmap paeMatrix={v.paeMatrix} meanPae={v.meanPae} compact />
      </div>
    </Section>
  )
}
