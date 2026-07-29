import { PageContainer } from "@/components/common/page-container"
import { PageHeader } from "@/components/common/page-header"
import { LoadingState } from "@/components/common/loading-state"
import { Skeleton } from "@/components/ui/skeleton"

export default function TicketDetailLoading() {
  return (
    <PageContainer>
      <Skeleton className="h-4 w-48" />
      <PageHeader title="Cargando ticket..." />
      <LoadingState variant="lines" rows={6} />
    </PageContainer>
  )
}
