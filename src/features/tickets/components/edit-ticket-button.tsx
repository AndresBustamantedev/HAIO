"use client"

import * as React from "react"
import { PencilIcon } from "lucide-react"

import { Button } from "@/components/ui/button"
import { TicketFormDrawer } from "@/features/tickets/components/ticket-form-drawer"
import type { ClientOption, TicketWithClient } from "@/features/tickets/types"

function EditTicketButton({ ticket, clientOptions }: { ticket: TicketWithClient; clientOptions: ClientOption[] }) {
  const [open, setOpen] = React.useState(false)

  return (
    <>
      <Button variant="outline" onClick={() => setOpen(true)}>
        <PencilIcon />
        Editar
      </Button>
      <TicketFormDrawer open={open} onOpenChange={setOpen} ticket={ticket} clientOptions={clientOptions} />
    </>
  )
}

export { EditTicketButton }
