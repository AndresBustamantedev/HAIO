"use server"

import { revalidatePath } from "next/cache"
import { createClient } from "@/lib/supabase/server"
import { getCurrentOrganization } from "@/lib/supabase/queries/organizations"
import { nextDocumentNumber } from "@/lib/supabase/queries/sequences"

type ActionResult = { error: string | null; invoiceId?: string; invoiceNumber?: string }

export async function generateInvoiceFromMilestone(
  milestoneId: string,
  projectId: string,
  clientId: string,
): Promise<ActionResult> {
  const organization = await getCurrentOrganization()
  if (!organization) return { error: "No perteneces a ninguna organización." }

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  // Obtener datos del hito
  const { data: milestone } = await (supabase as any)
    .from("project_milestones")
    .select("id, name, type, amount, currency_code, planned_date, notes, billing_status")
    .eq("id", milestoneId)
    .single()

  if (!milestone) return { error: "Hito no encontrado." }

  // Verificar que no tenga ya una factura vinculada
  const { data: existingLink } = await (supabase as any)
    .from("invoice_milestone_links")
    .select("id")
    .eq("milestone_id", milestoneId)
    .limit(1)
    .maybeSingle()

  if (existingLink) return { error: "Este hito ya tiene una factura vinculada." }

  // Generar número de factura
  let invoiceNumber: string
  try {
    invoiceNumber = await nextDocumentNumber(supabase, organization.organizationId, "invoice", "FAC")
  } catch (err) {
    return { error: "No se pudo generar el número de factura. " + (err as Error).message }
  }

  // Crear factura borrador
  const { data: invoice, error: invoiceError } = await supabase
    .from("invoices")
    .insert({
      organization_id: organization.organizationId,
      client_id: clientId,
      project_id: projectId,
      invoice_number: invoiceNumber,
      currency_code: milestone.currency_code ?? "EUR",
      status: "draft",
      issue_date: new Date().toISOString().split("T")[0],
      due_date: milestone.planned_date ?? null,
      notes: milestone.notes ?? null,
      created_by: user?.id ?? null,
      updated_by: user?.id ?? null,
    })
    .select("id")
    .single()

  if (invoiceError || !invoice) {
    return { error: "No se pudo crear la factura. " + (invoiceError?.message ?? "") }
  }

  // Línea principal: el hito
  const items: Array<{
    invoice_id: string
    description: string
    quantity: number
    unit_price: number
    tax_rate: number
    discount_percent: number
    position: number
    milestone_id: string
    service_id?: string | null
  }> = [
    {
      invoice_id: invoice.id,
      description: milestone.name,
      quantity: 1,
      unit_price: Number(milestone.amount),
      tax_rate: 0,
      discount_percent: 0,
      position: 0,
      milestone_id: milestoneId,
    },
  ]

  // Para renovaciones: añadir líneas de servicios contratados del proyecto
  if (milestone.type === "renewal") {
    const { data: services } = await supabase
      .from("client_services")
      .select("id, service_id, name_override, unit_price, quantity, currency_code, billing_interval, services(name)")
      .eq("project_id", projectId)
      .is("deleted_at", null)
      .order("created_at", { ascending: true })

    for (const svc of services ?? []) {
      const svcName = (svc.services as { name?: string } | null)?.name ?? svc.name_override ?? "Servicio"
      items.push({
        invoice_id: invoice.id,
        description: svcName,
        quantity: Number(svc.quantity),
        unit_price: Number(svc.unit_price),
        tax_rate: 0,
        discount_percent: 0,
        position: items.length,
        milestone_id: milestoneId,
        service_id: svc.service_id ?? null,
      })
    }
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { error: itemsError } = await (supabase as any).from("invoice_items").insert(items)
  if (itemsError) {
    return { error: "Factura creada pero sin líneas. " + itemsError.message }
  }

  await supabase.rpc("recalculate_invoice_totals", { p_invoice_id: invoice.id })

  // Crear vínculo hito ↔ factura
  await (supabase as any)
    .from("invoice_milestone_links")
    .insert({
      organization_id: organization.organizationId,
      invoice_id: invoice.id,
      milestone_id: milestoneId,
      amount: Number(milestone.amount),
    })

  // Actualizar billing_status del hito
  await (supabase as any)
    .from("project_milestones")
    .update({ billing_status: "invoice_draft" })
    .eq("id", milestoneId)

  revalidatePath(`/proyectos/${projectId}`)
  revalidatePath("/facturas")
  revalidatePath(`/clientes/${clientId}`)

  return { error: null, invoiceId: invoice.id, invoiceNumber }
}
