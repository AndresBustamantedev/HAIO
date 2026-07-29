"use client"

import * as React from "react"
import { PlusIcon } from "lucide-react"

import { Button } from "@/components/ui/button"
import { TaskFormDrawer } from "@/features/tasks/components/task-form-drawer"
import type { ClientOption, ProjectOption } from "@/features/tasks/types"

function CreateTaskButton({ clientOptions, projectOptions }: { clientOptions: ClientOption[]; projectOptions: ProjectOption[] }) {
  const [open, setOpen] = React.useState(false)

  return (
    <>
      <Button onClick={() => setOpen(true)}>
        <PlusIcon />
        Nueva tarea
      </Button>
      <TaskFormDrawer open={open} onOpenChange={setOpen} clientOptions={clientOptions} projectOptions={projectOptions} />
    </>
  )
}

export { CreateTaskButton }
