import Link from "next/link"
import { ArrowRightIcon, CheckSquareIcon } from "lucide-react"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { EmptyState } from "@/components/common/empty-state"
import { StatusBadge } from "@/components/common/status-badge"
import { Button } from "@/components/ui/button"
import { getTaskPriorityBadge } from "@/features/tasks/utils/status"
import type { PendingTask } from "@/features/dashboard/queries/get-dashboard-data"

function formatDate(value: string) {
  return new Intl.DateTimeFormat("es-ES", { day: "2-digit", month: "short" }).format(new Date(value))
}

function PendingTasksCard({ tasks }: { tasks: PendingTask[] }) {
  return (
    <Card className="flex flex-col">
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-base">Tareas pendientes</CardTitle>
        <Button variant="ghost" size="sm" className="text-xs" render={<Link href="/tareas" />}>
          Ver todas
        </Button>
      </CardHeader>
      <CardContent className="flex flex-1 flex-col">
        {tasks.length === 0 ? (
          <EmptyState
            icon={CheckSquareIcon}
            title="Sin tareas pendientes"
            description="No hay tareas abiertas asignadas todavía."
          />
        ) : (
          <>
            <ul className="flex flex-1 flex-col divide-y">
              {tasks.map((task) => {
                const priorityBadge = getTaskPriorityBadge(task.priority)

                return (
                  <li key={task.id} className="flex items-center gap-3 py-3 text-sm">
                    <div className="flex size-4 shrink-0 items-center justify-center rounded border border-muted-foreground/30" />
                    <div className="min-w-0 flex-1">
                      <p className="truncate font-medium text-foreground">{task.title}</p>
                      <p className="text-xs text-muted-foreground">
                        {task.due_date ? `Vence ${formatDate(task.due_date)}` : "Sin fecha límite"}
                      </p>
                    </div>
                    <StatusBadge tone={priorityBadge.tone} label={priorityBadge.label} />
                  </li>
                )
              })}
            </ul>
            <div className="border-t pt-3">
              <Link
                href="/tareas"
                className="flex items-center gap-1 text-xs text-primary hover:underline"
              >
                Ver todas las tareas
                <ArrowRightIcon className="size-3" />
              </Link>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  )
}

export { PendingTasksCard }
