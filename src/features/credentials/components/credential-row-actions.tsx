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
import { CredentialFormDrawer } from "@/features/credentials/components/credential-form-drawer"
import { deleteCredential } from "@/features/credentials/actions/delete-credential"
import type { ClientOption, CredentialSafeWithClient } from "@/features/credentials/types"

function CredentialRowActions({
  credential,
  clientOptions,
}: {
  credential: CredentialSafeWithClient
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

      <CredentialFormDrawer open={editOpen} onOpenChange={setEditOpen} credential={credential} clientOptions={clientOptions} />

      <DeleteDialog
        open={deleteOpen}
        onOpenChange={setDeleteOpen}
        itemLabel={credential.label ?? "credencial"}
        onConfirm={async () => {
          const result = await deleteCredential(credential.id!)
          if (result.error) {
            toast.error(result.error)
            return
          }
          toast.success("Credencial eliminada.")
          router.refresh()
        }}
      />
    </>
  )
}

export { CredentialRowActions }
