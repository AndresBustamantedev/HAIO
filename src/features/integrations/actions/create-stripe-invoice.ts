'use server'

import 'server-only'

import { z } from 'zod'
import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { getCurrentOrganization } from '@/lib/supabase/queries/organizations'
import { decryptSecret } from '@/features/integrations/services/encryption'

const inputSchema = z.object({
  invoiceId:     z.string().uuid(),
  integrationId: z.string().uuid(),
})

type ActionResult =
  | { success: true; stripeInvoiceId: string; hostedUrl: string | null }
  | { success: false; error: string }

const ALLOWED_ROLES = ['owner', 'admin', 'manager'] as const

/**
 * Crea una factura en Stripe a partir de una factura HAIO.
 * Flujo:
 *  1. Carga la factura HAIO con sus líneas e info del cliente.
 *  2. Recupera la integración Stripe activa de la organización.
 *  3. Descifra el secret_key con service_role.
 *  4. Busca o crea el customer en Stripe por email del cliente HAIO.
 *  5. Crea invoice items + invoice, lo finaliza y envía.
 */
export async function createStripeInvoice(input: unknown): Promise<ActionResult> {
  const parsed = inputSchema.safeParse(input)
  if (!parsed.success) return { success: false, error: 'Datos no válidos.' }

  const { invoiceId, integrationId } = parsed.data

  const organization = await getCurrentOrganization()
  if (!organization) return { success: false, error: 'No perteneces a ninguna organización.' }
  if (!(ALLOWED_ROLES as readonly string[]).includes(organization.role)) {
    return { success: false, error: 'No tienes permiso para crear facturas en Stripe.' }
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const db = (await createClient()) as any

  // 1. Cargar factura HAIO con líneas y cliente
  const { data: invoiceRow } = await db
    .from('invoices')
    .select('id, invoice_number, currency_code, notes, client_id, organization_id, clients(id, display_name, email)')
    .eq('id', invoiceId)
    .eq('organization_id', organization.organizationId)
    .maybeSingle()

  if (!invoiceRow) return { success: false, error: 'Factura no encontrada.' }

  const { data: itemsRows } = await db
    .from('invoice_items')
    .select('description, quantity, unit_price, tax_rate, discount_percent, line_total')
    .eq('invoice_id', invoiceId)
    .order('position')

  if (!itemsRows?.length) return { success: false, error: 'La factura no tiene líneas.' }

  const clientEmail: string | null = invoiceRow.clients?.email ?? null
  const clientName: string = invoiceRow.clients?.display_name ?? 'Cliente'
  const currency: string = (invoiceRow.currency_code as string | null | undefined)?.toLowerCase() ?? 'eur'

  if (!clientEmail) {
    return { success: false, error: `El cliente "${clientName}" no tiene email. Añádelo antes de cobrar con Stripe.` }
  }

  // 2. Verificar que la integración Stripe pertenece a esta organización
  const { data: integration } = await db
    .from('integrations')
    .select('id, connector_type, status')
    .eq('id', integrationId)
    .eq('organization_id', organization.organizationId)
    .eq('connector_type', 'stripe')
    .is('deleted_at', null)
    .maybeSingle()

  if (!integration) return { success: false, error: 'Integración Stripe no encontrada.' }
  if (integration.status !== 'connected') {
    return { success: false, error: 'La integración Stripe no está conectada. Verifica las credenciales.' }
  }

  // 3. Descifrar secret_key con admin client (solo service_role puede leer integration_secrets)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const adminDb = createAdminClient() as any

  const { data: secretRow } = await adminDb
    .from('integration_secrets')
    .select('secret_ciphertext')
    .eq('integration_id', integrationId)
    .eq('secret_type', 'secret_key')
    .maybeSingle()

  if (!secretRow) return { success: false, error: 'No se encontraron credenciales de Stripe.' }

  let secretKey: string
  try {
    secretKey = decryptSecret(secretRow.secret_ciphertext)
  } catch {
    return { success: false, error: 'Error al descifrar las credenciales de Stripe.' }
  }

  // 4. Llamar a la API de Stripe
  const { StripeClient } = await import('@/features/integrations/connectors/stripe/client')
  const client = new StripeClient(secretKey)

  let customerId: string
  try {
    customerId = await client.findOrCreateCustomer(clientEmail, clientName)
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err)
    return { success: false, error: `Error al buscar/crear customer en Stripe: ${msg}` }
  }

  // 5. Crear invoice items
  try {
    for (const item of itemsRows) {
      const qty       = Number(item.quantity) || 1
      const price     = Number(item.unit_price) || 0
      const taxRate   = Number(item.tax_rate) || 0
      const discount  = Number(item.discount_percent) || 0
      const lineBase  = qty * price * (1 - discount / 100)
      const lineTotal = Math.round(lineBase * (1 + taxRate / 100) * 100)

      await client.createInvoiceItem({
        customer:    customerId,
        amount:      lineTotal,
        currency,
        description: item.description as string,
      })
    }
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err)
    return { success: false, error: `Error al crear líneas en Stripe: ${msg}` }
  }

  // 6. Crear, finalizar y enviar la factura
  let stripeInvoiceId: string
  let hostedUrl: string | null

  try {
    const inv = await client.createInvoice({
      customer:    customerId,
      currency,
      daysUntilDue: 30,
      description: invoiceRow.notes ?? `Factura ${invoiceRow.invoice_number}`,
      metadata: {
        haio_invoice_id:     invoiceId,
        haio_invoice_number: invoiceRow.invoice_number as string,
      },
    })
    stripeInvoiceId = inv.id

    const finalized = await client.finalizeInvoice(stripeInvoiceId)
    await client.sendInvoice(stripeInvoiceId)
    hostedUrl = finalized.hosted_invoice_url
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err)
    return { success: false, error: `Error al finalizar/enviar la factura en Stripe: ${msg}` }
  }

  revalidatePath(`/facturas/${invoiceId}`)

  return { success: true, stripeInvoiceId, hostedUrl }
}
