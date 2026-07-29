import { CircleDollarSignIcon, FolderKanbanIcon, GlobeIcon, TicketIcon, UsersIcon } from "lucide-react"

import { MetricCard } from "@/components/common/metric-card"
import type { DashboardMetrics } from "@/features/dashboard/queries/get-dashboard-data"

function formatCurrency(value: number) {
  return new Intl.NumberFormat("es-ES", { style: "currency", currency: "EUR" }).format(value)
}

function MetricsGrid({ metrics }: { metrics: DashboardMetrics | null }) {
  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
      <MetricCard
        label="Clientes activos"
        value={metrics?.active_clients ?? 0}
        icon={UsersIcon}
      />
      <MetricCard
        label="Proyectos activos"
        value={metrics?.active_projects ?? 0}
        icon={FolderKanbanIcon}
      />
      <MetricCard
        label="Tickets abiertos"
        value={metrics?.open_tickets ?? 0}
        icon={TicketIcon}
        tone={(metrics?.open_tickets ?? 0) > 0 ? "warning" : "neutral"}
      />
      <MetricCard
        label="Pendiente de cobro"
        value={formatCurrency(metrics?.outstanding_amount ?? 0)}
        icon={CircleDollarSignIcon}
        tone={(metrics?.outstanding_amount ?? 0) > 0 ? "warning" : "success"}
      />
      <MetricCard
        label="Dominios por caducar (30d)"
        value={metrics?.domains_expiring_30d ?? 0}
        icon={GlobeIcon}
        tone={(metrics?.domains_expiring_30d ?? 0) > 0 ? "destructive" : "neutral"}
      />
    </div>
  )
}

export { MetricsGrid }
