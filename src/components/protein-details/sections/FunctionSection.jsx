import { Section } from '../layout/Section'
import { ProseField } from '../layout/ProseField'

export function FunctionSection({ v }) {
  if (!v.function && !v.cellularLocation && !v.activity) return null

  return (
    <Section title="Función biológica">
      <dl className="flex flex-col gap-1.5">
        {v.function && <ProseField label="Función">{v.function}</ProseField>}
        {v.cellularLocation && (
          <ProseField label="Localización celular">{v.cellularLocation}</ProseField>
        )}
        {v.activity && <ProseField label="Actividad">{v.activity}</ProseField>}
      </dl>
    </Section>
  )
}
