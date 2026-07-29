import Link from "next/link"

import { DataTable, type DataTableColumn } from "@/components/tables/data-table"
import { StatusBadge } from "@/components/common/status-badge"
import { HostingRowActions } from "@/features/hosting/components/hosting-row-actions"
import { getHostingStatusBadge } from "@/features/hosting/utils/status"
import type { ClientOption, HostingWithClient } from "@/features/hosting/types"

function formatDate(value: string | null) {
  if (!value) return "—"
  return new Intl.DateTimeFormat("es-ES", { day: "2-digit", month: "short", year: "numeric" }).format(
    new Date(value)
  )
}

function buildColumns(): DataTableColumn<HostingWithClient>[] {
  return [
    {
      key: "provider_name",
      header: "Proveedor",
      cell: (hosting) => (
        <div className="flex flex-col">
          <span className="font-medium text-foreground">{hosting.provider_name}</span>
          {hosting.plan_name ? <span className="text-xs text-muted-foreground">{hosting.plan_name}</span> : null}
        </div>
      ),
    },
    {
      key: "client",
      header: "Cliente",
      cell: (hosting) =>
        hosting.clients ? (
          <Link href={`/clientes/${hosting.clients.id}`} className="text-muted-foreground hover:underline">
            {hosting.clients.display_name}
          </Link>
        ) : (
          <span className="text-muted-foreground">—</span>
        ),
    },
    {
      key: "status",
      header: "Estado",
      cell: (hosting) => {
        const badge = getHostingStatusBadge(hosting.status)
        return <StatusBadge tone={badge.tone} label={badge.label} />
      },
    },
    {
      key: "expires_on",
      header: "Expira",
      cell: (hosting) => <span className="text-muted-foreground">{formatDate(hosting.expires_on)}</span>,
    },
  ]
}

function HostingTable({ hostingAccounts, clientOptions }: { hostingAccounts: HostingWithClient[]; clientOptions: ClientOption[] }) {
  return (
    <DataTable
      columns={buildColumns()}
      rows={hostingAccounts}
      getRowId={(hosting) => hosting.id}
      rowActions={(hosting) => <HostingRowActions hosting={hosting} clientOptions={clientOptions} />}
      emptyTitle="Todavía no hay cuentas de hosting"
      emptyDescription="Registra la primera cuenta de hosting de un cliente."
    />
  )
}

export { HostingTable }
