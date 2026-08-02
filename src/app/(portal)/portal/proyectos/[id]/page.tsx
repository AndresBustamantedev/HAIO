import Link from "next/link"
import { notFound, redirect } from "next/navigation"
import { ArrowLeftIcon, GlobeIcon, KeyIcon, ExternalLinkIcon } from "lucide-react"

import { getPortalSession } from "@/lib/supabase/queries/portal"
import { createClient } from "@/lib/supabase/server"
import { StatusBadge } from "@/components/common/status-badge"
import type { StatusBadgeTone } from "@/components/common/status-badge"
import { getCredentialTypeLabel } from "@/features/credentials/utils/labels"

type Props = { params: Promise<{ id: string }> }

function formatDate(d: string | null) {
  if (!d) return "—"
  return new Intl.DateTimeFormat("es-ES", { day: "numeric", month: "long", year: "numeric" }).format(new Date(d))
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

type SharedCredential = {
  id: string
  type: string
  label: string
  username: string | null
  login_url: string | null
  notes: string | null
  expires_at: string | null
}

export default async function PortalProyectoDetailPage({ params }: Props) {
  const { id } = await params
  const session = await getPortalSession()
  if (!session || !session.access.can_view_projects) redirect("/portal")

  const supabase = await createClient()

  const { data: project } = await supabase
    .from("projects")
    .select("id, name, status, description, start_date, target_date, production_url, staging_url")
    .eq("id", id)
    .eq("client_id", session.access.client_id)
    .is("deleted_at", null)
    .maybeSingle()

  if (!project) notFound()

  // Only fetch credentials shared with client — never expose private ones
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: credentialsRaw } = await (supabase as any)
    .from("v_credentials_safe")
    .select("id, type, label, username, login_url, notes, expires_at")
    .eq("project_id", id)
    .eq("is_shared_with_client", true)
    .is("deleted_at", null)
    .order("type")
    .order("label")

  const credentials = (credentialsRaw ?? []) as SharedCredential[]

  return (
    <div className="flex flex-col gap-6">
      {/* Back */}
      <Link
        href="/portal/proyectos"
        className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors w-fit"
      >
        <ArrowLeftIcon className="size-3.5" />
        Proyectos
      </Link>

      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <h1 className="text-xl font-bold text-foreground">{project.name}</h1>
        <StatusBadge
          tone={projectStatusTone(project.status)}
          label={STATUS_LABEL[project.status] ?? project.status}
        />
      </div>

      {/* Fechas */}
      <div className="flex flex-wrap gap-6 text-sm">
        <div>
          <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-0.5">Inicio</p>
          <p className="text-foreground">{formatDate(project.start_date)}</p>
        </div>
        <div>
          <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-0.5">Fecha límite</p>
          <p className="text-foreground">{formatDate(project.target_date)}</p>
        </div>
      </div>

      {/* Descripción */}
      {project.description ? (
        <div className="rounded-xl border bg-card p-4">
          <p className="text-sm text-muted-foreground leading-relaxed">{project.description}</p>
        </div>
      ) : null}

      {/* URLs del proyecto */}
      {(project.production_url || project.staging_url) ? (
        <section>
          <h2 className="mb-3 flex items-center gap-2 text-sm font-semibold text-foreground">
            <GlobeIcon className="size-4 text-muted-foreground" />
            Sitio web
          </h2>
          <div className="flex flex-col gap-2">
            {project.production_url ? (
              <a
                href={project.production_url}
                target="_blank"
                rel="noreferrer"
                className="flex items-center justify-between rounded-xl border bg-card px-4 py-3 text-sm hover:bg-muted/40 transition-colors group"
              >
                <div>
                  <span className="text-xs text-muted-foreground block mb-0.5">Producción</span>
                  <span className="text-foreground font-medium">{project.production_url}</span>
                </div>
                <ExternalLinkIcon className="size-4 text-muted-foreground/50 group-hover:text-muted-foreground shrink-0" />
              </a>
            ) : null}
            {project.staging_url ? (
              <a
                href={project.staging_url}
                target="_blank"
                rel="noreferrer"
                className="flex items-center justify-between rounded-xl border bg-card px-4 py-3 text-sm hover:bg-muted/40 transition-colors group"
              >
                <div>
                  <span className="text-xs text-muted-foreground block mb-0.5">Staging</span>
                  <span className="text-foreground font-medium">{project.staging_url}</span>
                </div>
                <ExternalLinkIcon className="size-4 text-muted-foreground/50 group-hover:text-muted-foreground shrink-0" />
              </a>
            ) : null}
          </div>
        </section>
      ) : null}

      {/* Accesos compartidos */}
      <section>
        <h2 className="mb-3 flex items-center gap-2 text-sm font-semibold text-foreground">
          <KeyIcon className="size-4 text-muted-foreground" />
          Accesos
          {credentials.length > 0 ? (
            <span className="rounded-full bg-muted px-2 py-0.5 text-xs font-normal text-muted-foreground">
              {credentials.length}
            </span>
          ) : null}
        </h2>

        {credentials.length === 0 ? (
          <div className="rounded-xl border border-dashed p-6 text-center">
            <p className="text-sm text-muted-foreground">
              No hay accesos compartidos para este proyecto.
            </p>
          </div>
        ) : (
          <ul className="flex flex-col gap-3">
            {credentials.map((cred) => {
              const isExpired = cred.expires_at ? new Date(cred.expires_at) < new Date() : false
              const expiresLabel = cred.expires_at
                ? new Intl.DateTimeFormat("es-ES", { day: "numeric", month: "short", year: "numeric" }).format(new Date(cred.expires_at))
                : null

              return (
                <li key={cred.id} className="rounded-xl border bg-card p-4">
                  <div className="flex items-start gap-3">
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-medium text-foreground">{cred.label}</span>
                        <span className="rounded-full bg-muted px-2 py-0.5 text-xs text-muted-foreground">
                          {getCredentialTypeLabel(cred.type)}
                        </span>
                        {isExpired ? (
                          <span className="rounded-full bg-red-100 px-2 py-0.5 text-xs text-red-700 dark:bg-red-900/30 dark:text-red-400">
                            Expirada
                          </span>
                        ) : expiresLabel ? (
                          <span className="text-xs text-muted-foreground">Expira {expiresLabel}</span>
                        ) : null}
                      </div>
                      {cred.username ? (
                        <p className="mt-1 font-mono text-sm text-muted-foreground">{cred.username}</p>
                      ) : null}
                      {cred.login_url ? (
                        <a
                          href={cred.login_url}
                          target="_blank"
                          rel="noreferrer"
                          className="mt-0.5 flex items-center gap-1 text-xs text-blue-600 hover:underline dark:text-blue-400"
                        >
                          {cred.login_url}
                          <ExternalLinkIcon className="size-3 shrink-0" />
                        </a>
                      ) : null}
                      {cred.notes ? (
                        <p className="mt-1.5 text-xs text-muted-foreground">{cred.notes}</p>
                      ) : null}
                    </div>
                  </div>
                </li>
              )
            })}
          </ul>
        )}
      </section>
    </div>
  )
}
