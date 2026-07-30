'use server'

import 'server-only'

import { revalidatePath } from 'next/cache'

import { createClient } from '@/lib/supabase/server'
import { getCurrentOrganization } from '@/lib/supabase/queries/organizations'
import {
  importDomainFromResourceSchema,
  type ImportDomainFromResourceInput,
} from '@/features/integrations/schemas/integration-schema'

type ActionResult = { error: string | null; domainId?: string }

const ALLOWED_ROLES = ['owner', 'admin', 'manager'] as const

/**
 * Crea un dominio local a partir de un recurso externo y los vincula.
 *
 * Reglas:
 * - El clientId es obligatorio (la tabla domains tiene client_id NOT NULL).
 * - No sobrescribe campos internos (notas, precios, relaciones) si el dominio ya existe.
 * - No elimina ni modifica el recurso externo más allá de actualizar local_resource_id.
 * - No inventa datos que GoDaddy no proporciona (costes, hosting, correo).
 */
export async function importDomainFromResource(
  input: ImportDomainFromResourceInput,
): Promise<ActionResult> {
  const parsed = importDomainFromResourceSchema.safeParse(input)
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? 'Datos no válidos.' }
  }

  const organization = await getCurrentOrganization()
  if (!organization) return { error: 'No perteneces a ninguna organización.' }
  if (!(ALLOWED_ROLES as readonly string[]).includes(organization.role)) {
    return { error: 'No tienes permiso para importar dominios.' }
  }

  const supabase = await createClient()
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const db = supabase as any

  // Verificar que el recurso externo pertenece a la organización
  const { data: resource } = await db
    .from('external_resources')
    .select('id, external_name, external_status, raw_metadata, local_resource_id')
    .eq('id', parsed.data.externalResourceId)
    .eq('organization_id', organization.organizationId)
    .maybeSingle()

  if (!resource) return { error: 'Recurso externo no encontrado.' }
  if (resource.local_resource_id) {
    return { error: 'Este recurso ya está vinculado a un dominio local.' }
  }

  // Verificar que el cliente pertenece a la organización
  const { data: client } = await db
    .from('clients')
    .select('id')
    .eq('id', parsed.data.clientId)
    .eq('organization_id', organization.organizationId)
    .is('archived_at', null)
    .maybeSingle()

  if (!client) return { error: 'Cliente no encontrado.' }

  // Extraer datos del raw_metadata (normalizado por el mapper de GoDaddy)
  const meta = resource.raw_metadata as Record<string, unknown>
  const expiresOn = typeof meta.expiresOn === 'string' ? meta.expiresOn.split('T')[0] : null
  const autoRenew = typeof meta.autoRenew === 'boolean' ? meta.autoRenew : false
  const nameservers = Array.isArray(meta.nameservers)
    ? (meta.nameservers as string[]).filter((ns): ns is string => typeof ns === 'string')
    : []
  const registrarName = typeof meta.registrarName === 'string' ? meta.registrarName : null
  const registeredOn =
    typeof meta.createdAt === 'string' ? meta.createdAt.split('T')[0] : null

  // Mapear estado externo al enum de dominios
  const domainStatus = mapExternalStatusToDomain(resource.external_status)

  // Crear el dominio local con datos disponibles de GoDaddy
  const { data: newDomain, error: createError } = await db
    .from('domains')
    .insert({
      organization_id: organization.organizationId,
      client_id: parsed.data.clientId,
      project_id: parsed.data.projectId ?? null,
      domain_name: resource.external_name ?? '',
      status: domainStatus,
      registrar_name: registrarName,
      registered_on: registeredOn,
      expires_on: expiresOn,
      auto_renew: autoRenew,
      nameservers: nameservers,
      managed_by_us: false,
      notes: parsed.data.notes ?? null,
    })
    .select('id')
    .single()

  if (createError || !newDomain) {
    return { error: 'No se pudo crear el dominio local.' }
  }

  // Vincular el recurso externo al dominio recién creado
  const { error: linkError } = await db
    .from('external_resources')
    .update({
      local_resource_id: newDomain.id,
      local_resource_type: 'domain',
    })
    .eq('id', parsed.data.externalResourceId)
    .eq('organization_id', organization.organizationId)

  if (linkError) {
    // El dominio fue creado pero no vinculado — baja lógica y reportar error
    await db.from('domains').delete().eq('id', newDomain.id)
    return { error: 'No se pudo vincular el recurso al dominio creado.' }
  }

  revalidatePath('/dominios')
  revalidatePath('/integraciones')
  revalidatePath('/integraciones/recursos-sin-asignar')

  return { error: null, domainId: newDomain.id }
}

function mapExternalStatusToDomain(
  externalStatus: string | null,
): string {
  switch (externalStatus?.toLowerCase()) {
    case 'active':
      return 'active'
    case 'expired':
      return 'expired'
    case 'cancelled':
    case 'canceled':
      return 'cancelled'
    case 'transferred':
      return 'unknown'
    default:
      return 'unknown'
  }
}
