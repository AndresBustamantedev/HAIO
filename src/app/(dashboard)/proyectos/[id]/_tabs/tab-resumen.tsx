import { CalendarIcon, CodeIcon, ExternalLinkIcon, WalletIcon } from "lucide-react"

import { StatusBadge, type StatusBadgeProps } from "@/components/common/status-badge"
import { EmptyState } from "@/components/common/empty-state"
import type { ProjectDetail } from "@/features/projects/queries/get-project-detail"

type TaskStatus = "backlog" | "todo" | "in_progress" | "blocked" | "review" | "done" | "cancelled"

const TASK_STATUS: Record<TaskStatus, { label: string; tone: StatusBadgeProps["tone"] }> = {
  backlog:     { label: "Backlog",      tone: "neutral" },
  todo:        { label: "Por hacer",    tone: "info" },
  in_progress: { label: "En progreso",  tone: "warning" },
  blocked:     { label: "Bloqueada",    tone: "destructive" },
  review:      { label: "En revisión",  tone: "info" },
  done:        { label: "Hecha",        tone: "success" },
  cancelled:   { label: "Cancelada",    tone: "neutral" },
}

function formatDate(v: string | null) {
  if (!v) return "—"
  return new Intl.DateTimeFormat("es-ES", { day: "2-digit", month: "short", year: "numeric" }).format(new Date(v))
}

function formatCurrency(v: number | null, cur: string | null) {
  if (v == null) return "—"
  return new Intl.NumberFormat("es-ES", { style: "currency", currency: cur ?? "EUR" }).format(v)
}

type Props = { detail: ProjectDetail; members: Array<{ id: string; name: string; email: string | null; role: string }> }

export async function TabResumen({ detail, members }: Props) {
  const { project, tasks, activity } = detail
  const recentTasks = tasks.slice(0, 5)
  const recentActivity = activity.slice(0, 5)

  return (
    <div className="flex flex-col gap-6">
      {/* Estadísticas rápidas */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <StatCard label="Inicio" value={formatDate(project.start_date)} icon={<CalendarIcon className="size-4" />} />
        <StatCard label="Objetivo" value={formatDate(project.target_date)} icon={<CalendarIcon className="size-4" />} />
        <StatCard label="Presupuesto" value={formatCurrency(project.budget, project.currency_code)} icon={<WalletIcon className="size-4" />} />
        <StatCard
          label="Repositorio"
          value={project.repository_url ? <a href={project.repository_url} target="_blank" rel="noreferrer" className="hover:underline truncate block">Ver enlace</a> : "—"}
          icon={<CodeIcon className="size-4" />}
        />
      </div>

      {/* URLs */}
      {(project.production_url || (project as Record<string, unknown>).staging_url) ? (
        <div className="flex flex-wrap gap-3">
          {project.production_url ? (
            <a href={project.production_url} target="_blank" rel="noreferrer"
               className="flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-sm hover:bg-muted/50">
              <ExternalLinkIcon className="size-3.5" /> Producción
            </a>
          ) : null}
          {(project as Record<string, unknown>).staging_url ? (
            <a href={(project as Record<string, unknown>).staging_url as string} target="_blank" rel="noreferrer"
               className="flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-sm hover:bg-muted/50">
              <ExternalLinkIcon className="size-3.5" /> Staging
            </a>
          ) : null}
        </div>
      ) : null}

      {/* Descripción */}
      {project.description ? (
        <div className="rounded-xl border bg-card p-4">
          <p className="text-sm font-medium mb-2 text-foreground">Descripción</p>
          <p className="text-sm text-muted-foreground whitespace-pre-wrap">{project.description}</p>
        </div>
      ) : null}

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Equipo */}
        <Section title={`Equipo (${members.length})`}>
          {members.length === 0 ? (
            <EmptyState title="Sin equipo" description="Añade miembros en la pestaña Accesos." />
          ) : (
            <ul className="divide-y">
              {members.map((m) => (
                <li key={m.id} className="flex items-center justify-between py-2.5 text-sm">
                  <span className="font-medium text-foreground">{m.name}</span>
                  <span className="text-muted-foreground capitalize">{ROLE_LABELS[m.role] ?? m.role}</span>
                </li>
              ))}
            </ul>
          )}
        </Section>

        {/* Tareas recientes */}
        <Section title={`Tareas (${tasks.length})`}>
          {recentTasks.length === 0 ? (
            <EmptyState title="Sin tareas" />
          ) : (
            <ul className="divide-y">
              {recentTasks.map((t) => {
                const cfg = TASK_STATUS[t.status as TaskStatus] ?? { label: t.status, tone: "neutral" as const }
                return (
                  <li key={t.id} className="flex items-center justify-between py-2.5 text-sm">
                    <span className="font-medium text-foreground truncate mr-2">{t.title}</span>
                    <StatusBadge tone={cfg.tone} label={cfg.label} />
                  </li>
                )
              })}
            </ul>
          )}
        </Section>
      </div>

      {/* Actividad reciente */}
      <Section title="Actividad reciente">
        {recentActivity.length === 0 ? (
          <EmptyState title="Sin actividad reciente" />
        ) : (
          <ul className="divide-y">
            {recentActivity.map((entry) => (
              <li key={entry.id} className="flex items-center justify-between py-2.5 text-sm">
                <span className="text-foreground">{entry.summary}</span>
                <span className="text-muted-foreground shrink-0 ml-2">{formatDate(entry.created_at)}</span>
              </li>
            ))}
          </ul>
        )}
      </Section>
    </div>
  )
}

const ROLE_LABELS: Record<string, string> = {
  owner: "Propietario",
  developer: "Desarrollador",
  designer: "Diseñador",
  marketing: "Marketing",
  client: "Cliente",
  seo: "SEO",
  other: "Otro",
}

function StatCard({ label, value, icon }: { label: string; value: React.ReactNode; icon: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-1 rounded-xl border bg-card p-4">
      <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
        {icon}
        {label}
      </div>
      <div className="text-sm font-medium text-foreground">{value}</div>
    </div>
  )
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-xl border bg-card p-4">
      <p className="mb-3 text-sm font-medium text-foreground">{title}</p>
      {children}
    </div>
  )
}
