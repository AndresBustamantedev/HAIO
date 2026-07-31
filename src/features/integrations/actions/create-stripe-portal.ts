'use server'

import 'server-only'

import { z } from 'zod'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { getCurrentOrganization } from '@/lib/supabase/queries/organizations'
import { decryptSecret } from '@/features/integrations/services/encryption'

const inputSchema = z.object({
  clientId:      z.string().uuid(),
  integrationId: z.string().uuid(),
  returnUrl:     z.string().url().optional(),
})

type ActionResult =
  | { success: true; url: string }
  | { success: false; error: string }

const ALLOWED_ROLES = ['owner', 'admin', 'manager'] as const

/**
 * Genera un link al Stripe Customer Portal para un cliente HAIO.
 * El cliente HAIO debe tener un email que coincida con un customer de Stripe,
 * o bien tener un external_resource de tipo payment_customer vinculado a él.
 *
 * Estrategia de resolución del customerId (en orden):
 *  1. Buscar external_resource de tipo payment_customer con local_resource_id = clientId.
 *  2. Fallback: buscar en Stripe por email del cliente HAIO.
 */
export async function createStripePortalSession(input: unknown): Promise<ActionResult> {
  const parsed = inputSchema.safeParse(input)
  if (!parsed.success) return { success: false, error: 'Datos no válidos.' }

  const { clientId, integrationId, returnUrl } = parsed.data

  const organization = await getCurrentOrganization()
  if (!organization) return { success: false, error: 'No perteneces a ninguna organización.' }
  if (!(ALLOWED_ROLES as readonly string[]).includes(organization.role)) {
    return { success: false, error: 'No tienes permiso para generar links del portal.' }
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const db = (await createClient()) as any

  // 1. Verificar cliente
  const { data: clientRow } = await db
    .from('clients')
    .select('id, display_name, email')
    .eq('id', clientId)
    .eq('organization_id', organization.organizationId)
    .is('deleted_at', null)
    .maybeSingle()

  if (!clientRow) return { success: false, error: 'Cliente no encontrado.' }

  // 2. Verificar integración Stripe
  const { data: integration } = await db
    .from('integrations')
    .select('id, status')
    .eq('id', integrationId)
    .eq('organization_id', organization.organizationId)
    .eq('connector_type', 'stripe')
    .is('deleted_at', null)
    .maybeSingle()

  if (!integration) return { success: false, error: 'Integración Stripe no encontrada.' }
  if (integration.status !== 'connected') {
    return { success: false, error: 'La integración Stripe no está conectada.' }
  }

  // 3. Descifrar secret_key
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

  const { StripeClient } = await import('@/features/integrations/connectors/stripe/client')
  const client = new StripeClient(secretKey)

  // 4. Resolver customerId
  let stripeCustomerId: string | null = null

  // Buscar external_resource de tipo payment_customer vinculado al cliente
  const { data: linkedResource } = await db
    .from('external_resources')
    .select('external_resource_id, raw_metadata')
    .eq('integration_id', integrationId)
    .eq('external_resource_type', 'payment_customer')
    .eq('local_resource_id', clientId)
    .is('deleted_at', null)
    .maybeSingle()

  if (linkedResource?.external_resource_id) {
    stripeCustomerId = linkedResource.external_resource_id as string
  } else if (clientRow.email) {
    // Fallback: buscar por email en Stripe
    try {
      stripeCustomerId = await client.findOrCreateCustomer(clientRow.email as string, clientRow.display_name as string)
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err)
      return { success: false, error: `No se pudo encontrar el customer en Stripe: ${msg}` }
    }
  }

  if (!stripeCustomerId) {
    return {
      success: false,
      error: `El cliente "${clientRow.display_name}" no tiene customer vinculado en Stripe ni email configurado.`,
    }
  }

  // 5. Crear sesión de portal
  const effectiveReturnUrl = returnUrl ?? `${process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000'}/clientes/${clientId}`

  try {
    const session = await client.createPortalSession({
      customer:  stripeCustomerId,
      returnUrl: effectiveReturnUrl,
    })
    return { success: true, url: session.url }
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err)
    return { success: false, error: `Error al generar el portal de Stripe: ${msg}` }
  }
}
