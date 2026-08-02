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

  // Leer estado previo y datos del cliente para detectar transición → 'sent'
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const db = supabase as any
  const { data: prevInvoice } = await db
    .from("invoices")
    .select("status, invoice_number, total, amount_due, due_date, currency_code, organization_id, clients(display_name, email), organizations(name)")
    .eq("id", invoiceId)
    .maybeSingle()

  const { error: invoiceError } = await supabase
    .from("invoices")
    .update({
      client_id: parsed.data.client_id,
      currency_code: parsed.data.currency_code ?? "EUR",
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

  // Enviar email al cliente cuando la factura cambia de estado a 'sent'
  const transitionToSent =
    prevInvoice &&
    prevInvoice.status !== 'sent' &&
    parsed.data.status === 'sent'

  if (transitionToSent) {
    const clientEmail = prevInvoice.clients?.email as string | null
    if (clientEmail) {
      try {
        const { generatePaymentToken } = await import('@/lib/payment-token')
        const { sendEmail } = await import('@/lib/email')
        const { buildInvoiceSentEmail } = await import('@/features/invoices/emails/invoice-sent-email')

        const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000'
        const token = generatePaymentToken(invoiceId)
        const paymentUrl = `${appUrl}/pagar/${token}`

        const fmt = (amount: number) =>
          new Intl.NumberFormat('es-ES', {
            style: 'currency',
            currency: prevInvoice.currency_code ?? 'EUR',
          }).format(amount)

        const fmtDate = (iso: string | null) =>
          iso
            ? new Intl.DateTimeFormat('es-ES', { day: '2-digit', month: 'long', year: 'numeric' }).format(new Date(iso))
            : null

        const { subject, html } = buildInvoiceSentEmail({
          clientName:       prevInvoice.clients?.display_name ?? 'Cliente',
          organizationName: prevInvoice.organizations?.name ?? 'HAIO',
          invoiceNumber:    prevInvoice.invoice_number ?? invoiceId,
          total:            fmt(Number(prevInvoice.total ?? 0)),
          amountDue:        fmt(Number(prevInvoice.amount_due ?? 0)),
          dueDate:          fmtDate(prevInvoice.due_date),
          paymentUrl,
        })

        await sendEmail({ to: clientEmail, subject, html })
      } catch (err) {
        // El email es best-effort — no devolvemos error al usuario
        console.error('[updateInvoice] Error al enviar email:', err)
      }
    }
  }

  revalidatePath("/facturas")
  revalidatePath(`/facturas/${invoiceId}`)
  revalidatePath(`/clientes/${parsed.data.client_id}`)
  revalidatePath("/dashboard")

  return { error: null }
}
