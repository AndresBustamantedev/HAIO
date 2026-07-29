"use client"

import * as React from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { ArchiveIcon, EyeIcon, MoreHorizontalIcon, PencilIcon, Trash2Icon } from "lucide-react"
import { toast } from "sonner"

import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { DeleteDialog } from "@/components/common/delete-dialog"
import { ConfirmDialog } from "@/components/common/confirm-dialog"
import { ProjectFormDrawer } from "@/features/projects/components/project-form-drawer"
import { deleteProject } from "@/features/projects/actions/delete-project"
import { archiveProject } from "@/features/projects/actions/archive-project"
import type { ClientOption, ProjectWithClient } from "@/features/projects/types"

function ProjectRowActions({
  project,
  clientOptions,
}: {
  project: ProjectWithClient
  clientOptions: ClientOption[]
}) {
  const router = useRouter()
  const [editOpen, setEditOpen] = React.useState(false)
  const [deleteOpen, setDeleteOpen] = React.useState(false)
  const [archiveOpen, setArchiveOpen] = React.useState(false)

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger render={<Button variant="ghost" size="icon-sm" aria-label="Acciones" />}>
          <MoreHorizontalIcon />
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem render={<Link href={`/proyectos/${project.id}`} />}>
            <EyeIcon />
            Ver detalle
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => setEditOpen(true)}>
            <PencilIcon />
            Editar
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => setArchiveOpen(true)}>
            <ArchiveIcon />
            Archivar
          </DropdownMenuItem>
          <DropdownMenuItem variant="destructive" onClick={() => setDeleteOpen(true)}>
            <Trash2Icon />
            Eliminar
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <ProjectFormDrawer
        open={editOpen}
        onOpenChange={setEditOpen}
        project={project}
        clientOptions={clientOptions}
      />

      <ConfirmDialog
        open={archiveOpen}
        onOpenChange={setArchiveOpen}
        title="Archivar proyecto"
        description={`"${project.name}" pasará a estado archivado. Podrás seguir consultándolo.`}
        confirmLabel="Archivar"
        onConfirm={async () => {
          const result = await archiveProject(project.id)
          if (result.error) {
            toast.error(result.error)
            return
          }
          toast.success("Proyecto archivado.")
          router.refresh()
        }}
      />

      <DeleteDialog
        open={deleteOpen}
        onOpenChange={setDeleteOpen}
        itemLabel={project.name}
        onConfirm={async () => {
          const result = await deleteProject(project.id)
          if (result.error) {
            toast.error(result.error)
            return
          }
          toast.success("Proyecto eliminado.")
          router.refresh()
        }}
      />
    </>
  )
}

export { ProjectRowActions }
