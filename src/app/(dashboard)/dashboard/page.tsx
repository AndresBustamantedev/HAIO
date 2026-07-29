import { BuildingIcon } from "lucide-react";

import { PageContainer } from "@/components/common/page-container";
import { PageHeader } from "@/components/common/page-header";
import { EmptyState } from "@/components/common/empty-state";
import { ErrorState } from "@/components/common/error-state";
import { MetricsGrid } from "@/features/dashboard/components/metrics-grid";
import { PendingInvoicesCard } from "@/features/dashboard/components/pending-invoices-card";
import { UpcomingRenewalsCard } from "@/features/dashboard/components/upcoming-renewals-card";
import { RecentClientsCard } from "@/features/dashboard/components/recent-clients-card";
import { PendingTasksCard } from "@/features/dashboard/components/pending-tasks-card";
import { QuickActions } from "@/features/dashboard/components/quick-actions";
import { getDashboardData } from "@/features/dashboard/queries/get-dashboard-data";
import { getCurrentOrganization } from "@/lib/supabase/queries/organizations";

export default async function DashboardPage() {
  const organization = await getCurrentOrganization();

  if (!organization) {
    return (
      <PageContainer>
        <PageHeader title="Dashboard" description="Resumen general de tu actividad en HAIO." />
        <EmptyState
          icon={BuildingIcon}
          title="Todavía no perteneces a ninguna organización"
          description="Cuando se te añada como miembro de una organización, aquí verás sus métricas."
        />
      </PageContainer>
    );
  }

  let data;
  try {
    data = await getDashboardData(organization.organizationId);
  } catch {
    return (
      <PageContainer>
        <PageHeader title="Dashboard" description="Resumen general de tu actividad en HAIO." />
        <ErrorState description="No se pudieron cargar las métricas del dashboard." />
      </PageContainer>
    );
  }

  return (
    <PageContainer>
      <PageHeader
        title="Dashboard"
        description={`Resumen de ${organization.organizationName}.`}
        actions={<QuickActions />}
      />

      <MetricsGrid metrics={data.metrics} />

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <PendingInvoicesCard invoices={data.pendingInvoices} />
        <UpcomingRenewalsCard renewals={data.upcomingRenewals} />
        <RecentClientsCard clients={data.recentClients} />
        <PendingTasksCard tasks={data.pendingTasks} />
      </div>
    </PageContainer>
  );
}
