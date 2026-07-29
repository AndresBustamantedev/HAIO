import { redirect } from "next/navigation"
import { FolderKanbanIcon } from "lucide-react"

import { getPortalSession } from "@/lib/supabase/queries/portal"
import { createClient } from "@/lib/supabase/server"
import { StatusBadge } from "@/components/common/status-badge"
import type { StatusBadgeTone } from "@/components/common/status-badge"
import type { PortalProject } from "@/features/portal/queries/get-portal-overview"

function formatDate(d: string | null) {
  if (!d) return "—"
  return new Intl.DateTimeFormat("es-ES", { day: "numeric", month: "short", year: "numeric" }).format(new Date(d))
}

function projectStatusTone(status: string | null): StatusBadgeTone {
  if (status === "active" || status === "in_progress") return "success"
  if (status === "on_hold" || status === "paused") return "warning"
  if (status === "completed" || status === "closed") return "neutral"
  if (status === "cancelled") return "destructive"
  return "neutral"
}

const STATUS_LABEL: Record<string, string> = {
  lead: "Lead", active: "Activo", in_progress: "En progreso",
  on_hold: "En pausa", paused: "Pausado",
  completed: "Completado", closed: "Cerrado", cancelled: "Cancelado",
}

export default async function PortalProyectosPage() {
  const session = await getPortalSession()
  if (!session || !session.access.can_view_projects) redirect("/portal")

  const supabase = await createClient()
  const { data } = await supabase
    .from("projects")
    .select("id, name, status, start_date, target_date, description")
    .eq("client_id", session.access.client_id)
    .is("deleted_at", null)
    .order("created_at", { ascending: false })

  const projects = (data ?? []) as PortalProject[]

  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-xl font-bold text-foreground">Proyectos</h1>

      {projects.length === 0 ? (
        <div className="flex flex-col items-center justify-center gap-3 rounded-xl border bg-card py-16 text-center">
          <FolderKanbanIcon className="size-10 text-muted-foreground/40" />
          <p className="text-sm text-muted-foreground">No hay proyectos todavía.</p>
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          {projects.map((p) => (
            <div key={p.id} className="rounded-xl border bg-card p-5">
              <div className="flex items-start justify-between gap-3">
                <h2 className="font-semibold text-foreground">{p.name}</h2>
                <StatusBadge
                  tone={projectStatusTone(p.status)}
                  label={STATUS_LABEL[p.status] ?? p.status}
                />
              </div>
              {p.description ? (
                <p className="mt-1.5 text-sm text-muted-foreground">{p.description}</p>
              ) : null}
              <div className="mt-3 flex gap-4 text-xs text-muted-foreground">
                <span>Inicio: {formatDate(p.start_date)}</span>
                <span>Fecha límite: {formatDate(p.target_date)}</span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
