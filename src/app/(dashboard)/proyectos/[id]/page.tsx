import { notFound } from "next/navigation"
import Link from "next/link"
import { CalendarIcon, CodeIcon, ExternalLinkIcon, WalletIcon } from "lucide-react"

import { PageContainer } from "@/components/common/page-container"
import { PageHeader } from "@/components/common/page-header"
import { Breadcrumbs } from "@/components/common/breadcrumbs"
import { StatusBadge } from "@/components/common/status-badge"
import { EditProjectButton } from "@/features/projects/components/edit-project-button"
import { ProjectDetailTabs } from "@/features/projects/components/project-detail-tabs"
import { getProjectDetail } from "@/features/projects/queries/get-project-detail"
import { getClientOptions } from "@/lib/supabase/queries/client-options"
import { getProjectStatusBadge, getProjectTypeLabel } from "@/features/projects/utils/status"

function formatDate(value: string | null) {
  if (!value) return "—"
  return new Intl.DateTimeFormat("es-ES", { day: "2-digit", month: "short", year: "numeric" }).format(
    new Date(value)
  )
}

function formatCurrency(value: number | null, currency: string | null) {
  if (value == null) return "—"
  return new Intl.NumberFormat("es-ES", { style: "currency", currency: currency ?? "EUR" }).format(value)
}

type ProyectoDetailPageProps = {
  params: Promise<{ id: string }>
}

export default async function ProyectoDetailPage({ params }: ProyectoDetailPageProps) {
  const { id } = await params
  const detail = await getProjectDetail(id)

  if (!detail) {
    notFound()
  }

  const { project } = detail
  const badge = getProjectStatusBadge(project.status)
  const clientOptions = await getClientOptions(project.organization_id)

  return (
    <PageContainer>
      <Breadcrumbs
        items={[
          { label: "Proyectos", href: "/proyectos" },
          { label: project.name },
        ]}
      />

      <PageHeader
        title={project.name}
        description={
          project.clients ? (
            <Link href={`/clientes/${project.clients.id}`} className="hover:underline">
              {project.clients.display_name}
            </Link>
          ) : (
            getProjectTypeLabel(project.type)
          )
        }
        actions={
          <div className="flex items-center gap-3">
            <StatusBadge tone={badge.tone} label={badge.label} />
            <EditProjectButton project={project} clientOptions={clientOptions} />
          </div>
        }
      />

      <div className="rounded-xl border bg-card p-6">
        <p className="mb-4 text-sm font-medium text-foreground">Información general</p>
        <dl className="grid grid-cols-1 gap-4 text-sm sm:grid-cols-2 lg:grid-cols-4">
          <div className="flex items-start gap-2">
            <CalendarIcon className="mt-0.5 size-4 text-muted-foreground" />
            <div>
              <dt className="text-xs text-muted-foreground">Fecha de inicio</dt>
              <dd className="text-foreground">{formatDate(project.start_date)}</dd>
            </div>
          </div>
          <div className="flex items-start gap-2">
            <CalendarIcon className="mt-0.5 size-4 text-muted-foreground" />
            <div>
              <dt className="text-xs text-muted-foreground">Fecha objetivo</dt>
              <dd className="text-foreground">{formatDate(project.target_date)}</dd>
            </div>
          </div>
          <div className="flex items-start gap-2">
            <WalletIcon className="mt-0.5 size-4 text-muted-foreground" />
            <div>
              <dt className="text-xs text-muted-foreground">Presupuesto</dt>
              <dd className="text-foreground">{formatCurrency(project.budget, project.currency_code)}</dd>
            </div>
          </div>
          <div className="flex items-start gap-2">
            <CodeIcon className="mt-0.5 size-4 text-muted-foreground" />
            <div>
              <dt className="text-xs text-muted-foreground">Repositorio</dt>
              <dd className="text-foreground">
                {project.repository_url ? (
                  <a href={project.repository_url} target="_blank" rel="noreferrer" className="hover:underline">
                    Ver enlace
                  </a>
                ) : (
                  "—"
                )}
              </dd>
            </div>
          </div>
        </dl>
        {project.production_url ? (
          <div className="mt-4 flex items-center gap-2 border-t pt-4 text-sm">
            <ExternalLinkIcon className="size-4 text-muted-foreground" />
            <a href={project.production_url} target="_blank" rel="noreferrer" className="text-foreground hover:underline">
              {project.production_url}
            </a>
          </div>
        ) : null}
        {project.description ? (
          <p className="mt-4 border-t pt-4 text-sm text-muted-foreground">{project.description}</p>
        ) : null}
      </div>

      <ProjectDetailTabs detail={detail} />
    </PageContainer>
  )
}
