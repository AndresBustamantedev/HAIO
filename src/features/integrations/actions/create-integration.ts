'use server'

import 'server-only'

import { revalidatePath } from 'next/cache'
import { randomUUID } from 'crypto'

import { createClient } from '@/lib/supabase/server'
import { getCurrentOrganization } from '@/lib/supabase/queries/organizations'
import {
  createIntegrationSchema,
  type CreateIntegrationInput,
} from '@/features/integrations/schemas/integration-schema'
import { encryptSecret, formatHexForPostgres } from '@/features/integrations/services/encryption'
import { getConnectorMeta } from '@/features/integrations/connectors/registry'

type ActionResult = { error: string | null; integrationId?: string }

const ALLOWED_ROLES = ['owner', 'admin', 'manager'] as const

export async function createIntegration(
  input: CreateIntegrationInput,
): Promise<ActionResult> {
  // 1. Validar entrada
  const parsed = createIntegrationSchema.safeParse(input)
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? 'Datos no válidos.' }
  }

  // 2. Verificar sesión y rol
  const organization = await getCurrentOrganization()
  if (!organization) {
    return { error: 'No perteneces a ninguna organización.' }
  }
  if (!(ALLOWED_ROLES as readonly string[]).includes(organization.role)) {
    return { error: 'No tienes permiso para crear integraciones.' }
  }

  // 3. Verificar que el conector existe
  const connectorMeta = getConnectorMeta(parsed.data.connector_type)
  if (!connectorMeta) {
    return { error: `Tipo de conector desconocido: ${parsed.data.connector_type}` }
  }

  // 4. Verificar que se han proporcionado todos los secretos requeridos
  const requiredSecretTypes = connectorMeta.requiredSecrets.map((s) => s.type)
  const missingSecrets = requiredSecretTypes.filter(
    (type) => !parsed.data.secrets[type],
  )
  if (missingSecrets.length > 0) {
    return {
      error: `Faltan las credenciales: ${missingSecrets.join(', ')}`,
    }
  }

  const supabase = await createClient()
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const db = supabase as any
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return { error: 'No autenticado.' }
  }

  // 5. Buscar el provider_id para este connector_type
  // La tabla providers debe existir y tener una fila con connector_type
  const { data: provider, error: providerError } = await db
    .from('providers')
    .select('id')
    .eq('connector_type', parsed.data.connector_type)
    .single()

  if (providerError || !provider) {
    return { error: `Proveedor no encontrado para el conector: ${parsed.data.connector_type}` }
  }

  const integrationId = randomUUID()

  // 6. Insertar la integración (sin secretos — van en tabla separada)
  const integrationName =
    parsed.data.name ??
    `${connectorMeta.displayName}${parsed.data.environment === 'sandbox' ? ' (Sandbox)' : ''}`.trim()

  const { error: insertError } = await db.from('integrations').insert({
    id: integrationId,
    organization_id: organization.organizationId,
    provider_id: provider.id,
    connector_type: parsed.data.connector_type,
    name: integrationName,
    environment: parsed.data.environment,
    status: 'disconnected',
    sync_enabled: parsed.data.sync_enabled ?? false,
    sync_frequency: parsed.data.sync_frequency ?? 'daily',
    created_by: user.id,
  })

  if (insertError) {
    return { error: 'No se pudo crear la integración. ' + insertError.message }
  }

  // 7. Cifrar y guardar secretos en integration_secrets
  for (const [secretType, plaintext] of Object.entries(parsed.data.secrets as Record<string, string>)) {
    if (!plaintext) continue

    let ciphertextHex: string
    try {
      const { hex } = encryptSecret(plaintext)
      ciphertextHex = formatHexForPostgres(hex)
    } catch {
      // Si el cifrado falla, eliminar la integración recién creada (consistencia)
      await db.from('integrations').delete().eq('id', integrationId)
      return { error: 'Error al cifrar las credenciales. Verifica la configuración del servidor.' }
    }

    const { error: secretError } = await db.from('integration_secrets').insert({
      integration_id: integrationId,
      organization_id: organization.organizationId,
      secret_type: secretType,
      secret_ciphertext: ciphertextHex,
    })

    if (secretError) {
      await db.from('integrations').delete().eq('id', integrationId)
      return { error: 'No se pudo guardar las credenciales cifradas.' }
    }
  }

  revalidatePath('/integraciones')

  return { error: null, integrationId }
}
