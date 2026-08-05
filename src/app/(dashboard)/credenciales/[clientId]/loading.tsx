import { PageContainer } from "@/components/common/page-container"
import { PageHeader } from "@/components/common/page-header"
import { LoadingState } from "@/components/common/loading-state"
import { Skeleton } from "@/components/ui/skeleton"

export default function ClientCredencialesLoading() {
  return (
    <PageContainer>
      <Skeleton className="mb-1 h-4 w-32" />
      <PageHeader title="Credenciales" description="Credenciales de acceso de este cliente." />
      <LoadingState variant="table" rows={6} />
    </PageContainer>
  )
}
