import { NextRequest, NextResponse } from 'next/server'
import { verifyPaymentToken } from '@/lib/payment-token'
import { createAdminClient } from '@/lib/supabase/admin'
import { decryptSecret } from '@/features/integrations/services/encryption'

/**
 * POST /api/pay/stripe-verify
 * Verifica un Stripe Checkout Session y marca la factura como pagada.
 * Llamado desde el cliente tras el redirect de Stripe con ?stripe_session=...
 */
export async function POST(request: NextRequest) {
  const body = await request.json().catch(() => null) as {
    token?: string
    sessionId?: string
    integrationId?: string
  } | null

  if (!body?.token || !body?.sessionId || !body?.integrationId) {
    return NextResponse.json({ error: 'Parámetros inválidos.' }, { status: 400 })
  }

  const invoiceId = verifyPaymentToken(body.token)
  if (!invoiceId) {
    return NextResponse.json({ error: 'Token inválido.' }, { status: 403 })
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const db = createAdminClient() as any

  const { data: invoice } = await db
    .from('invoices')
    .select('id, status, amount_due, currency_code, organization_id, client_id')
    .eq('id', invoiceId)
    .maybeSingle()

  if (!invoice) return NextResponse.json({ error: 'Factura no encontrada.' }, { status: 404 })
  if (['paid', 'void'].includes(invoice.status as string)) {
    return NextResponse.json({ success: true }) // idempotente
  }

  // Descifrar secret_key de Stripe
  const { data: secretRow } = await db
    .from('integration_secrets')
    .select('secret_ciphertext')
    .eq('integration_id', body.integrationId)
    .eq('secret_type', 'secret_key')
    .maybeSingle()

  if (!secretRow) return NextResponse.json({ error: 'Credenciales no encontradas.' }, { status: 500 })

  let secretKey: string
  try {
    secretKey = decryptSecret(secretRow.secret_ciphertext)
  } catch {
    return NextResponse.json({ error: 'Error al descifrar credenciales.' }, { status: 500 })
  }

  // Verificar sesión con Stripe
  const stripeRes = await fetch(`https://api.stripe.com/v1/checkout/sessions/${body.sessionId}`, {
    headers: {
      'Authorization': `Bearer ${secretKey}`,
      'Stripe-Version': '2024-06-20',
    },
  })

  if (!stripeRes.ok) {
    return NextResponse.json({ error: 'No se pudo verificar el pago con Stripe.' }, { status: 502 })
  }

  const session = await stripeRes.json() as {
    payment_status?: string
    metadata?: { haio_invoice_id?: string }
    amount_total?: number
    currency?: string
    payment_intent?: string
  }

  if (session.payment_status !== 'paid') {
    return NextResponse.json({ error: 'El pago aún no se ha completado.' }, { status: 402 })
  }

  // Seguridad: el metadata de la sesión debe apuntar a esta factura
  if (session.metadata?.haio_invoice_id !== invoiceId) {
    return NextResponse.json({ error: 'El pago no corresponde a esta factura.' }, { status: 403 })
  }

  // Registrar pago — el trigger trg_payments_recalculate actualiza
  // automáticamente amount_paid, amount_due y status de la factura.
  const { error: insertError } = await db.from('payments').insert({
    invoice_id:        invoiceId,
    organization_id:   invoice.organization_id,
    client_id:         invoice.client_id,
    amount:            invoice.amount_due as number,
    currency_code:     invoice.currency_code ?? 'EUR',
    method:            'stripe',
    status:            'succeeded',
    paid_at:           new Date().toISOString(),
    external_id:       body.sessionId,
    external_provider: 'stripe',
    reference:         `Stripe Checkout ${body.sessionId}`,
  })

  if (insertError) {
    console.error('[stripe-verify] Error al registrar pago:', insertError)
    return NextResponse.json({ error: 'Error al registrar el pago.' }, { status: 500 })
  }

  return NextResponse.json({ success: true })
}
