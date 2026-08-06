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
type LocalResourceType = 'domain' | 'project' | 'client'

const ALLOWED_ROLES = ['owner', 'admin', 'manager'] as const

async function verifyLocalResource(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  db: any,
  type: LocalResourceType,
  id: string,
  organizationId: string,
): Promise<boolean> {
  const tableMap: Record<LocalResourceType, string> = {
    domain: 'domains',
    project: 'projects',
    client: 'clients',
  }
  const { data } = await db
    .from(tableMap[type])
    .select('id')
    .eq('id', id)
    .eq('organization_id', organizationId)
    .is('deleted_at', null)
    .maybeSingle()
  return !!data
}

function mapExternalStatusToDomain(externalStatus: string | null): string {
  switch (externalStatus?.toLowerCase()) {
    case 'active': return 'active'
    case 'expired': return 'expired'
    case 'cancelled':
    case 'canceled': return 'cancelled'
    default: return 'unknown'
  }
}

async function syncDomainToLocalTable(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  db: any,
  organizationId: string,
  resource: {
    external_name: string
    external_status: string | null
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    raw_metadata: Record<string, any> | null
  },
  localResourceType: 'project' | 'client',
  localResourceId: string,
): Promise<void> {
  const meta = (resource.raw_metadata ?? {}) as Record<string, unknown>
  const expiresOn = typeof meta.expiresOn === 'string' ? meta.expiresOn.split('T')[0] : null
  const autoRenew = typeof meta.autoRenew === 'boolean' ? meta.autoRenew : false
  const nameservers = Array.isArray(meta.nameservers)
    ? (meta.nameservers as string[]).filter((ns): ns is string => typeof ns === 'string')
    : []
  const registrarName = typeof meta.registrarName === 'string' ? meta.registrarName : null
  const registeredOn = typeof meta.createdAt === 'string' ? meta.createdAt.split('T')[0] : null
  const domainStatus = mapExternalStatusToDomain(resource.external_status)

  // Check if a domains row already exists for this domain name in this org
  const { data: existing } = await db
    .from('domains')
    .select('id')
    .eq('organization_id', organizationId)
    .eq('domain_name', resource.external_name)
    .is('deleted_at', null)
    .maybeSingle()

  if (existing) {
    const update =
      localResourceType === 'project'
        ? { project_id: localResourceId }
        : { client_id: localResourceId }
    await db.from('domains').update(update).eq('id', existing.id)
  } else if (localResourceType === 'project') {
    // Auto-create: need client_id from the project (client_id is NOT NULL in domains)
    const { data: project } = await db
      .from('projects')
      .select('client_id')
      .eq('id', localResourceId)
      .single()
    if (!project?.client_id) return
    await db.from('domains').insert({
      organization_id: organizationId,
      client_id: project.client_id,
      project_id: localResourceId,
      domain_name: resource.external_name,
      status: domainStatus,
      registrar_name: registrarName,
      registered_on: registeredOn,
      expires_on: expiresOn,
      auto_renew: autoRenew,
      nameservers,
      managed_by_us: false,
    })
  } else {
    // Auto-create for client
    await db.from('domains').insert({
      organization_id: organizationId,
      client_id: localResourceId,
      project_id: null,
      domain_name: resource.external_name,
      status: domainStatus,
      registrar_name: registrarName,
      registered_on: registeredOn,
      expires_on: expiresOn,
      auto_renew: autoRenew,
      nameservers,
      managed_by_us: false,
    })
  }
}

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

  // Fetch with domain fields for potential sync to domains table
  const { data: resource } = await db
    .from('external_resources')
    .select('id, integration_id, external_resource_type, external_name, external_status, raw_metadata')
    .eq('id', parsed.data.externalResourceId)
    .eq('organization_id', organization.organizationId)
    .maybeSingle()

  if (!resource) return { error: 'Recurso externo no encontrado.' }

  // Verificar que el recurso local pertenece a la organización
  const localVerified = await verifyLocalResource(
    db,
    parsed.data.localResourceType,
    parsed.data.localResourceId,
    organization.organizationId,
  )
  if (!localVerified) {
    const labels: Record<string, string> = { domain: 'Dominio', project: 'Proyecto', client: 'Cliente' }
    return { error: `${labels[parsed.data.localResourceType] ?? 'Recurso'} local no encontrado.` }
  }

  const { error } = await db
    .from('external_resources')
    .update({
      local_resource_id: parsed.data.localResourceId,
      local_resource_type: parsed.data.localResourceType,
    })
    .eq('id', parsed.data.externalResourceId)
    .eq('organization_id', organization.organizationId)

  if (error) return { error: 'No se pudo vincular el recurso.' }

  // When linking an external domain to a project or client, also create/update
  // the corresponding domains row so it appears in project/client infrastructure views.
  if (
    resource.external_resource_type === 'domain' &&
    resource.external_name &&
    (parsed.data.localResourceType === 'project' || parsed.data.localResourceType === 'client')
  ) {
    await syncDomainToLocalTable(
      db,
      organization.organizationId,
      resource,
      parsed.data.localResourceType,
      parsed.data.localResourceId,
    )
  }

  revalidatePath('/integraciones')
  revalidatePath('/integraciones/recursos-sin-asignar')
  if (parsed.data.localResourceType === 'project') {
    revalidatePath(`/proyectos/${parsed.data.localResourceId}`)
  } else if (parsed.data.localResourceType === 'client') {
    revalidatePath(`/clientes/${parsed.data.localResourceId}`)
  }

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
