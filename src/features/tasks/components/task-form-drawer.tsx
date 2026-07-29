"use client"

import { useRouter } from "next/navigation"
import { toast } from "sonner"

import { FormDrawer } from "@/components/common/form-drawer"
import { TaskForm } from "@/features/tasks/components/task-form"
import { createTask } from "@/features/tasks/actions/create-task"
import { updateTask } from "@/features/tasks/actions/update-task"
import type { ClientOption, ProjectOption, TaskWithRelations } from "@/features/tasks/types"

type TaskFormDrawerProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  clientOptions: ClientOption[]
  projectOptions: ProjectOption[]
  task?: TaskWithRelations
}

function TaskFormDrawer({ open, onOpenChange, clientOptions, projectOptions, task }: TaskFormDrawerProps) {
  const router = useRouter()
  const isEdit = !!task

  return (
    <FormDrawer
      open={open}
      onOpenChange={onOpenChange}
      title={isEdit ? "Editar tarea" : "Nueva tarea"}
      description={isEdit ? task.title : "Crea una tarea."}
    >
      <TaskForm
        clientOptions={clientOptions}
        projectOptions={projectOptions}
        defaultValues={
          task
            ? {
                title: task.title,
                description: task.description ?? "",
                status: task.status,
                priority: task.priority,
                client_id: task.client_id ?? "",
                project_id: task.project_id ?? "",
                due_date: task.due_date ?? "",
              }
            : undefined
        }
        onSubmit={(values) => (isEdit ? updateTask(task.id, values) : createTask(values))}
        onSuccess={() => {
          toast.success(isEdit ? "Tarea actualizada." : "Tarea creada.")
          onOpenChange(false)
          router.refresh()
        }}
        submitLabel={isEdit ? "Guardar cambios" : "Crear tarea"}
      />
    </FormDrawer>
  )
}

export { TaskFormDrawer }
