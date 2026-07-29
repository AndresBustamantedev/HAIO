import Link from "next/link"

import { DataTable, type DataTableColumn } from "@/components/tables/data-table"
import { StatusBadge } from "@/components/common/status-badge"
import { DomainRowActions } from "@/features/domains/components/domain-row-actions"
import { getDomainStatusBadge } from "@/features/domains/utils/status"
import type { ClientOption, DomainWithClient } from "@/features/domains/types"

function formatDate(value: string | null) {
  if (!value) return "—"
  return new Intl.DateTimeFormat("es-ES", { day: "2-digit", month: "short", year: "numeric" }).format(
    new Date(value)
  )
}

function buildColumns(): DataTableColumn<DomainWithClient>[] {
  return [
    {
      key: "domain_name",
      header: "Dominio",
      cell: (domain) => <span className="font-medium text-foreground">{domain.domain_name}</span>,
    },
    {
      key: "client",
      header: "Cliente",
      cell: (domain) =>
        domain.clients ? (
          <Link href={`/clientes/${domain.clients.id}`} className="text-muted-foreground hover:underline">
            {domain.clients.display_name}
          </Link>
        ) : (
          <span className="text-muted-foreground">—</span>
        ),
    },
    {
      key: "status",
      header: "Estado",
      cell: (domain) => {
        const badge = getDomainStatusBadge(domain.status)
        return <StatusBadge tone={badge.tone} label={badge.label} />
      },
    },
    {
      key: "registrar_name",
      header: "Registrador",
      cell: (domain) => <span className="text-muted-foreground">{domain.registrar_name ?? "—"}</span>,
    },
    {
      key: "expires_on",
      header: "Expira",
      cell: (domain) => <span className="text-muted-foreground">{formatDate(domain.expires_on)}</span>,
    },
  ]
}

function DomainsTable({ domains, clientOptions }: { domains: DomainWithClient[]; clientOptions: ClientOption[] }) {
  return (
    <DataTable
      columns={buildColumns()}
      rows={domains}
      getRowId={(domain) => domain.id}
      rowActions={(domain) => <DomainRowActions domain={domain} clientOptions={clientOptions} />}
      emptyTitle="Todavía no hay dominios"
      emptyDescription="Registra el primer dominio de un cliente."
    />
  )
}

export { DomainsTable }
