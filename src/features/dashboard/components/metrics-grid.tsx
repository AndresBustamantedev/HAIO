import {
  CircleDollarSignIcon,
  FolderKanbanIcon,
  GlobeIcon,
  TicketIcon,
  TrendingDownIcon,
  TrendingUpIcon,
  UsersIcon,
  WalletIcon,
} from "lucide-react"

import { Card, CardContent } from "@/components/ui/card"
import type { DashboardMetrics } from "@/features/dashboard/queries/get-dashboard-data"

function formatCurrency(value: number) {
  return new Intl.NumberFormat("es-ES", { style: "currency", currency: "EUR" }).format(value)
}

type Tone = "blue" | "violet" | "amber" | "green" | "rose" | "neutral"

const ICON_BG: Record<Tone, string> = {
  blue: "bg-blue-100 text-blue-600 dark:bg-blue-950/40 dark:text-blue-400",
  violet: "bg-violet-100 text-violet-600 dark:bg-violet-950/40 dark:text-violet-400",
  amber: "bg-amber-100 text-amber-600 dark:bg-amber-950/40 dark:text-amber-400",
  green: "bg-emerald-100 text-emerald-600 dark:bg-emerald-950/40 dark:text-emerald-400",
  rose: "bg-rose-100 text-rose-600 dark:bg-rose-950/40 dark:text-rose-400",
  neutral: "bg-muted text-muted-foreground",
}

type MetricTileProps = {
  label: string
  value: string | number
  icon: React.ElementType
  tone?: Tone
  trend?: { value: string; positive: boolean | null }
}

function MetricTile({ label, value, icon: Icon, tone = "blue", trend }: MetricTileProps) {
  return (
    <Card>
      <CardContent className="flex items-start justify-between gap-3 py-5">
        <div className="flex min-w-0 flex-col gap-1">
          <p className="text-xs text-muted-foreground">{label}</p>
          <p className="text-2xl font-bold tracking-tight text-foreground">{value}</p>
          {trend ? (
            <div className="flex items-center gap-1 text-xs">
              {trend.positive === true ? (
                <TrendingUpIcon className="size-3 text-emerald-500" />
              ) : trend.positive === false ? (
                <TrendingDownIcon className="size-3 text-rose-500" />
              ) : null}
              <span
                className={
                  trend.positive === true
                    ? "text-emerald-600 dark:text-emerald-400"
                    : trend.positive === false
                      ? "text-rose-600 dark:text-rose-400"
                      : "text-muted-foreground"
                }
              >
                {trend.value} vs mes anterior
              </span>
            </div>
          ) : null}
        </div>
        <div className={`flex size-10 shrink-0 items-center justify-center rounded-xl ${ICON_BG[tone]}`}>
          <Icon className="size-5" />
        </div>
      </CardContent>
    </Card>
  )
}

function MetricsGrid({
  metrics,
  currentMonthRevenue,
}: {
  metrics: DashboardMetrics | null
  currentMonthRevenue: number
}) {
  return (
    <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 xl:grid-cols-6">
      <MetricTile
        label="Clientes activos"
        value={metrics?.active_clients ?? 0}
        icon={UsersIcon}
        tone="blue"
        trend={{ value: "0%", positive: null }}
      />
      <MetricTile
        label="Proyectos activos"
        value={metrics?.active_projects ?? 0}
        icon={FolderKanbanIcon}
        tone="blue"
        trend={{ value: "0%", positive: null }}
      />
      <MetricTile
        label="Tickets abiertos"
        value={metrics?.open_tickets ?? 0}
        icon={TicketIcon}
        tone={(metrics?.open_tickets ?? 0) > 0 ? "amber" : "neutral"}
        trend={{ value: "0%", positive: null }}
      />
      <MetricTile
        label="Pendiente de cobro"
        value={formatCurrency(metrics?.outstanding_amount ?? 0)}
        icon={CircleDollarSignIcon}
        tone={(metrics?.outstanding_amount ?? 0) > 0 ? "amber" : "green"}
        trend={{
          value: (metrics?.outstanding_amount ?? 0) > 0 ? "↑" : "—",
          positive: null,
        }}
      />
      <MetricTile
        label="Ingresos del mes"
        value={formatCurrency(currentMonthRevenue)}
        icon={WalletIcon}
        tone="green"
        trend={{ value: "0%", positive: null }}
      />
      <MetricTile
        label="Dominios por caducar (30d)"
        value={metrics?.domains_expiring_30d ?? 0}
        icon={GlobeIcon}
        tone={(metrics?.domains_expiring_30d ?? 0) > 0 ? "rose" : "violet"}
        trend={{ value: "0%", positive: null }}
      />
    </div>
  )
}

export { MetricsGrid }
