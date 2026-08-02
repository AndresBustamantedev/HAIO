"use server"

import { revalidatePath } from "next/cache"
import { z } from "zod"

import { createClient } from "@/lib/supabase/server"
import { getPortalSession } from "@/lib/supabase/queries/portal"

const schema = z.object({
  body: z.string().trim().min(1, "Escribe un mensaje."),
})

type Result = { error: string | null }

export async function addPortalTicketMessage(ticketId: string, body: string): Promise<Result> {
  const session = await getPortalSession()
  if (!session || !session.access.can_create_tickets) {
    return { error: "No tienes permiso." }
  }

  const parsed = schema.safeParse({ body })
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Mensaje no válido." }
  }

  const supabase = await createClient()

  const { error } = await supabase.from("ticket_messages").insert({
    ticket_id: ticketId,
    body: parsed.data.body,
    is_internal: false,
    author_user_id: session.userId,
  })

  if (error) {
    return { error: "No se pudo enviar el mensaje. " + error.message }
  }

  revalidatePath(`/portal/soporte/${ticketId}`)
  return { error: null }
}
