"use server"

import { revalidatePath } from "next/cache"

import { createClient as createSupabaseServerClient } from "@/lib/supabase/server"
import { ticketMessageSchema, type TicketMessageInput } from "@/features/tickets/schemas/ticket-schema"

type ActionResult = { error: string | null }

export async function addTicketMessage(ticketId: string, input: TicketMessageInput): Promise<ActionResult> {
  const parsed = ticketMessageSchema.safeParse(input)
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Datos no válidos." }
  }

  const supabase = await createSupabaseServerClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  const { error } = await supabase.from("ticket_messages").insert({
    ticket_id: ticketId,
    body: parsed.data.body,
    is_internal: parsed.data.is_internal,
    author_user_id: user?.id ?? null,
  })

  if (error) {
    return { error: "No se pudo enviar el mensaje. " + error.message }
  }

  if (!parsed.data.is_internal) {
    await supabase
      .from("tickets")
      .update({ first_response_at: new Date().toISOString() })
      .eq("id", ticketId)
      .is("first_response_at", null)
  }

  revalidatePath(`/tickets/${ticketId}`)

  return { error: null }
}
