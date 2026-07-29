"use client"

import * as React from "react"
import { PlusIcon } from "lucide-react"

import { Button } from "@/components/ui/button"
import { TicketFormDrawer } from "@/features/tickets/components/ticket-form-drawer"
import type { ClientOption } from "@/features/tickets/types"

function CreateTicketButton({ clientOptions }: { clientOptions: ClientOption[] }) {
  const [open, setOpen] = React.useState(false)

  return (
    <>
      <Button onClick={() => setOpen(true)}>
        <PlusIcon />
        Nuevo ticket
      </Button>
      <TicketFormDrawer open={open} onOpenChange={setOpen} clientOptions={clientOptions} />
    </>
  )
}

export { CreateTicketButton }
