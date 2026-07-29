import Link from "next/link"

import { DataTable, type DataTableColumn } from "@/components/tables/data-table"
import { StatusBadge } from "@/components/common/status-badge"
import { ProjectRowActions } from "@/features/projects/components/project-row-actions"
import { getProjectStatusBadge, getProjectTypeLabel } from "@/features/projects/utils/status"
import type { ClientOption, ProjectWithClient } from "@/features/projects/types"

function formatDate(value: string | null) {
  if (!value) return "—"
  return new Intl.DateTimeFormat("es-ES", { day: "2-digit", month: "short", year: "numeric" }).format(
    new Date(value)
  )
}

function buildColumns(): DataTableColumn<ProjectWithClient>[] {
  return [
    {
      key: "name",
      header: "Proyecto",
      cell: (project) => (
        <Link href={`/proyectos/${project.id}`} className="font-medium text-foreground hover:underline">
          {project.name}
        </Link>
      ),
    },
    {
      key: "client",
      header: "Cliente",
      cell: (project) =>
        project.clients ? (
          <Link href={`/clientes/${project.clients.id}`} className="text-muted-foreground hover:underline">
            {project.clients.display_name}
          </Link>
        ) : (
          <span className="text-muted-foreground">—</span>
        ),
    },
    {
      key: "type",
      header: "Tipo",
      cell: (project) => <span className="text-muted-foreground">{getProjectTypeLabel(project.type)}</span>,
    },
    {
      key: "status",
      header: "Estado",
      cell: (project) => {
        const badge = getProjectStatusBadge(project.status)
        return <StatusBadge tone={badge.tone} label={badge.label} />
      },
    },
    {
      key: "target_date",
      header: "Fecha objetivo",
      cell: (project) => <span className="text-muted-foreground">{formatDate(project.target_date)}</span>,
    },
  ]
}

function ProjectsTable({
  projects,
  clientOptions,
}: {
  projects: ProjectWithClient[]
  clientOptions: ClientOption[]
}) {
  return (
    <DataTable
      columns={buildColumns()}
      rows={projects}
      getRowId={(project) => project.id}
      rowActions={(project) => <ProjectRowActions project={project} clientOptions={clientOptions} />}
      emptyTitle="Todavía no hay proyectos"
      emptyDescription="Crea tu primer proyecto para empezar a organizar tareas y servicios."
    />
  )
}

export { ProjectsTable }
