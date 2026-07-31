'use server'

import 'server-only'

import { revalidatePath } from 'next/cache'

import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { getCurrentOrganization } from '@/lib/supabase/queries/organizations'
import { getConnectorMeta } from '@/features/integrations/connectors/registry'
import { encryptSecret, formatHexForPostgres } from '@/features/integrations/services/encryption'
import {
  rotateCredentialsSchema,
  type RotateCredentialsInput,
} from '@/features/integrations/schemas/integration-schema'

type ActionResult = { error: string | null }

const ALLOWED_ROLES = ['owner', 'admin', 'manager'] as const

/**
 * Reemplaza los secretos cifrados de una integración.
 * Valida sesión + org + rol + pertenencia de la integración.
 * Usa createAdminClient() solo para el INSERT/UPDATE en integration_secrets.
 * Los nuevos secretos se reciben en texto plano y se cifran inmediatamente.
 */
export async function rotateIntegrationCredentials(
  integrationId: string,
  input: RotateCredentialsInput,
): Promise<ActionResult> {
  const parsed = rotateCredentialsSchema.safeParse(input)
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? 'Datos no válidos.' }
  }

  const organization = await getCurrentOrganization()
  if (!organization) return { error: 'No perteneces a ninguna organización.' }
  if (!(ALLOWED_ROLES as readonly string[]).includes(organization.role)) {
    return { error: 'No tienes permiso para rotar credenciales.' }
  }

  // Verificar que la integración pertenece a la organización
  const supabase = await createClient()
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const db = supabase as any

  const { data: integration } = await db
    .from('integrations')
    .select('id, connector_type, organization_id')
    .eq('id', integrationId)
    .eq('organization_id', organization.organizationId)
    .is('deleted_at', null)
    .maybeSingle()

  if (!integration) return { error: 'Integración no encontrada.' }

  // Validar que los tipos de secreto son los permitidos para este conector
  const connectorMeta = getConnectorMeta(integration.connector_type)
  if (!connectorMeta) return { error: 'Tipo de conector desconocido.' }

  const allowedSecretTypes = new Set(connectorMeta.requiredSecrets.map((s) => s.type))
  for (const secretType of Object.keys(parsed.data.secrets)) {
    if (!allowedSecretTypes.has(secretType)) {
      return { error: `Tipo de secreto no permitido: ${secretType}` }
    }
  }

  // Cifrar y guardar — usa admin client tras validar arriba
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const adminDb = createAdminClient() as any

  for (const [secretType, plaintext] of Object.entries(parsed.data.secrets)) {
    if (!plaintext.trim()) {
      // Valor vacío: borrar el secret opcional (si existe) en lugar de guardarlo
      const secretDef = connectorMeta.requiredSecrets.find((s) => s.type === secretType)
      if (secretDef?.optional) {
        await adminDb
          .from('integration_secrets')
          .delete()
          .eq('integration_id', integrationId)
          .eq('secret_type', secretType)
      }
      continue
    }

    let ciphertextHex: string
    try {
      const { hex } = encryptSecret(plaintext.trim())
      ciphertextHex = formatHexForPostgres(hex)
    } catch {
      return { error: 'Error al cifrar las credenciales.' }
    }

    const { error: upsertError } = await adminDb.from('integration_secrets').upsert(
      {
        integration_id: integrationId,
        organization_id: organization.organizationId,
        secret_type: secretType,
        secret_ciphertext: ciphertextHex,
        last_rotated_at: new Date().toISOString(),
      },
      { onConflict: 'integration_id,secret_type' },
    )

    if (upsertError) {
      return { error: 'No se pudo actualizar las credenciales.' }
    }
  }

  // Marcar la integración como disconnected para forzar re-test
  await db
    .from('integrations')
    .update({ status: 'disconnected' })
    .eq('id', integrationId)
    .eq('organization_id', organization.organizationId)

  revalidatePath(`/integraciones/${integrationId}`)

  return { error: null }
}
