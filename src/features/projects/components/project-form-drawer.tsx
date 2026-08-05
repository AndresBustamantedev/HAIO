"use client"

import { useRouter } from "next/navigation"
import { toast } from "sonner"

import { FormDrawer } from "@/components/common/form-drawer"
import { ProjectForm } from "@/features/projects/components/project-form"
import { createProject } from "@/features/projects/actions/create-project"
import { updateProject } from "@/features/projects/actions/update-project"
import type { ClientOption, ProjectWithClient } from "@/features/projects/types"

type ProjectFormDrawerProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  clientOptions: ClientOption[]
  /** Omit for create mode; pass the project being edited for edit mode. */
  project?: ProjectWithClient
  defaultClientId?: string
  onSaved?: () => void
}

/** Single source of truth for the create/edit project drawer, used by the list toolbar, row actions, and the detail page. */
function ProjectFormDrawer({ open, onOpenChange, clientOptions, project, defaultClientId, onSaved }: ProjectFormDrawerProps) {
  const router = useRouter()
  const isEdit = !!project

  return (
    <FormDrawer
      open={open}
      onOpenChange={onOpenChange}
      title={isEdit ? "Editar proyecto" : "Nuevo proyecto"}
      description={isEdit ? project.name : "Crea un proyecto para un cliente."}
    >
      <ProjectForm
        clientOptions={clientOptions}
        defaultValues={
          project
            ? {
                name: project.name,
                client_id: project.client_id,
                type: project.type,
                status: project.status,
                description: project.description ?? "",
                budget: project.budget != null ? String(project.budget) : "",
                start_date: project.start_date ?? "",
                target_date: project.target_date ?? "",
                repository_url: project.repository_url ?? "",
                production_url: project.production_url ?? "",
              }
            : defaultClientId
              ? { client_id: defaultClientId }
              : undefined
        }
        onSubmit={(values) => (isEdit ? updateProject(project.id, values) : createProject(values))}
        onSuccess={() => {
          toast.success(isEdit ? "Proyecto actualizado." : "Proyecto creado.")
          onOpenChange(false)
          onSaved?.()
          router.refresh()
        }}
        submitLabel={isEdit ? "Guardar cambios" : "Crear proyecto"}
      />
    </FormDrawer>
  )
}

export { ProjectFormDrawer }
