import Link from "next/link"

import { DataTable, type DataTableColumn } from "@/components/tables/data-table"
import { StatusBadge } from "@/components/common/status-badge"
import { SubscriptionRowActions } from "@/features/subscriptions/components/subscription-row-actions"
import { getBillingIntervalLabel, getSubscriptionStatusBadge } from "@/features/subscriptions/utils/status"
import type { ClientOption, ProjectOption, ServiceOption, SubscriptionWithRelations } from "@/features/subscriptions/types"

function formatDate(value: string | null) {
  if (!value) return "—"
  return new Intl.DateTimeFormat("es-ES", { day: "2-digit", month: "short", year: "numeric" }).format(
    new Date(value)
  )
}

function formatCurrency(value: number, currency: string) {
  return new Intl.NumberFormat("es-ES", { style: "currency", currency }).format(value)
}

function buildColumns(): DataTableColumn<SubscriptionWithRelations>[] {
  return [
    {
      key: "service",
      header: "Servicio",
      cell: (subscription) => (
        <span className="font-medium text-foreground">{subscription.services?.name ?? "—"}</span>
      ),
    },
    {
      key: "client",
      header: "Cliente",
      cell: (subscription) =>
        subscription.clients ? (
          <Link href={`/clientes/${subscription.clients.id}`} className="text-muted-foreground hover:underline">
            {subscription.clients.display_name}
          </Link>
        ) : (
          <span className="text-muted-foreground">—</span>
        ),
    },
    {
      key: "status",
      header: "Estado",
      cell: (subscription) => {
        const badge = getSubscriptionStatusBadge(subscription.status)
        return <StatusBadge tone={badge.tone} label={badge.label} />
      },
    },
    {
      key: "amount",
      header: "Importe",
      cell: (subscription) => (
        <span className="text-muted-foreground">
          {formatCurrency(subscription.amount, subscription.currency_code)} / {getBillingIntervalLabel(subscription.billing_interval)}
        </span>
      ),
    },
    {
      key: "current_period_end",
      header: "Renueva",
      cell: (subscription) => <span className="text-muted-foreground">{formatDate(subscription.current_period_end)}</span>,
    },
  ]
}

function SubscriptionsTable({
  subscriptions,
  clientOptions,
  serviceOptions,
  projectOptions,
}: {
  subscriptions: SubscriptionWithRelations[]
  clientOptions: ClientOption[]
  serviceOptions: ServiceOption[]
  projectOptions?: ProjectOption[]
}) {
  return (
    <DataTable
      columns={buildColumns()}
      rows={subscriptions}
      getRowId={(subscription) => subscription.id}
      rowActions={(subscription) => (
        <SubscriptionRowActions subscription={subscription} clientOptions={clientOptions} serviceOptions={serviceOptions} projectOptions={projectOptions} />
      )}
      emptyTitle="Todavía no hay suscripciones"
      emptyDescription="Crea la primera suscripción recurrente."
    />
  )
}

export { SubscriptionsTable }
