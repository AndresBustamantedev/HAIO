import { PageContainer } from "@/components/common/page-container";
import { PageHeader } from "@/components/common/page-header";
import { Skeleton } from "@/components/ui/skeleton";

export default function ConfiguracionLoading() {
  return (
    <PageContainer>
      <PageHeader title="Configuración" description="Ajustes de tu perfil y de la organización." />
      <Skeleton className="h-9 w-64" />
      <Skeleton className="h-96 w-full rounded-xl" />
    </PageContainer>
  );
}
