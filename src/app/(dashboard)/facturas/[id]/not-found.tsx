import { ReceiptTextIcon } from "lucide-react"

import { PageContainer } from "@/components/common/page-container"
import { PageHeader } from "@/components/common/page-header"
import { EmptyState } from "@/components/common/empty-state"
import { Button } from "@/components/ui/button"

export default function FacturaNotFound() {
  return (
    <PageContainer>
      <PageHeader title="Factura no encontrada" />
      <EmptyState
        icon={ReceiptTextIcon}
        title="No encontramos esta factura"
        description="Puede que no exista o que no tengas acceso a ella."
        action={
          <Button variant="outline" render={<a href="/facturas" />}>
            Volver a facturas
          </Button>
        }
      />
    </PageContainer>
  )
}
