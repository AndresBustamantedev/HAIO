"use server"

import { revalidatePath } from "next/cache"

import { createClient as createSupabaseServerClient } from "@/lib/supabase/server"
import { paymentSchema, type PaymentInput } from "@/features/payments/schemas/payment-schema"

type ActionResult = { error: string | null }

export async function updatePayment(paymentId: string, input: PaymentInput): Promise<ActionResult> {
  const parsed = paymentSchema.safeParse(input)
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Datos no válidos." }
  }

  const supabase = await createSupabaseServerClient()

  const { error } = await supabase
    .from("payments")
    .update({
      client_id: parsed.data.client_id,
      invoice_id: parsed.data.invoice_id || null,
      amount: Number(parsed.data.amount),
      method: parsed.data.method,
      status: parsed.data.status,
      paid_at: parsed.data.paid_at || null,
      reference: parsed.data.reference || null,
      failure_reason: parsed.data.failure_reason || null,
    })
    .eq("id", paymentId)

  if (error) {
    return { error: "No se pudo actualizar el pago. " + error.message }
  }

  if (parsed.data.invoice_id) {
    await supabase.rpc("recalculate_invoice_payment_state", { p_invoice_id: parsed.data.invoice_id })
    revalidatePath(`/facturas/${parsed.data.invoice_id}`)
  }

  revalidatePath("/pagos")
  revalidatePath("/facturas")
  revalidatePath("/dashboard")

  return { error: null }
}
