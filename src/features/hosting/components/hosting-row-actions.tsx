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
import { HostingFormDrawer } from "@/features/hosting/components/hosting-form-drawer"
import { deleteHosting } from "@/features/hosting/actions/delete-hosting"
import type { ClientOption, HostingWithClient } from "@/features/hosting/types"

function HostingRowActions({ hosting, clientOptions }: { hosting: HostingWithClient; clientOptions: ClientOption[] }) {
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

      <HostingFormDrawer open={editOpen} onOpenChange={setEditOpen} hosting={hosting} clientOptions={clientOptions} />

      <DeleteDialog
        open={deleteOpen}
        onOpenChange={setDeleteOpen}
        itemLabel={hosting.provider_name}
        onConfirm={async () => {
          const result = await deleteHosting(hosting.id)
          if (result.error) {
            toast.error(result.error)
            return
          }
          toast.success("Hosting eliminado.")
          router.refresh()
        }}
      />
    </>
  )
}

export { HostingRowActions }
