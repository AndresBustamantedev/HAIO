import type { Database } from "@/types/database.types"

export type Ticket = Database["public"]["Tables"]["tickets"]["Row"]
export type TicketMessage = Database["public"]["Tables"]["ticket_messages"]["Row"]

export type TicketWithClient = Ticket & {
  clients: Pick<Database["public"]["Tables"]["clients"]["Row"], "id" | "display_name"> | null
}

export type TicketDetail = {
  ticket: TicketWithClient
  messages: TicketMessage[]
}

export type { ClientOption } from "@/lib/supabase/queries/client-options"
