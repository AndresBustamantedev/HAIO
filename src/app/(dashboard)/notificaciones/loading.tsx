import { PageContainer } from "@/components/common/page-container";
import { PageHeader } from "@/components/common/page-header";
import { LoadingState } from "@/components/common/loading-state";

export default function NotificacionesLoading() {
  return (
    <PageContainer>
      <PageHeader title="Notificaciones" description="Tus notificaciones recientes." />
      <LoadingState variant="lines" rows={8} />
    </PageContainer>
  );
}
