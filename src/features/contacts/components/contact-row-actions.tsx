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
import { ContactFormDrawer } from "@/features/contacts/components/contact-form-drawer"
import { deleteContact } from "@/features/contacts/actions/delete-contact"
import type { ClientOption, ContactWithClient } from "@/features/contacts/types"

function ContactRowActions({ contact, clientOptions }: { contact: ContactWithClient; clientOptions: ClientOption[] }) {
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

      <ContactFormDrawer open={editOpen} onOpenChange={setEditOpen} contact={contact} clientOptions={clientOptions} />

      <DeleteDialog
        open={deleteOpen}
        onOpenChange={setDeleteOpen}
        itemLabel={contact.full_name}
        onConfirm={async () => {
          const result = await deleteContact(contact.id)
          if (result.error) {
            toast.error(result.error)
            return
          }
          toast.success("Contacto eliminado.")
          router.refresh()
        }}
      />
    </>
  )
}

export { ContactRowActions }
