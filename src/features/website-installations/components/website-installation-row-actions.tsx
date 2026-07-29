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
import { WebsiteInstallationFormDrawer } from "@/features/website-installations/components/website-installation-form-drawer"
import { deleteWebsiteInstallation } from "@/features/website-installations/actions/delete-website-installation"
import type { WebsiteInstallation } from "@/features/website-installations/types"
import type { ClientOption } from "@/lib/supabase/queries/client-options"

function WebsiteInstallationRowActions({
  installation,
  clientOptions,
}: {
  installation: WebsiteInstallation
  clientOptions: ClientOption[]
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

      <WebsiteInstallationFormDrawer
        open={editOpen}
        onOpenChange={setEditOpen}
        clientOptions={clientOptions}
        installation={installation}
      />

      <DeleteDialog
        open={deleteOpen}
        onOpenChange={setDeleteOpen}
        itemLabel={installation.name}
        onConfirm={async () => {
          const result = await deleteWebsiteInstallation(installation.id)
          if (result.error) { toast.error(result.error); return }
          toast.success("Instalación eliminada.")
          router.refresh()
        }}
      />
    </>
  )
}

export { WebsiteInstallationRowActions }
