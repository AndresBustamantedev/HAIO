import { notFound, redirect } from "next/navigation"
import Link from "next/link"
import { ArrowLeftIcon } from "lucide-react"

import { getPortalSession } from "@/lib/supabase/queries/portal"
import { createClient } from "@/lib/supabase/server"
import { StatusBadge } from "@/components/common/status-badge"
import type { StatusBadgeTone } from "@/components/common/status-badge"
import { PortalReplyForm } from "./_components/portal-reply-form"

type Props = { params: Promise<{ ticketId: string }> }

function formatDateTime(d: string) {
  return new Intl.DateTimeFormat("es-ES", { dateStyle: "medium", timeStyle: "short" }).format(new Date(d))
}

function ticketStatusTone(status: string | null): StatusBadgeTone {
  if (status === "open") return "warning"
  if (status === "in_progress") return "info"
  if (status === "resolved" || status === "closed") return "success"
  return "neutral"
}

function priorityTone(priority: string | null): StatusBadgeTone {
  if (priority === "urgent") return "destructive"
  if (priority === "high") return "warning"
  if (priority === "normal" || priority === "medium") return "info"
  return "neutral"
}

const STATUS_LABEL: Record<string, string> = {
  open: "Abierto", in_progress: "En progreso", waiting_client: "Esperando respuesta",
  resolved: "Resuelto", closed: "Cerrado", cancelled: "Cancelado",
}
const PRIORITY_LABEL: Record<string, string> = {
  low: "Baja", normal: "Normal", high: "Alta", urgent: "Urgente",
}

export default async function PortalTicketDetailPage({ params }: Props) {
  const { ticketId } = await params
  const session = await getPortalSession()
  if (!session || !session.access.can_create_tickets) redirect("/portal")

  const supabase = await createClient()

  const { data: ticket } = await supabase
    .from("tickets")
    .select("id, ticket_number, subject, description, status, priority, created_at")
    .eq("id", ticketId)
    .eq("client_id", session.access.client_id)
    .is("deleted_at", null)
    .maybeSingle()

  if (!ticket) notFound()

  const { data: rawMessages } = await supabase
    .from("ticket_messages")
    .select("id, body, is_internal, created_at, author_user_id")
    .eq("ticket_id", ticketId)
    .eq("is_internal", false)
    .order("created_at", { ascending: true })

  const messages = rawMessages ?? []
  const isClosed = ticket.status === "closed" || ticket.status === "resolved" || ticket.status === "cancelled"

  return (
    <div className="flex flex-col gap-6">
      {/* Header */}
      <div className="flex flex-col gap-3">
        <Link
          href="/portal/soporte"
          className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors w-fit"
        >
          <ArrowLeftIcon className="size-3.5" />
          Volver a soporte
        </Link>

        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <p className="text-xs text-muted-foreground">{ticket.ticket_number}</p>
            <h1 className="text-xl font-bold text-foreground">{ticket.subject}</h1>
            <p className="text-xs text-muted-foreground mt-0.5">
              Abierto el {formatDateTime(ticket.created_at)}
            </p>
          </div>
          <div className="flex gap-1.5">
            <StatusBadge
              tone={priorityTone(ticket.priority)}
              label={PRIORITY_LABEL[ticket.priority ?? ""] ?? ticket.priority ?? "—"}
            />
            <StatusBadge
              tone={ticketStatusTone(ticket.status)}
              label={STATUS_LABEL[ticket.status ?? ""] ?? ticket.status ?? "—"}
            />
          </div>
        </div>
      </div>

      {/* Descripción original */}
      {ticket.description && (
        <div className="rounded-xl border bg-card p-4">
          <p className="mb-2 text-xs font-medium uppercase tracking-wide text-muted-foreground">Descripción</p>
          <p className="text-sm text-foreground whitespace-pre-wrap">{ticket.description}</p>
        </div>
      )}

      {/* Hilo de mensajes */}
      <div className="flex flex-col gap-3">
        <p className="text-sm font-medium text-foreground">Conversación</p>

        {messages.length === 0 ? (
          <div className="rounded-xl border bg-card px-5 py-8 text-center text-sm text-muted-foreground">
            Todavía no hay respuestas. Te contestaremos pronto.
          </div>
        ) : (
          <ul className="flex flex-col gap-2">
            {messages.map((msg) => {
              const isOwnMessage = msg.author_user_id === session.userId
              return (
                <li
                  key={msg.id}
                  className={
                    isOwnMessage
                      ? "ml-8 rounded-xl border bg-primary/5 p-3"
                      : "mr-8 rounded-xl border bg-card p-3"
                  }
                >
                  <div className="mb-1 flex items-center justify-between text-xs text-muted-foreground">
                    <span>{isOwnMessage ? "Tú" : "Soporte"}</span>
                    <span>{formatDateTime(msg.created_at)}</span>
                  </div>
                  <p className="text-sm text-foreground whitespace-pre-wrap">{msg.body}</p>
                </li>
              )
            })}
          </ul>
        )}
      </div>

      {/* Formulario de respuesta (solo si el ticket no está cerrado) */}
      {!isClosed && <PortalReplyForm ticketId={ticketId} />}

      {isClosed && (
        <p className="text-center text-sm text-muted-foreground">
          Este ticket está cerrado. Si necesitas más ayuda, abre un nuevo ticket.
        </p>
      )}
    </div>
  )
}
