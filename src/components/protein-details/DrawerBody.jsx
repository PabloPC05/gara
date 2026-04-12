import { normalizeProtein } from './normalizeProtein'
import { IdentityPanel } from './sections/IdentityPanel'
import { FunctionSection } from './sections/FunctionSection'
import { PhysicalProps } from './sections/PhysicalProps'
import { PiChargeWidget } from './PiChargeWidget'
import { StructuralConfidence } from './sections/StructuralConfidence'
import { PaeHeatmapSection } from './sections/PaeHeatmapSection'
import { BioViability } from './sections/BioViability'
import { KnownStructures } from './sections/KnownStructures'
import { SequenceSection } from './sections/SequenceSection'
import { ActionBar } from './sections/ActionBar'

export function DrawerBody({ protein }) {
  const v = normalizeProtein(protein)
  if (!v) return null

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', width: '100%', minWidth: 0, overflow: 'hidden', background: 'white' }}>
      <div style={{ flex: '1 1 0%', minHeight: 0, minWidth: 0, width: '100%', overflowY: 'auto', overflowX: 'hidden' }}>
        <div style={{ padding: '0 24px 16px 20px', width: '100%', minWidth: 0, boxSizing: 'border-box' }} className="divide-y divide-slate-100">
          <IdentityPanel v={v} />
          <FunctionSection v={v} />
          <PhysicalProps v={v} />
          <PiChargeWidget v={v} />
          <StructuralConfidence v={v} />
          <PaeHeatmapSection v={v} />
          <BioViability v={v} />
          <KnownStructures v={v} />
          <SequenceSection v={v} />
        </div>
      </div>
      <ActionBar protein={protein} v={v} />
    </div>
  )
}
