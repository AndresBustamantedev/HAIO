import { UserXIcon } from "lucide-react"

import { PageContainer } from "@/components/common/page-container"
import { PageHeader } from "@/components/common/page-header"
import { EmptyState } from "@/components/common/empty-state"
import { Button } from "@/components/ui/button"

export default function ClienteNotFound() {
  return (
    <PageContainer>
      <PageHeader title="Cliente no encontrado" />
      <EmptyState
        icon={UserXIcon}
        title="No encontramos este cliente"
        description="Puede que haya sido eliminado o que no tengas acceso a él."
        action={
          <Button variant="outline" render={<a href="/clientes" />}>
            Volver a clientes
          </Button>
        }
      />
    </PageContainer>
  )
}
