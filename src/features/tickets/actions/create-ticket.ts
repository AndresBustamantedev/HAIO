"use server"

import { revalidatePath } from "next/cache"

import { createClient as createSupabaseServerClient } from "@/lib/supabase/server"
import { getCurrentOrganization } from "@/lib/supabase/queries/organizations"
import { nextDocumentNumber } from "@/lib/supabase/queries/sequences"
import { ticketSchema, type TicketInput } from "@/features/tickets/schemas/ticket-schema"

type ActionResult = { error: string | null; ticketId?: string }

export async function createTicket(input: TicketInput): Promise<ActionResult> {
  const parsed = ticketSchema.safeParse(input)
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Datos no válidos." }
  }

  const organization = await getCurrentOrganization()
  if (!organization) {
    return { error: "No perteneces a ninguna organización." }
  }

  const supabase = await createSupabaseServerClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  let ticketNumber: string
  try {
    ticketNumber = await nextDocumentNumber(supabase, organization.organizationId, "ticket", "TCK")
  } catch (error) {
    return { error: "No se pudo generar el número de ticket. " + (error as Error).message }
  }

  const { data: ticket, error } = await supabase
    .from("tickets")
    .insert({
      organization_id: organization.organizationId,
      client_id: parsed.data.client_id,
      ticket_number: ticketNumber,
      subject: parsed.data.subject,
      description: parsed.data.description || null,
      status: parsed.data.status,
      priority: parsed.data.priority,
      requester_user_id: user?.id ?? null,
    })
    .select("id")
    .single()

  if (error || !ticket) {
    return { error: "No se pudo crear el ticket. " + (error?.message ?? "") }
  }

  revalidatePath("/tickets")
  revalidatePath(`/clientes/${parsed.data.client_id}`)

  return { error: null, ticketId: ticket.id }
}
