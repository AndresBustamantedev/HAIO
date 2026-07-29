"use server"

import { revalidatePath } from "next/cache"

import { createClient as createSupabaseServerClient } from "@/lib/supabase/server"
import { invoiceSchema, type InvoiceInput } from "@/features/invoices/schemas/invoice-schema"

type ActionResult = { error: string | null }

/** Replaces every line item — simplest consistent approach for an editable invoice. */
export async function updateInvoice(invoiceId: string, input: InvoiceInput): Promise<ActionResult> {
  const parsed = invoiceSchema.safeParse(input)
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Datos no válidos." }
  }

  const supabase = await createSupabaseServerClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  const { error: invoiceError } = await supabase
    .from("invoices")
    .update({
      client_id: parsed.data.client_id,
      status: parsed.data.status,
      issue_date: parsed.data.issue_date,
      due_date: parsed.data.due_date || null,
      notes: parsed.data.notes || null,
      updated_by: user?.id ?? null,
    })
    .eq("id", invoiceId)

  if (invoiceError) {
    return { error: "No se pudo actualizar la factura. " + invoiceError.message }
  }

  const { error: deleteError } = await supabase.from("invoice_items").delete().eq("invoice_id", invoiceId)
  if (deleteError) {
    return { error: "No se pudieron actualizar las líneas de la factura. " + deleteError.message }
  }

  const itemsPayload = parsed.data.items.map((item, index) => ({
    invoice_id: invoiceId,
    description: item.description,
    quantity: Number(item.quantity),
    unit_price: Number(item.unit_price),
    tax_rate: item.tax_rate ? Number(item.tax_rate) : 0,
    discount_percent: item.discount_percent ? Number(item.discount_percent) : 0,
    position: index,
  }))

  const { error: itemsError } = await supabase.from("invoice_items").insert(itemsPayload)
  if (itemsError) {
    return { error: "No se pudieron guardar las líneas de la factura. " + itemsError.message }
  }

  await supabase.rpc("recalculate_invoice_totals", { p_invoice_id: invoiceId })
  await supabase.rpc("recalculate_invoice_payment_state", { p_invoice_id: invoiceId })

  revalidatePath("/facturas")
  revalidatePath(`/facturas/${invoiceId}`)
  revalidatePath(`/clientes/${parsed.data.client_id}`)
  revalidatePath("/dashboard")

  return { error: null }
}
