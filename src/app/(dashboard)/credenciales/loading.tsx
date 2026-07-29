import { PageContainer } from "@/components/common/page-container";
import { PageHeader } from "@/components/common/page-header";
import { LoadingState } from "@/components/common/loading-state";
import { Skeleton } from "@/components/ui/skeleton";

export default function CredencialesLoading() {
  return (
    <PageContainer>
      <PageHeader title="Credenciales" description="Accesos y credenciales gestionados por tu equipo." />
      <Skeleton className="h-9 w-full max-w-md" />
      <LoadingState variant="table" rows={8} />
    </PageContainer>
  );
}
