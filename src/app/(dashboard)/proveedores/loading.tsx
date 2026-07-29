import { PageContainer } from "@/components/common/page-container"
import { PageHeader } from "@/components/common/page-header"
import { LoadingState } from "@/components/common/loading-state"
import { Skeleton } from "@/components/ui/skeleton"

export default function ProveedoresLoading() {
  return (
    <PageContainer>
      <PageHeader title="Proveedores" description="Catálogo de proveedores y cuentas gestionadas." />
      <Skeleton className="h-9 w-full max-w-md" />
      <LoadingState variant="table" rows={6} />
    </PageContainer>
  )
}
