import { NextRequest, NextResponse } from 'next/server'
import { verifyPaymentToken } from '@/lib/payment-token'
import { createAdminClient } from '@/lib/supabase/admin'
import { decryptSecret } from '@/features/integrations/services/encryption'
import { PayPalClient } from '@/features/integrations/connectors/paypal/client'

/**
 * POST /api/pay/paypal-create
 * Crea un PayPal Order para la factura identificada por token.
 * Devuelve el orderId que el SDK de PayPal necesita en el frontend.
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
    return NextResponse.json({ error: 'Token inválido.' }, { status: 403 })
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const db = createAdminClient() as any

  const { data: invoice } = await db
    .from('invoices')
    .select('id, invoice_number, status, amount_due, currency_code, organization_id')
    .eq('id', invoiceId)
    .maybeSingle()

  if (!invoice) return NextResponse.json({ error: 'Factura no encontrada.' }, { status: 404 })
  if (['paid', 'void'].includes(invoice.status as string)) {
    return NextResponse.json({ error: 'Esta factura ya está pagada.' }, { status: 409 })
  }

  // Verificar integración
  const { data: integration } = await db
    .from('integrations')
    .select('id, metadata')
    .eq('id', body.integrationId)
    .eq('organization_id', invoice.organization_id)
    .eq('connector_type', 'paypal')
    .eq('status', 'connected')
    .is('deleted_at', null)
    .maybeSingle()

  if (!integration) return NextResponse.json({ error: 'Integración PayPal no encontrada.' }, { status: 404 })

  // Descifrar credenciales
  const [{ data: clientIdRow }, { data: secretRow }] = await Promise.all([
    db.from('integration_secrets').select('secret_ciphertext').eq('integration_id', body.integrationId).eq('secret_type', 'client_id').maybeSingle(),
    db.from('integration_secrets').select('secret_ciphertext').eq('integration_id', body.integrationId).eq('secret_type', 'client_secret').maybeSingle(),
  ])

  if (!clientIdRow || !secretRow) {
    return NextResponse.json({ error: 'Credenciales PayPal incompletas.' }, { status: 500 })
  }

  let clientId: string, clientSecret: string
  try {
    clientId     = decryptSecret(clientIdRow.secret_ciphertext)
    clientSecret = decryptSecret(secretRow.secret_ciphertext)
  } catch {
    return NextResponse.json({ error: 'Error al descifrar credenciales.' }, { status: 500 })
  }

  // Determinar entorno desde la metadata de la integración
  const env = (integration.metadata as { environment?: string } | null)?.environment === 'sandbox' ? 'sandbox' : 'production'
  const client = new PayPalClient(clientId, clientSecret, env)

  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000'
  const returnPath = `/pagar/${body.token}`

  try {
    const order = await client.createOrder({
      amount:      Math.round((invoice.amount_due as number) * 100),
      currency:    invoice.currency_code as string ?? 'EUR',
      invoiceId,
      description: `Factura ${invoice.invoice_number}`,
      returnUrl:   `${appUrl}${returnPath}`,
      cancelUrl:   `${appUrl}${returnPath}`,
    })

    return NextResponse.json({ orderId: order.id })
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err)
    return NextResponse.json({ error: `Error de PayPal: ${msg}` }, { status: 502 })
  }
}
