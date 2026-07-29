import { FolderXIcon } from "lucide-react"

import { PageContainer } from "@/components/common/page-container"
import { PageHeader } from "@/components/common/page-header"
import { EmptyState } from "@/components/common/empty-state"
import { Button } from "@/components/ui/button"

export default function ProyectoNotFound() {
  return (
    <PageContainer>
      <PageHeader title="Proyecto no encontrado" />
      <EmptyState
        icon={FolderXIcon}
        title="No encontramos este proyecto"
        description="Puede que haya sido eliminado o que no tengas acceso a él."
        action={
          <Button variant="outline" render={<a href="/proyectos" />}>
            Volver a proyectos
          </Button>
        }
      />
    </PageContainer>
  )
}
