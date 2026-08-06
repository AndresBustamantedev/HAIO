"use server"

import { revalidatePath } from "next/cache"

import { createClient as createSupabaseServerClient } from "@/lib/supabase/server"
import { getCurrentOrganization } from "@/lib/supabase/queries/organizations"
import { nextDocumentNumber } from "@/lib/supabase/queries/sequences"
import { quoteSchema, type QuoteInput } from "@/features/quotes/schemas/quote-schema"

type ActionResult = { error: string | null; quoteId?: string }

export async function createQuote(input: QuoteInput): Promise<ActionResult> {
  const parsed = quoteSchema.safeParse(input)
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

  let quoteNumber: string
  try {
    quoteNumber = await nextDocumentNumber(supabase, organization.organizationId, "quote", "PRES")
  } catch (error) {
    return { error: "No se pudo generar el número de presupuesto. " + (error as Error).message }
  }

  const { data: quote, error: quoteError } = await supabase
    .from("quotes")
    .insert({
      organization_id: organization.organizationId,
      client_id: parsed.data.client_id,
      project_id: parsed.data.project_id || null,
      quote_number: quoteNumber,
      status: parsed.data.status,
      issue_date: parsed.data.issue_date,
      valid_until: parsed.data.valid_until || null,
      terms: parsed.data.terms || null,
      notes: parsed.data.notes || null,
      created_by: user?.id ?? null,
      updated_by: user?.id ?? null,
    })
    .select("id")
    .single()

  if (quoteError || !quote) {
    return { error: "No se pudo crear el presupuesto. " + (quoteError?.message ?? "") }
  }

  const itemsPayload = parsed.data.items.map((item, index) => ({
    quote_id: quote.id,
    description: item.description,
    quantity: Number(item.quantity),
    unit_price: Number(item.unit_price),
    tax_rate: item.tax_rate ? Number(item.tax_rate) : 0,
    discount_percent: item.discount_percent ? Number(item.discount_percent) : 0,
    position: index,
  }))

  const { error: itemsError } = await supabase.from("quote_items").insert(itemsPayload)
  if (itemsError) {
    return { error: "El presupuesto se creó pero no se pudieron guardar las líneas. " + itemsError.message }
  }

  await supabase.rpc("recalculate_quote_totals", { p_quote_id: quote.id })

  revalidatePath("/presupuestos")
  revalidatePath(`/clientes/${parsed.data.client_id}`)
  if (parsed.data.project_id) revalidatePath(`/proyectos/${parsed.data.project_id}`)

  return { error: null, quoteId: quote.id }
}
