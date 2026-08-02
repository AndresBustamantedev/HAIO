import { NextRequest, NextResponse } from 'next/server'
import { verifyPaymentToken } from '@/lib/payment-token'
import { createAdminClient } from '@/lib/supabase/admin'
import { decryptSecret } from '@/features/integrations/services/encryption'

/**
 * POST /api/pay/stripe-session
 * Crea una Stripe Checkout Session para una factura identificada por token.
 * No requiere sesión de usuario — usa el token de pago como autorización.
 */
export async function POST(request: NextRequest) {
  const body = await request.json().catch(() => null) as {
    token?: string
    integrationId?: string
  } | null

  if (!body?.token || !body?.integrationId) {
    return NextResponse.json({ error: 'Parámetros inválidos.' }, { status: 400 })
  }

  const invoiceId = verifyPaymentToken(body.token)
  if (!invoiceId) {
    return NextResponse.json({ error: 'Link de pago inválido o manipulado.' }, { status: 403 })
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const db = createAdminClient() as any

  // Cargar factura
  const { data: invoice } = await db
    .from('invoices')
    .select('id, invoice_number, status, amount_due, currency_code, organization_id')
    .eq('id', invoiceId)
    .maybeSingle()

  if (!invoice) return NextResponse.json({ error: 'Factura no encontrada.' }, { status: 404 })
  if (['paid', 'void'].includes(invoice.status as string)) {
    return NextResponse.json({ error: 'Esta factura ya está pagada.' }, { status: 409 })
  }

  // Verificar que la integración pertenece a la misma org
  const { data: integration } = await db
    .from('integrations')
    .select('id')
    .eq('id', body.integrationId)
    .eq('organization_id', invoice.organization_id)
    .eq('connector_type', 'stripe')
    .eq('status', 'connected')
    .is('deleted_at', null)
    .maybeSingle()

  if (!integration) {
    return NextResponse.json({ error: 'Integración Stripe no encontrada.' }, { status: 404 })
  }

  // Descifrar secret_key
  const { data: secretRow } = await db
    .from('integration_secrets')
    .select('secret_ciphertext')
    .eq('integration_id', body.integrationId)
    .eq('secret_type', 'secret_key')
    .maybeSingle()

  if (!secretRow) return NextResponse.json({ error: 'Credenciales de Stripe no encontradas.' }, { status: 500 })

  let secretKey: string
  try {
    secretKey = decryptSecret(secretRow.secret_ciphertext)
  } catch {
    return NextResponse.json({ error: 'Error al descifrar credenciales.' }, { status: 500 })
  }

  // Crear Stripe Checkout Session
  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000'
  const returnPath = `/pagar/${body.token}`
  const currency = (invoice.currency_code as string | null ?? 'eur').toLowerCase()
  const amountCents = Math.round(invoice.amount_due as number * 100)

  const formBody = new URLSearchParams({
    mode: 'payment',
    'payment_method_types[]': 'card',
    'line_items[0][price_data][currency]': currency,
    'line_items[0][price_data][product_data][name]': `Factura ${invoice.invoice_number}`,
    'line_items[0][price_data][unit_amount]': String(amountCents),
    'line_items[0][quantity]': '1',
    success_url: `${appUrl}${returnPath}?stripe_session={CHECKOUT_SESSION_ID}`,
    cancel_url:  `${appUrl}${returnPath}`,
    'metadata[haio_invoice_id]':     invoiceId,
    'metadata[haio_integration_id]': body.integrationId,
  })

  const res = await fetch('https://api.stripe.com/v1/checkout/sessions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${secretKey}`,
      'Content-Type':  'application/x-www-form-urlencoded',
      'Stripe-Version': '2024-06-20',
    },
    body: formBody,
  })

  if (!res.ok) {
    const err = await res.json().catch(() => ({})) as { error?: { message?: string } }
    return NextResponse.json(
      { error: err.error?.message ?? 'Error al crear sesión de pago en Stripe.' },
      { status: 500 },
    )
  }

  const session = await res.json() as { url?: string }
  return NextResponse.json({ url: session.url ?? null })
}
