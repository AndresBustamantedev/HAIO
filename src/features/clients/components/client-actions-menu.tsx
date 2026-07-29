"use client"

import * as React from "react"
import { useRouter } from "next/navigation"
import { ChevronDownIcon, Trash2Icon } from "lucide-react"
import { toast } from "sonner"

import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { DeleteDialog } from "@/components/common/delete-dialog"
import { deleteClient } from "@/features/clients/actions/delete-client"
import type { Database } from "@/types/database.types"

type Client = Database["public"]["Tables"]["clients"]["Row"]

function ClientActionsMenu({ client }: { client: Client }) {
  const router = useRouter()
  const [deleteOpen, setDeleteOpen] = React.useState(false)

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger render={<Button variant="outline" />}>
          Acciones
          <ChevronDownIcon />
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem variant="destructive" onClick={() => setDeleteOpen(true)}>
            <Trash2Icon />
            Eliminar cliente
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <DeleteDialog
        open={deleteOpen}
        onOpenChange={setDeleteOpen}
        itemLabel={client.display_name}
        onConfirm={async () => {
          const result = await deleteClient(client.id)
          if (result.error) { toast.error(result.error); return }
          toast.success("Cliente eliminado.")
          router.push("/clientes")
        }}
      />
    </>
  )
}

export { ClientActionsMenu }
