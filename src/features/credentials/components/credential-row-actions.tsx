"use client"

import * as React from "react"
import { useRouter } from "next/navigation"
import { KeyRoundIcon, MoreHorizontalIcon, PencilIcon, Trash2Icon } from "lucide-react"
import { toast } from "sonner"

import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { DeleteDialog } from "@/components/common/delete-dialog"
import { CredentialFormDrawer } from "@/features/credentials/components/credential-form-drawer"
import { SetSecretDialog } from "@/features/credentials/components/set-secret-dialog"
import { deleteCredential } from "@/features/credentials/actions/delete-credential"
import type { ClientOption, CredentialSafeWithClient } from "@/features/credentials/types"
import type { ProjectOption } from "@/lib/supabase/queries/client-options"

function CredentialRowActions({
  credential,
  clientOptions,
  projectOptions,
}: {
  credential: CredentialSafeWithClient
  clientOptions: ClientOption[]
  projectOptions: ProjectOption[]
}) {
  const router = useRouter()
  const [editOpen, setEditOpen] = React.useState(false)
  const [secretOpen, setSecretOpen] = React.useState(false)
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
          <DropdownMenuItem onClick={() => setSecretOpen(true)}>
            <KeyRoundIcon />
            Establecer contraseña
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem variant="destructive" onClick={() => setDeleteOpen(true)}>
            <Trash2Icon />
            Eliminar
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <CredentialFormDrawer
        open={editOpen}
        onOpenChange={setEditOpen}
        credential={credential}
        clientOptions={clientOptions}
        projectOptions={projectOptions}
      />

      <SetSecretDialog
        open={secretOpen}
        onOpenChange={setSecretOpen}
        credentialId={credential.id!}
        credentialLabel={credential.label ?? "Credencial"}
      />

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
