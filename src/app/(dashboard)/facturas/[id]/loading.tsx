import { PageContainer } from "@/components/common/page-container"
import { PageHeader } from "@/components/common/page-header"
import { LoadingState } from "@/components/common/loading-state"
import { Skeleton } from "@/components/ui/skeleton"

export default function FacturaDetailLoading() {
  return (
    <PageContainer>
      <Skeleton className="h-4 w-48" />
      <PageHeader title="Cargando factura..." />
      <Skeleton className="h-40 w-full rounded-xl" />
      <LoadingState variant="table" rows={4} />
    </PageContainer>
  )
}
