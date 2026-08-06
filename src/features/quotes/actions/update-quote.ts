"use server"

import { revalidatePath } from "next/cache"

import { createClient as createSupabaseServerClient } from "@/lib/supabase/server"
import { quoteSchema, type QuoteInput } from "@/features/quotes/schemas/quote-schema"

type ActionResult = { error: string | null }

/** Replaces every line item — simplest consistent approach for an editable quote. */
export async function updateQuote(quoteId: string, input: QuoteInput): Promise<ActionResult> {
  const parsed = quoteSchema.safeParse(input)
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Datos no válidos." }
  }

  const supabase = await createSupabaseServerClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  const { error: quoteError } = await supabase
    .from("quotes")
    .update({
      client_id: parsed.data.client_id,
      project_id: parsed.data.project_id || null,
      status: parsed.data.status,
      issue_date: parsed.data.issue_date,
      valid_until: parsed.data.valid_until || null,
      terms: parsed.data.terms || null,
      notes: parsed.data.notes || null,
      updated_by: user?.id ?? null,
    })
    .eq("id", quoteId)

  if (quoteError) {
    return { error: "No se pudo actualizar el presupuesto. " + quoteError.message }
  }

  const { error: deleteError } = await supabase.from("quote_items").delete().eq("quote_id", quoteId)
  if (deleteError) {
    return { error: "No se pudieron actualizar las líneas del presupuesto. " + deleteError.message }
  }

  const itemsPayload = parsed.data.items.map((item, index) => ({
    quote_id: quoteId,
    description: item.description,
    quantity: Number(item.quantity),
    unit_price: Number(item.unit_price),
    tax_rate: item.tax_rate ? Number(item.tax_rate) : 0,
    discount_percent: item.discount_percent ? Number(item.discount_percent) : 0,
    position: index,
  }))

  const { error: itemsError } = await supabase.from("quote_items").insert(itemsPayload)
  if (itemsError) {
    return { error: "No se pudieron guardar las líneas del presupuesto. " + itemsError.message }
  }

  await supabase.rpc("recalculate_quote_totals", { p_quote_id: quoteId })

  revalidatePath("/presupuestos")
  revalidatePath(`/presupuestos/${quoteId}`)
  revalidatePath(`/clientes/${parsed.data.client_id}`)
  if (parsed.data.project_id) revalidatePath(`/proyectos/${parsed.data.project_id}`)

  return { error: null }
}
