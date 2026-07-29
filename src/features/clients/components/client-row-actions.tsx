"use client"

import * as React from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { EyeIcon, MoreHorizontalIcon, PencilIcon, Trash2Icon } from "lucide-react"
import { toast } from "sonner"

import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { DeleteDialog } from "@/components/common/delete-dialog"
import { ClientFormDrawer } from "@/features/clients/components/client-form-drawer"
import { deleteClient } from "@/features/clients/actions/delete-client"
import type { Client } from "@/features/clients/types"

function ClientRowActions({ client }: { client: Client }) {
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
          <DropdownMenuItem render={<Link href={`/clientes/${client.id}`} />}>
            <EyeIcon />
            Ver detalle
          </DropdownMenuItem>
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

      <ClientFormDrawer open={editOpen} onOpenChange={setEditOpen} client={client} />

      <DeleteDialog
        open={deleteOpen}
        onOpenChange={setDeleteOpen}
        itemLabel={client.display_name}
        onConfirm={async () => {
          const result = await deleteClient(client.id)
          if (result.error) {
            toast.error(result.error)
            return
          }
          toast.success("Cliente eliminado.")
          router.refresh()
        }}
      />
    </>
  )
}

export { ClientRowActions }
