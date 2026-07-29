import "server-only"

import { createClient } from "@/lib/supabase/server"
import type { TicketDetail, TicketWithClient } from "@/features/tickets/types"

export async function getTicketDetail(ticketId: string): Promise<TicketDetail | null> {
  const supabase = await createClient()

  const ticketRes = await supabase
    .from("tickets")
    .select("*, clients(id, display_name)")
    .eq("id", ticketId)
    .is("deleted_at", null)
    .maybeSingle()

  if (ticketRes.error || !ticketRes.data) {
    return null
  }

  const messagesRes = await supabase
    .from("ticket_messages")
    .select("*")
    .eq("ticket_id", ticketId)
    .order("created_at", { ascending: true })

  return {
    ticket: ticketRes.data as TicketWithClient,
    messages: messagesRes.data ?? [],
  }
}
