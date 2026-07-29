import { LifeBuoyIcon } from "lucide-react"

import { PageContainer } from "@/components/common/page-container"
import { PageHeader } from "@/components/common/page-header"
import { EmptyState } from "@/components/common/empty-state"
import { Button } from "@/components/ui/button"

export default function TicketNotFound() {
  return (
    <PageContainer>
      <PageHeader title="Ticket no encontrado" />
      <EmptyState
        icon={LifeBuoyIcon}
        title="No encontramos este ticket"
        description="Puede que haya sido eliminado o que no tengas acceso a él."
        action={
          <Button variant="outline" render={<a href="/tickets" />}>
            Volver a tickets
          </Button>
        }
      />
    </PageContainer>
  )
}
