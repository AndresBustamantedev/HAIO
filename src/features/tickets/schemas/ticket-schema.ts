import { z } from "zod"

export const TICKET_STATUSES = [
  "open",
  "in_progress",
  "waiting_client",
  "waiting_internal",
  "resolved",
  "closed",
  "cancelled",
] as const

export const TICKET_PRIORITIES = ["low", "normal", "high", "urgent"] as const

export const ticketSchema = z.object({
  client_id: z.string().uuid("Selecciona un cliente."),
  subject: z.string().trim().min(1, "El asunto es obligatorio.").max(200),
  description: z.string().trim().max(2000).optional().or(z.literal("")),
  status: z.enum(TICKET_STATUSES),
  priority: z.enum(TICKET_PRIORITIES),
})

export type TicketInput = z.infer<typeof ticketSchema>

export const ticketMessageSchema = z.object({
  body: z.string().trim().min(1, "Escribe un mensaje."),
  is_internal: z.boolean(),
})

export type TicketMessageInput = z.infer<typeof ticketMessageSchema>
