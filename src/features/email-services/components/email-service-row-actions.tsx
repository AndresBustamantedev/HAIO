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
import { EmailServiceFormDrawer } from "@/features/email-services/components/email-service-form-drawer"
import { deleteEmailService } from "@/features/email-services/actions/delete-email-service"
import type { ClientOption, EmailServiceWithClient } from "@/features/email-services/types"

function EmailServiceRowActions({
  emailService,
  clientOptions,
}: {
  emailService: EmailServiceWithClient
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

      <EmailServiceFormDrawer open={editOpen} onOpenChange={setEditOpen} emailService={emailService} clientOptions={clientOptions} />

      <DeleteDialog
        open={deleteOpen}
        onOpenChange={setDeleteOpen}
        itemLabel={emailService.provider_name}
        onConfirm={async () => {
          const result = await deleteEmailService(emailService.id)
          if (result.error) {
            toast.error(result.error)
            return
          }
          toast.success("Servicio de correo eliminado.")
          router.refresh()
        }}
      />
    </>
  )
}

export { EmailServiceRowActions }
