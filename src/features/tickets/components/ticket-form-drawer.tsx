"use client"

import { useRouter } from "next/navigation"
import { toast } from "sonner"

import { FormDrawer } from "@/components/common/form-drawer"
import { TicketForm } from "@/features/tickets/components/ticket-form"
import { createTicket } from "@/features/tickets/actions/create-ticket"
import { updateTicket } from "@/features/tickets/actions/update-ticket"
import type { ClientOption, TicketWithClient } from "@/features/tickets/types"

type TicketFormDrawerProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  clientOptions: ClientOption[]
  ticket?: TicketWithClient
}

function TicketFormDrawer({ open, onOpenChange, clientOptions, ticket }: TicketFormDrawerProps) {
  const router = useRouter()
  const isEdit = !!ticket

  return (
    <FormDrawer
      open={open}
      onOpenChange={onOpenChange}
      title={isEdit ? "Editar ticket" : "Nuevo ticket"}
      description={isEdit ? ticket.ticket_number : "Crea un ticket de soporte."}
    >
      <TicketForm
        clientOptions={clientOptions}
        defaultValues={
          ticket
            ? {
                client_id: ticket.client_id,
                subject: ticket.subject,
                description: ticket.description ?? "",
                status: ticket.status,
                priority: ticket.priority,
              }
            : undefined
        }
        onSubmit={(values) => (isEdit ? updateTicket(ticket.id, values) : createTicket(values))}
        onSuccess={() => {
          toast.success(isEdit ? "Ticket actualizado." : "Ticket creado.")
          onOpenChange(false)
          router.refresh()
        }}
        submitLabel={isEdit ? "Guardar cambios" : "Crear ticket"}
      />
    </FormDrawer>
  )
}

export { TicketFormDrawer }
