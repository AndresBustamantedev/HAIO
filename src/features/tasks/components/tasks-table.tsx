import Link from "next/link"

import { DataTable, type DataTableColumn } from "@/components/tables/data-table"
import { StatusBadge } from "@/components/common/status-badge"
import { TaskRowActions } from "@/features/tasks/components/task-row-actions"
import { getTaskPriorityBadge, getTaskStatusBadge } from "@/features/tasks/utils/labels"
import type { ClientOption, ProjectOption, TaskWithRelations } from "@/features/tasks/types"

function formatDate(value: string | null) {
  if (!value) return "—"
  return new Intl.DateTimeFormat("es-ES", { day: "2-digit", month: "short", year: "numeric" }).format(
    new Date(value)
  )
}

function buildColumns(): DataTableColumn<TaskWithRelations>[] {
  return [
    {
      key: "title",
      header: "Tarea",
      cell: (task) => <span className="font-medium text-foreground">{task.title}</span>,
    },
    {
      key: "project",
      header: "Proyecto",
      cell: (task) =>
        task.projects ? (
          <Link href={`/proyectos/${task.projects.id}`} className="text-muted-foreground hover:underline">
            {task.projects.name}
          </Link>
        ) : (
          <span className="text-muted-foreground">—</span>
        ),
    },
    {
      key: "status",
      header: "Estado",
      cell: (task) => {
        const badge = getTaskStatusBadge(task.status)
        return <StatusBadge tone={badge.tone} label={badge.label} />
      },
    },
    {
      key: "priority",
      header: "Prioridad",
      cell: (task) => {
        const badge = getTaskPriorityBadge(task.priority)
        return <StatusBadge tone={badge.tone} label={badge.label} />
      },
    },
    {
      key: "due_date",
      header: "Fecha límite",
      cell: (task) => <span className="text-muted-foreground">{formatDate(task.due_date)}</span>,
    },
  ]
}

function TasksTable({
  tasks,
  clientOptions,
  projectOptions,
}: {
  tasks: TaskWithRelations[]
  clientOptions: ClientOption[]
  projectOptions: ProjectOption[]
}) {
  return (
    <DataTable
      columns={buildColumns()}
      rows={tasks}
      getRowId={(task) => task.id}
      rowActions={(task) => <TaskRowActions task={task} clientOptions={clientOptions} projectOptions={projectOptions} />}
      emptyTitle="Todavía no hay tareas"
      emptyDescription="Crea la primera tarea."
    />
  )
}

export { TasksTable }
