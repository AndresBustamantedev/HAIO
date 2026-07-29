"use client"

import * as React from "react"
import { useRouter } from "next/navigation"
import { MoreHorizontalIcon, PencilIcon, Trash2Icon } from "lucide-react"
import { toast } from "sonner"

import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { DeleteDialog } from "@/components/common/delete-dialog"
import { TaskFormDrawer } from "@/features/tasks/components/task-form-drawer"
import { deleteTask } from "@/features/tasks/actions/delete-task"
import type { ClientOption, ProjectOption, TaskWithRelations } from "@/features/tasks/types"

function TaskRowActions({
  task,
  clientOptions,
  projectOptions,
}: {
  task: TaskWithRelations
  clientOptions: ClientOption[]
  projectOptions: ProjectOption[]
}) {
  const router = useRouter()
  const [editOpen, setEditOpen] = React.useState(false)
  const [deleteOpen, setDeleteOpen] = React.useState(false)

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger render={<Button variant="ghost" size="icon-sm" aria-label="Acciones" />}>
          <MoreHorizontalIcon />
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem onClick={() => setEditOpen(true)}>
            <PencilIcon />
            Editar
          </DropdownMenuItem>
          <DropdownMenuItem variant="destructive" onClick={() => setDeleteOpen(true)}>
            <Trash2Icon />
            Eliminar
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <TaskFormDrawer open={editOpen} onOpenChange={setEditOpen} task={task} clientOptions={clientOptions} projectOptions={projectOptions} />

      <DeleteDialog
        open={deleteOpen}
        onOpenChange={setDeleteOpen}
        itemLabel={task.title}
        onConfirm={async () => {
          const result = await deleteTask(task.id)
          if (result.error) {
            toast.error(result.error)
            return
          }
          toast.success("Tarea eliminada.")
          router.refresh()
        }}
      />
    </>
  )
}

export { TaskRowActions }
