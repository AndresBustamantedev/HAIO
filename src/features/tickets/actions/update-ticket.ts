"use server"

import { revalidatePath } from "next/cache"

import { createClient as createSupabaseServerClient } from "@/lib/supabase/server"
import { ticketSchema, type TicketInput } from "@/features/tickets/schemas/ticket-schema"

type ActionResult = { error: string | null }

export async function updateTicket(ticketId: string, input: TicketInput): Promise<ActionResult> {
  const parsed = ticketSchema.safeParse(input)
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Datos no válidos." }
  }

  const supabase = await createSupabaseServerClient()

  const resolvedFields =
    parsed.data.status === "resolved"
      ? { resolved_at: new Date().toISOString() }
      : parsed.data.status === "closed"
        ? { closed_at: new Date().toISOString() }
        : {}

  const { error } = await supabase
    .from("tickets")
    .update({
      client_id: parsed.data.client_id,
      subject: parsed.data.subject,
      description: parsed.data.description || null,
      status: parsed.data.status,
      priority: parsed.data.priority,
      ...resolvedFields,
    })
    .eq("id", ticketId)

  if (error) {
    return { error: "No se pudo actualizar el ticket. " + error.message }
  }

  revalidatePath("/tickets")
  revalidatePath(`/tickets/${ticketId}`)

  return { error: null }
}
