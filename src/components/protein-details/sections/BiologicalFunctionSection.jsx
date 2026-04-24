import { SectionContainerLayout } from "../layout/SectionContainerLayout";
import { ProseTextLayout } from "../layout/ProseTextLayout";

export function BiologicalFunctionSection({ v }) {
  if (!v.function && !v.cellularLocation && !v.activity) return null;

  return (
    <SectionContainerLayout title="Función biológica">
      <dl className="flex flex-col gap-1.5">
        {v.function && <ProseTextLayout label="Función">{v.function}</ProseTextLayout>}
        {v.cellularLocation && (
          <ProseTextLayout label="Localización celular">
            {v.cellularLocation}
          </ProseTextLayout>
        )}
        {v.activity && <ProseTextLayout label="Actividad">{v.activity}</ProseTextLayout>}
      </dl>
    </SectionContainerLayout>
  );
}
