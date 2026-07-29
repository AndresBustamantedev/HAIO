import { ConstructionIcon } from "lucide-react"

import { PageContainer } from "@/components/common/page-container"
import { PageHeader } from "@/components/common/page-header"
import { EmptyState } from "@/components/common/empty-state"

type ComingSoonProps = {
  title: string
  description?: string
}

/**
 * Consistent placeholder for nav modules not built yet. Keeps every link in
 * AppSidebar/MobileSidebar resolving to a real, on-brand page instead of a
 * 404 while each module is implemented in its own phase.
 */
function ComingSoon({ title, description }: ComingSoonProps) {
  return (
    <PageContainer>
      <PageHeader title={title} description={description ?? `Gestión de ${title.toLowerCase()}.`} />
      <EmptyState
        icon={ConstructionIcon}
        title="Módulo en construcción"
        description="Este módulo todavía no está disponible. Se está desarrollando siguiendo el mismo sistema de diseño que el resto de HAIO."
      />
    </PageContainer>
  )
}

export { ComingSoon }
