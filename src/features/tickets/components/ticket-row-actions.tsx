"use client"

import * as React from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { EyeIcon, MoreHorizontalIcon, Trash2Icon } from "lucide-react"
import { toast } from "sonner"

import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { DeleteDialog } from "@/components/common/delete-dialog"
import { deleteTicket } from "@/features/tickets/actions/delete-ticket"
import type { TicketWithClient } from "@/features/tickets/types"

function TicketRowActions({ ticket }: { ticket: TicketWithClient }) {
  const router = useRouter()
  const [deleteOpen, setDeleteOpen] = React.useState(false)

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger render={<Button variant="ghost" size="icon-sm" aria-label="Acciones" />}>
          <MoreHorizontalIcon />
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem render={<Link href={`/tickets/${ticket.id}`} />}>
            <EyeIcon />
            Ver detalle
          </DropdownMenuItem>
          <DropdownMenuItem variant="destructive" onClick={() => setDeleteOpen(true)}>
            <Trash2Icon />
            Eliminar
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <DeleteDialog
        open={deleteOpen}
        onOpenChange={setDeleteOpen}
        itemLabel={ticket.subject}
        onConfirm={async () => {
          const result = await deleteTicket(ticket.id)
          if (result.error) {
            toast.error(result.error)
            return
          }
          toast.success("Ticket eliminado.")
          router.refresh()
        }}
      />
    </>
  )
}

export { TicketRowActions }
