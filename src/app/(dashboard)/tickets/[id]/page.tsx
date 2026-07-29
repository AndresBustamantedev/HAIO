import { notFound } from "next/navigation"
import Link from "next/link"

import { PageContainer } from "@/components/common/page-container"
import { PageHeader } from "@/components/common/page-header"
import { Breadcrumbs } from "@/components/common/breadcrumbs"
import { StatusBadge } from "@/components/common/status-badge"
import { EditTicketButton } from "@/features/tickets/components/edit-ticket-button"
import { TicketMessageThread } from "@/features/tickets/components/ticket-message-thread"
import { getTicketDetail } from "@/features/tickets/queries/get-ticket-detail"
import { getClientOptions } from "@/lib/supabase/queries/client-options"
import { getTicketPriorityBadge, getTicketStatusBadge } from "@/features/tickets/utils/labels"

type TicketDetailPageProps = {
  params: Promise<{ id: string }>
}

export default async function TicketDetailPage({ params }: TicketDetailPageProps) {
  const { id } = await params
  const detail = await getTicketDetail(id)

  if (!detail) {
    notFound()
  }

  const { ticket, messages } = detail
  const statusBadge = getTicketStatusBadge(ticket.status)
  const priorityBadge = getTicketPriorityBadge(ticket.priority)
  const clientOptions = await getClientOptions(ticket.organization_id)

  return (
    <PageContainer>
      <Breadcrumbs items={[{ label: "Tickets", href: "/tickets" }, { label: ticket.ticket_number }]} />

      <PageHeader
        title={ticket.subject}
        description={
          <span className="flex items-center gap-1.5">
            {ticket.ticket_number}
            {ticket.clients ? (
              <>
                {" · "}
                <Link href={`/clientes/${ticket.clients.id}`} className="hover:underline">
                  {ticket.clients.display_name}
                </Link>
              </>
            ) : null}
          </span>
        }
        actions={
          <div className="flex items-center gap-2">
            <StatusBadge tone={statusBadge.tone} label={statusBadge.label} />
            <StatusBadge tone={priorityBadge.tone} label={priorityBadge.label} />
            <EditTicketButton ticket={ticket} clientOptions={clientOptions} />
          </div>
        }
      />

      {ticket.description ? (
        <div className="rounded-xl border bg-card p-6">
          <p className="mb-2 text-sm font-medium text-foreground">Descripción</p>
          <p className="text-sm text-muted-foreground whitespace-pre-wrap">{ticket.description}</p>
        </div>
      ) : null}

      <TicketMessageThread ticketId={ticket.id} messages={messages} />
    </PageContainer>
  )
}
