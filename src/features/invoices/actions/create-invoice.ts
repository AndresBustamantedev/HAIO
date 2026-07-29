"use server"

import { revalidatePath } from "next/cache"

import { createClient as createSupabaseServerClient } from "@/lib/supabase/server"
import { getCurrentOrganization } from "@/lib/supabase/queries/organizations"
import { nextDocumentNumber } from "@/lib/supabase/queries/sequences"
import { invoiceSchema, type InvoiceInput } from "@/features/invoices/schemas/invoice-schema"

type ActionResult = { error: string | null; invoiceId?: string }

export async function createInvoice(input: InvoiceInput): Promise<ActionResult> {
  const parsed = invoiceSchema.safeParse(input)
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

  let invoiceNumber: string
  try {
    invoiceNumber = await nextDocumentNumber(supabase, organization.organizationId, "invoice", "FAC")
  } catch (error) {
    return { error: "No se pudo generar el número de factura. " + (error as Error).message }
  }

  const { data: invoice, error: invoiceError } = await supabase
    .from("invoices")
    .insert({
      organization_id: organization.organizationId,
      client_id: parsed.data.client_id,
      invoice_number: invoiceNumber,
      status: parsed.data.status,
      issue_date: parsed.data.issue_date,
      due_date: parsed.data.due_date || null,
      notes: parsed.data.notes || null,
      created_by: user?.id ?? null,
      updated_by: user?.id ?? null,
    })
    .select("id")
    .single()

  if (invoiceError || !invoice) {
    return { error: "No se pudo crear la factura. " + (invoiceError?.message ?? "") }
  }

  const itemsPayload = parsed.data.items.map((item, index) => ({
    invoice_id: invoice.id,
    description: item.description,
    quantity: Number(item.quantity),
    unit_price: Number(item.unit_price),
    tax_rate: item.tax_rate ? Number(item.tax_rate) : 0,
    discount_percent: item.discount_percent ? Number(item.discount_percent) : 0,
    position: index,
  }))

  const { error: itemsError } = await supabase.from("invoice_items").insert(itemsPayload)
  if (itemsError) {
    return { error: "La factura se creó pero no se pudieron guardar las líneas. " + itemsError.message }
  }

  await supabase.rpc("recalculate_invoice_totals", { p_invoice_id: invoice.id })

  revalidatePath("/facturas")
  revalidatePath(`/clientes/${parsed.data.client_id}`)
  revalidatePath("/dashboard")

  return { error: null, invoiceId: invoice.id }
}
