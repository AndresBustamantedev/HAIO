'use server'

import 'server-only'

import { revalidatePath } from 'next/cache'

import { createClient } from '@/lib/supabase/server'
import { getCurrentOrganization } from '@/lib/supabase/queries/organizations'
import {
  linkExternalResourceSchema,
  unlinkExternalResourceSchema,
  type LinkExternalResourceInput,
  type UnlinkExternalResourceInput,
} from '@/features/integrations/schemas/integration-schema'

type ActionResult = { error: string | null }

const ALLOWED_ROLES = ['owner', 'admin', 'manager'] as const

/**
 * Vincula un recurso externo a un dominio local existente.
 * Ambas entidades deben pertenecer a la misma organización.
 */
export async function linkExternalResource(
  input: LinkExternalResourceInput,
): Promise<ActionResult> {
  const parsed = linkExternalResourceSchema.safeParse(input)
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? 'Datos no válidos.' }
  }

  const organization = await getCurrentOrganization()
  if (!organization) return { error: 'No perteneces a ninguna organización.' }
  if (!(ALLOWED_ROLES as readonly string[]).includes(organization.role)) {
    return { error: 'No tienes permiso para vincular recursos.' }
  }

  const supabase = await createClient()
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const db = supabase as any

  // Verificar que el recurso externo pertenece a la organización
  const { data: resource } = await db
    .from('external_resources')
    .select('id, integration_id')
    .eq('id', parsed.data.externalResourceId)
    .eq('organization_id', organization.organizationId)
    .maybeSingle()

  if (!resource) return { error: 'Recurso externo no encontrado.' }

  // Verificar que el dominio local pertenece a la organización
  const { data: domain } = await db
    .from('domains')
    .select('id')
    .eq('id', parsed.data.localResourceId)
    .eq('organization_id', organization.organizationId)
    .is('deleted_at', null)
    .maybeSingle()

  if (!domain) return { error: 'Dominio local no encontrado.' }

  const { error } = await db
    .from('external_resources')
    .update({
      local_resource_id: parsed.data.localResourceId,
      local_resource_type: parsed.data.localResourceType,
    })
    .eq('id', parsed.data.externalResourceId)
    .eq('organization_id', organization.organizationId)

  if (error) return { error: 'No se pudo vincular el recurso.' }

  revalidatePath('/integraciones')
  revalidatePath('/integraciones/recursos-sin-asignar')

  return { error: null }
}

/**
 * Desvincula un recurso externo de su dominio local.
 * No elimina ninguna entidad.
 */
export async function unlinkExternalResource(
  input: UnlinkExternalResourceInput,
): Promise<ActionResult> {
  const parsed = unlinkExternalResourceSchema.safeParse(input)
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? 'Datos no válidos.' }
  }

  const organization = await getCurrentOrganization()
  if (!organization) return { error: 'No perteneces a ninguna organización.' }
  if (!(ALLOWED_ROLES as readonly string[]).includes(organization.role)) {
    return { error: 'No tienes permiso para desvincular recursos.' }
  }

  const supabase = await createClient()
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const db = supabase as any

  const { error } = await db
    .from('external_resources')
    .update({ local_resource_id: null, local_resource_type: null })
    .eq('id', parsed.data.externalResourceId)
    .eq('organization_id', organization.organizationId)

  if (error) return { error: 'No se pudo desvincular el recurso.' }

  revalidatePath('/integraciones')
  revalidatePath('/integraciones/recursos-sin-asignar')

  return { error: null }
}
