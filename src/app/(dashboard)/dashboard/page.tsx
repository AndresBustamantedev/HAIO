import { BuildingIcon } from "lucide-react"

import { PageContainer } from "@/components/common/page-container"
import { PageHeader } from "@/components/common/page-header"
import { EmptyState } from "@/components/common/empty-state"
import { ErrorState } from "@/components/common/error-state"
import { MetricsGrid } from "@/features/dashboard/components/metrics-grid"
import { FinancialOverviewCard } from "@/features/dashboard/components/financial-overview-card"
import { PendingInvoicesCard } from "@/features/dashboard/components/pending-invoices-card"
import { UpcomingRenewalsCard } from "@/features/dashboard/components/upcoming-renewals-card"
import { RecentActivityCard } from "@/features/dashboard/components/recent-activity-card"
import { PendingTasksCard } from "@/features/dashboard/components/pending-tasks-card"
import { TopClientsCard } from "@/features/dashboard/components/top-clients-card"
import { ServiceStatusCard } from "@/features/dashboard/components/service-status-card"
import { QuickActions } from "@/features/dashboard/components/quick-actions"
import { getDashboardData } from "@/features/dashboard/queries/get-dashboard-data"
import { getCurrentOrganization } from "@/lib/supabase/queries/organizations"

export default async function DashboardPage() {
  const organization = await getCurrentOrganization()

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
    )
  }

  let data
  try {
    data = await getDashboardData(organization.organizationId)
  } catch {
    return (
      <PageContainer>
        <PageHeader title="Dashboard" description="Resumen general de tu actividad en HAIO." />
        <ErrorState description="No se pudieron cargar las métricas del dashboard." />
      </PageContainer>
    )
  }

  return (
    <PageContainer>
      <PageHeader
        title="Dashboard"
        description={`Resumen de ${organization.organizationName}.`}
        actions={<QuickActions />}
      />

      {/* Row 1: 6 metric tiles */}
      <MetricsGrid
        metrics={data.metrics}
        currentMonthRevenue={data.currentMonthRevenue}
      />

      {/* Row 2: Financial chart (2 cols) + Pending invoices + Upcoming renewals */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-4">
        <div className="lg:col-span-2">
          <FinancialOverviewCard series={data.monthlyRevenueSeries} />
        </div>
        <PendingInvoicesCard invoices={data.pendingInvoices} />
        <UpcomingRenewalsCard renewals={data.upcomingRenewals} />
      </div>

      {/* Row 3: Recent activity + Pending tasks + Top clients */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <RecentActivityCard activity={data.recentActivity} />
        <PendingTasksCard tasks={data.pendingTasks} />
        <TopClientsCard clients={data.topClients} />
      </div>

      {/* Row 4: Service status */}
      <ServiceStatusCard />
    </PageContainer>
  )
}
