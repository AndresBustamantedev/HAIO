import { PageContainer } from "@/components/common/page-container"
import { PageHeader } from "@/components/common/page-header"
import { LoadingState } from "@/components/common/loading-state"
import { Skeleton } from "@/components/ui/skeleton"

export default function ClienteDetailLoading() {
  return (
    <PageContainer>
      <Skeleton className="h-4 w-48" />
      <PageHeader title="Cargando cliente..." />
      <Skeleton className="h-40 w-full rounded-xl" />
      <div className="flex flex-col gap-4">
        <Skeleton className="h-9 w-full max-w-xl" />
        <LoadingState variant="lines" rows={6} />
      </div>
    </PageContainer>
  )
}
