import Link from "next/link"

import { DataTable, type DataTableColumn } from "@/components/tables/data-table"
import { StatusBadge } from "@/components/common/status-badge"
import { TicketRowActions } from "@/features/tickets/components/ticket-row-actions"
import { getTicketPriorityBadge, getTicketStatusBadge } from "@/features/tickets/utils/labels"
import type { TicketWithClient } from "@/features/tickets/types"

function formatDate(value: string) {
  return new Intl.DateTimeFormat("es-ES", { day: "2-digit", month: "short", year: "numeric" }).format(
    new Date(value)
  )
}

const columns: DataTableColumn<TicketWithClient>[] = [
  {
    key: "ticket_number",
    header: "Ticket",
    cell: (ticket) => (
      <Link href={`/tickets/${ticket.id}`} className="font-medium text-foreground hover:underline">
        {ticket.ticket_number}
      </Link>
    ),
  },
  {
    key: "subject",
    header: "Asunto",
    cell: (ticket) => <span className="text-foreground">{ticket.subject}</span>,
  },
  {
    key: "client",
    header: "Cliente",
    cell: (ticket) =>
      ticket.clients ? (
        <Link href={`/clientes/${ticket.clients.id}`} className="text-muted-foreground hover:underline">
          {ticket.clients.display_name}
        </Link>
      ) : (
        <span className="text-muted-foreground">—</span>
      ),
  },
  {
    key: "status",
    header: "Estado",
    cell: (ticket) => {
      const badge = getTicketStatusBadge(ticket.status)
      return <StatusBadge tone={badge.tone} label={badge.label} />
    },
  },
  {
    key: "priority",
    header: "Prioridad",
    cell: (ticket) => {
      const badge = getTicketPriorityBadge(ticket.priority)
      return <StatusBadge tone={badge.tone} label={badge.label} />
    },
  },
  {
    key: "created_at",
    header: "Creado",
    cell: (ticket) => <span className="text-muted-foreground">{formatDate(ticket.created_at)}</span>,
  },
]

function TicketsTable({ tickets }: { tickets: TicketWithClient[] }) {
  return (
    <DataTable
      columns={columns}
      rows={tickets}
      getRowId={(ticket) => ticket.id}
      rowActions={(ticket) => <TicketRowActions ticket={ticket} />}
      emptyTitle="Todavía no hay tickets"
      emptyDescription="Crea el primer ticket de soporte."
    />
  )
}

export { TicketsTable }
