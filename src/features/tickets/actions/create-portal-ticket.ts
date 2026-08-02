"use server"

import { revalidatePath } from "next/cache"
import { z } from "zod"

import { createClient } from "@/lib/supabase/server"
import { createAdminClient } from "@/lib/supabase/admin"
import { getPortalSession } from "@/lib/supabase/queries/portal"
import { nextDocumentNumber } from "@/lib/supabase/queries/sequences"

const portalTicketSchema = z.object({
  project_id: z
    .string()
    .uuid("Selecciona un proyecto.")
    .optional()
    .or(z.literal(""))
    .transform((v) => v || null),
  subject: z.string().trim().min(1, "El asunto es obligatorio.").max(200),
  description: z.string().trim().max(2000).optional().or(z.literal("")),
  priority: z.enum(["low", "normal", "high", "urgent"]),
})

type PortalTicketInput = {
  project_id?: string
  subject: string
  description?: string
  priority: "low" | "normal" | "high" | "urgent"
}

type Result = { error: string | null; ticketId?: string }

export async function createPortalTicket(input: PortalTicketInput): Promise<Result> {
  const session = await getPortalSession()
  if (!session || !session.access.can_create_tickets) {
    return { error: "No tienes permiso para abrir tickets." }
  }

  const parsed = portalTicketSchema.safeParse(input)
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Datos no válidos." }
  }

  const supabase = await createClient()
  const adminClient = createAdminClient()

  let ticketNumber: string
  try {
    ticketNumber = await nextDocumentNumber(
      adminClient,
      session.access.organization_id,
      "ticket",
      "TCK"
    )
  } catch (err) {
    return { error: "No se pudo generar el número de ticket. " + (err as Error).message }
  }

  const { data: ticket, error } = await supabase
    .from("tickets")
    .insert({
      organization_id: session.access.organization_id,
      client_id: session.access.client_id,
      project_id: parsed.data.project_id ?? null,
      ticket_number: ticketNumber,
      subject: parsed.data.subject,
      description: parsed.data.description || null,
      status: "open" as const,
      priority: parsed.data.priority,
      requester_user_id: session.userId,
    })
    .select("id")
    .single()

  if (error || !ticket) {
    return { error: "No se pudo crear el ticket. " + (error?.message ?? "") }
  }

  // Notificar a los miembros del staff (best-effort, no bloquea la respuesta)
  try {
    const { data: members } = await adminClient
      .from("organization_members")
      .select("user_id")
      .eq("organization_id", session.access.organization_id)
      .eq("status", "active")
      .in("role", ["owner", "admin", "manager", "member"])

    if (members && members.length > 0) {
      const clientName = session.access.client?.display_name ?? "Un cliente"
      const notifications = members.map((m) => ({
        user_id: m.user_id,
        type: "ticket" as const,
        title: `Nuevo ticket: ${parsed.data.subject}`,
        body: `${clientName} ha abierto el ticket ${ticketNumber}.`,
        url: `/tickets/${ticket.id}`,
        related_entity_type: "ticket",
        related_entity_id: ticket.id,
      }))
      await adminClient.from("notifications").insert(notifications)
    }
  } catch (err) {
    console.error("[createPortalTicket] Error al crear notificaciones:", err)
  }

  revalidatePath("/portal/soporte")
  return { error: null, ticketId: ticket.id }
}
