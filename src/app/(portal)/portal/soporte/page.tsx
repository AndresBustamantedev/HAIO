import { redirect } from "next/navigation"
import { HeadphonesIcon } from "lucide-react"

import { getPortalSession } from "@/lib/supabase/queries/portal"
import { createClient } from "@/lib/supabase/server"
import { StatusBadge } from "@/components/common/status-badge"
import type { StatusBadgeTone } from "@/components/common/status-badge"
import type { PortalTicket } from "@/features/portal/queries/get-portal-overview"

function formatDate(d: string | null) {
  if (!d) return "—"
  return new Intl.DateTimeFormat("es-ES", { day: "numeric", month: "short", year: "numeric" }).format(new Date(d))
}

function ticketStatusTone(status: string | null): StatusBadgeTone {
  if (status === "open") return "warning"
  if (status === "in_progress") return "info"
  if (status === "resolved" || status === "closed") return "success"
  return "neutral"
}

const STATUS_LABEL: Record<string, string> = {
  open: "Abierto", in_progress: "En progreso", waiting_customer: "Esperando respuesta",
  resolved: "Resuelto", closed: "Cerrado",
}

function priorityTone(priority: string | null): StatusBadgeTone {
  if (priority === "urgent") return "destructive"
  if (priority === "high") return "warning"
  if (priority === "medium") return "info"
  return "neutral"
}

const PRIORITY_LABEL: Record<string, string> = {
  low: "Baja", medium: "Media", high: "Alta", urgent: "Urgente",
}

export default async function PortalSoportePage() {
  const session = await getPortalSession()
  if (!session || !session.access.can_create_tickets) redirect("/portal")

  const supabase = await createClient()
  const { data } = await supabase
    .from("tickets")
    .select("id, subject, status, priority, created_at, updated_at")
    .eq("client_id", session.access.client_id)
    .is("deleted_at", null)
    .order("updated_at", { ascending: false })

  const tickets = (data ?? []) as PortalTicket[]
  const open = tickets.filter((t) => !["resolved", "closed"].includes(t.status ?? ""))

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between gap-3">
        <h1 className="text-xl font-bold text-foreground">Soporte</h1>
        {open.length > 0 ? (
          <span className="text-sm text-muted-foreground">
            {open.length} ticket{open.length !== 1 ? "s" : ""} abierto{open.length !== 1 ? "s" : ""}
          </span>
        ) : null}
      </div>

      {tickets.length === 0 ? (
        <div className="flex flex-col items-center justify-center gap-3 rounded-xl border bg-card py-16 text-center">
          <HeadphonesIcon className="size-10 text-muted-foreground/40" />
          <p className="text-sm text-muted-foreground">No tienes tickets de soporte abiertos.</p>
          <p className="text-xs text-muted-foreground">Contacta con nosotros para abrir uno.</p>
        </div>
      ) : (
        <div className="overflow-hidden rounded-xl border bg-card">
          {tickets.map((t) => (
            <div key={t.id} className="border-b p-4 last:border-b-0">
              <div className="flex items-start justify-between gap-3">
                <p className="font-medium text-foreground">{t.subject}</p>
                <div className="flex shrink-0 gap-1.5">
                  <StatusBadge
                    tone={priorityTone(t.priority)}
                    label={PRIORITY_LABEL[t.priority ?? ""] ?? t.priority ?? "—"}
                  />
                  <StatusBadge
                    tone={ticketStatusTone(t.status)}
                    label={STATUS_LABEL[t.status ?? ""] ?? t.status ?? "—"}
                  />
                </div>
              </div>
              <p className="mt-1 text-xs text-muted-foreground">
                Abierto: {formatDate(t.created_at)} · Actualizado: {formatDate(t.updated_at)}
              </p>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
