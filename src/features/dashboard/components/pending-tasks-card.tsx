import { CheckSquareIcon } from "lucide-react"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { EmptyState } from "@/components/common/empty-state"
import { StatusBadge } from "@/components/common/status-badge"
import { getTaskPriorityBadge, getTaskStatusBadge } from "@/features/tasks/utils/status"
import type { PendingTask } from "@/features/dashboard/queries/get-dashboard-data"

function formatDate(value: string) {
  return new Intl.DateTimeFormat("es-ES", { day: "2-digit", month: "short" }).format(new Date(value))
}

function PendingTasksCard({ tasks }: { tasks: PendingTask[] }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Tareas pendientes</CardTitle>
      </CardHeader>
      <CardContent>
        {tasks.length === 0 ? (
          <EmptyState
            icon={CheckSquareIcon}
            title="Sin tareas pendientes"
            description="No hay tareas abiertas asignadas todavía."
          />
        ) : (
          <ul className="flex flex-col divide-y">
            {tasks.map((task) => {
              const statusBadge = getTaskStatusBadge(task.status)
              const priorityBadge = getTaskPriorityBadge(task.priority)

              return (
                <li key={task.id} className="flex items-center justify-between gap-3 py-2.5 text-sm">
                  <div className="flex min-w-0 flex-col">
                    <span className="truncate font-medium text-foreground">{task.title}</span>
                    <span className="text-xs text-muted-foreground">
                      {task.due_date ? `Vence ${formatDate(task.due_date)}` : "Sin fecha límite"}
                    </span>
                  </div>
                  <div className="flex shrink-0 items-center gap-1.5">
                    <StatusBadge tone={priorityBadge.tone} label={priorityBadge.label} />
                    <StatusBadge tone={statusBadge.tone} label={statusBadge.label} />
                  </div>
                </li>
              )
            })}
          </ul>
        )}
      </CardContent>
    </Card>
  )
}

export { PendingTasksCard }
