import { FileXIcon } from "lucide-react"

import { PageContainer } from "@/components/common/page-container"
import { PageHeader } from "@/components/common/page-header"
import { EmptyState } from "@/components/common/empty-state"
import { Button } from "@/components/ui/button"

export default function PresupuestoNotFound() {
  return (
    <PageContainer>
      <PageHeader title="Presupuesto no encontrado" />
      <EmptyState
        icon={FileXIcon}
        title="No encontramos este presupuesto"
        description="Puede que haya sido eliminado o que no tengas acceso a él."
        action={
          <Button variant="outline" render={<a href="/presupuestos" />}>
            Volver a presupuestos
          </Button>
        }
      />
    </PageContainer>
  )
}
