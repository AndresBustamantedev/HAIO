'use server'

import 'server-only'

import { getCurrentOrganization } from '@/lib/supabase/queries/organizations'
import { getConnector } from '@/features/integrations/connectors/registry'
import {
  preTestConnectionSchema,
  type PreTestConnectionInput,
} from '@/features/integrations/schemas/integration-schema'

type ActionResult = { error: string | null; success?: boolean; userMessage?: string }

const ALLOWED_ROLES = ['owner', 'admin', 'manager'] as const

/**
 * Prueba las credenciales antes de guardarlas.
 * Los secretos se reciben en texto plano y NUNCA se persisten.
 * No se almacena nada en base de datos.
 */
export async function preTestConnection(input: PreTestConnectionInput): Promise<ActionResult> {
  const parsed = preTestConnectionSchema.safeParse(input)
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? 'Datos no válidos.' }
  }

  const organization = await getCurrentOrganization()
  if (!organization) return { error: 'No perteneces a ninguna organización.' }
  if (!(ALLOWED_ROLES as readonly string[]).includes(organization.role)) {
    return { error: 'No tienes permiso para probar conexiones.' }
  }

  let connector
  try {
    connector = getConnector(parsed.data.connector_type)
  } catch {
    return { error: 'Tipo de conector no reconocido.' }
  }

  const secretsMap = new Map(Object.entries(parsed.data.secrets))

  try {
    const result = await connector.testConnection(secretsMap, parsed.data.environment)
    if (result.success) {
      return { error: null, success: true, userMessage: 'Conexión verificada correctamente.' }
    }
    return {
      error: result.error.userMessage,
      success: false,
      userMessage: result.error.userMessage,
    }
  } catch {
    return { error: 'Error inesperado al probar la conexión.' }
  }
}
