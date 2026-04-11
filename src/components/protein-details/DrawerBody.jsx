import { DrawerHeader } from './DrawerHeader'
import { BiologicalStatusCard } from './BiologicalStatusCard'
import { PhysicalPropertiesCard } from './PhysicalPropertiesCard'

export function DrawerBody({ protein }) {
  return (
    <div className="flex h-full flex-col overflow-y-auto">
      <DrawerHeader protein={protein} />
      <div className="flex flex-1 flex-col gap-5 px-7 py-6">
        <BiologicalStatusCard biological={protein.biological} />
        <PhysicalPropertiesCard biological={protein.biological} />
      </div>
    </div>
  )
}
