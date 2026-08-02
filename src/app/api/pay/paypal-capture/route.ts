import { NextRequest, NextResponse } from 'next/server'
import { verifyPaymentToken } from '@/lib/payment-token'
import { createAdminClient } from '@/lib/supabase/admin'
import { decryptSecret } from '@/features/integrations/services/encryption'
import { PayPalClient } from '@/features/integrations/connectors/paypal/client'

/**
 * POST /api/pay/paypal-capture
 * Captura un PayPal Order aprobado y marca la factura como pagada en HAIO.
 */
export async function POST(request: NextRequest) {
  const body = await request.json().catch(() => null) as {
    token?: string
    orderId?: string
    integrationId?: string
  } | null

  if (!body?.token || !body?.orderId || !body?.integrationId) {
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

  // Cargar credenciales
  const [{ data: clientIdRow }, { data: secretRow }] = await Promise.all([
    db.from('integration_secrets').select('secret_ciphertext').eq('integration_id', body.integrationId).eq('secret_type', 'client_id').maybeSingle(),
    db.from('integration_secrets').select('secret_ciphertext').eq('integration_id', body.integrationId).eq('secret_type', 'client_secret').maybeSingle(),
  ])

  if (!clientIdRow || !secretRow) {
    return NextResponse.json({ error: 'Credenciales PayPal incompletas.' }, { status: 500 })
  }

  const { data: integration } = await db
    .from('integrations')
    .select('metadata')
    .eq('id', body.integrationId)
    .maybeSingle()

  let clientId: string, clientSecret: string
  try {
    clientId     = decryptSecret(clientIdRow.secret_ciphertext)
    clientSecret = decryptSecret(secretRow.secret_ciphertext)
  } catch {
    return NextResponse.json({ error: 'Error al descifrar credenciales.' }, { status: 500 })
  }

  const env = (integration?.metadata as { environment?: string } | null)?.environment === 'sandbox' ? 'sandbox' : 'production'
  const client = new PayPalClient(clientId, clientSecret, env)

  // Capturar el pedido
  let captureResult
  try {
    captureResult = await client.captureOrder(body.orderId)
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err)
    return NextResponse.json({ error: `Error al capturar el pago: ${msg}` }, { status: 502 })
  }

  const capture = captureResult.purchase_units?.[0]?.payments?.captures?.[0]
  if (!capture || capture.status !== 'COMPLETED') {
    return NextResponse.json({ error: 'El pago no se ha completado correctamente.' }, { status: 402 })
  }

  // Registrar pago — el trigger trg_payments_recalculate actualiza
  // automáticamente amount_paid, amount_due y status de la factura.
  const { error: insertError } = await db.from('payments').insert({
    invoice_id:        invoiceId,
    organization_id:   invoice.organization_id,
    client_id:         invoice.client_id,
    amount:            invoice.amount_due,
    currency_code:     invoice.currency_code ?? 'EUR',
    method:            'paypal',
    status:            'succeeded',
    paid_at:           new Date().toISOString(),
    external_id:       body.orderId,
    external_provider: 'paypal',
    reference:         `PayPal Order ${body.orderId}`,
  })

  if (insertError) {
    console.error('[paypal-capture] Error al registrar pago:', insertError)
    return NextResponse.json({ error: 'Error al registrar el pago.' }, { status: 500 })
  }

  return NextResponse.json({ success: true })
}
