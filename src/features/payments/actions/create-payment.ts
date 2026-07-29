"use server"

import { revalidatePath } from "next/cache"

import { createClient as createSupabaseServerClient } from "@/lib/supabase/server"
import { getCurrentOrganization } from "@/lib/supabase/queries/organizations"
import { paymentSchema, type PaymentInput } from "@/features/payments/schemas/payment-schema"

type ActionResult = { error: string | null }

export async function createPayment(input: PaymentInput): Promise<ActionResult> {
  const parsed = paymentSchema.safeParse(input)
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Datos no válidos." }
  }

  const organization = await getCurrentOrganization()
  if (!organization) {
    return { error: "No perteneces a ninguna organización." }
  }

  const supabase = await createSupabaseServerClient()

  const { error } = await supabase.from("payments").insert({
    organization_id: organization.organizationId,
    client_id: parsed.data.client_id,
    invoice_id: parsed.data.invoice_id || null,
    amount: Number(parsed.data.amount),
    method: parsed.data.method,
    status: parsed.data.status,
    paid_at: parsed.data.paid_at || null,
    reference: parsed.data.reference || null,
    failure_reason: parsed.data.failure_reason || null,
  })

  if (error) {
    return { error: "No se pudo registrar el pago. " + error.message }
  }

  if (parsed.data.invoice_id) {
    await supabase.rpc("recalculate_invoice_payment_state", { p_invoice_id: parsed.data.invoice_id })
    revalidatePath(`/facturas/${parsed.data.invoice_id}`)
  }

  revalidatePath("/pagos")
  revalidatePath("/facturas")
  revalidatePath("/dashboard")
  revalidatePath(`/clientes/${parsed.data.client_id}`)

  return { error: null }
}
