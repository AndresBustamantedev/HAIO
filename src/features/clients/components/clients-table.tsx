import Link from "next/link"

import { DataTable, type DataTableColumn } from "@/components/tables/data-table"
import { StatusBadge } from "@/components/common/status-badge"
import { ClientRowActions } from "@/features/clients/components/client-row-actions"
import { getClientStatusBadge } from "@/features/clients/utils/status"
import type { Client } from "@/features/clients/types"

const TYPE_LABELS: Record<Client["type"], string> = {
  individual: "Particular",
  company: "Empresa",
  association: "Asociación",
  other: "Otro",
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat("es-ES", { day: "2-digit", month: "short", year: "numeric" }).format(
    new Date(value)
  )
}

const columns: DataTableColumn<Client>[] = [
  {
    key: "display_name",
    header: "Cliente",
    cell: (client) => (
      <Link href={`/clientes/${client.id}`} className="font-medium text-foreground hover:underline">
        {client.display_name}
      </Link>
    ),
  },
  {
    key: "type",
    header: "Tipo",
    cell: (client) => <span className="text-muted-foreground">{TYPE_LABELS[client.type]}</span>,
  },
  {
    key: "status",
    header: "Estado",
    cell: (client) => {
      const badge = getClientStatusBadge(client.status)
      return <StatusBadge tone={badge.tone} label={badge.label} />
    },
  },
  {
    key: "email",
    header: "Email",
    cell: (client) => <span className="text-muted-foreground">{client.email ?? "—"}</span>,
  },
  {
    key: "city",
    header: "Ciudad",
    cell: (client) => <span className="text-muted-foreground">{client.city ?? "—"}</span>,
  },
  {
    key: "created_at",
    header: "Creado",
    cell: (client) => (
      <span className="text-muted-foreground">{formatDate(client.created_at)}</span>
    ),
  },
]

function ClientsTable({ clients }: { clients: Client[] }) {
  return (
    <DataTable
      columns={columns}
      rows={clients}
      getRowId={(client) => client.id}
      rowActions={(client) => <ClientRowActions client={client} />}
      emptyTitle="Todavía no hay clientes"
      emptyDescription="Crea tu primer cliente para empezar a gestionar proyectos y facturación."
    />
  )
}

export { ClientsTable }
