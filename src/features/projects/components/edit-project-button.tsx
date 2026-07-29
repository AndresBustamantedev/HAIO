"use client"

import * as React from "react"
import { PencilIcon } from "lucide-react"

import { Button } from "@/components/ui/button"
import { ProjectFormDrawer } from "@/features/projects/components/project-form-drawer"
import type { ClientOption, ProjectWithClient } from "@/features/projects/types"

function EditProjectButton({
  project,
  clientOptions,
}: {
  project: ProjectWithClient
  clientOptions: ClientOption[]
}) {
  const [open, setOpen] = React.useState(false)

  return (
    <>
      <Button variant="outline" onClick={() => setOpen(true)}>
        <PencilIcon />
        Editar
      </Button>
      <ProjectFormDrawer open={open} onOpenChange={setOpen} project={project} clientOptions={clientOptions} />
    </>
  )
}

export { EditProjectButton }
