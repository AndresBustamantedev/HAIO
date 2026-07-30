'use server'

import 'server-only'

import { revalidatePath } from 'next/cache'

import { createClient } from '@/lib/supabase/server'
import { getCurrentOrganization } from '@/lib/supabase/queries/organizations'

type ActionResult = { error: string | null }

const ALLOWED_ROLES = ['owner', 'admin'] as const

export async function disableIntegration(integrationId: string): Promise<ActionResult> {
  const organization = await getCurrentOrganization()
  if (!organization) return { error: 'No perteneces a ninguna organización.' }
  if (!(ALLOWED_ROLES as readonly string[]).includes(organization.role as 'owner' | 'admin')) {
    return { error: 'Solo owners y admins pueden desactivar integraciones.' }
  }

  const supabase = await createClient()
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const db = supabase as any

  const { data: existing } = await db
    .from('integrations')
    .select('id, status')
    .eq('id', integrationId)
    .eq('organization_id', organization.organizationId)
    .is('deleted_at', null)
    .maybeSingle()

  if (!existing) return { error: 'Integración no encontrada.' }
  if (existing.status === 'disabled') return { error: 'La integración ya está desactivada.' }

  const { error } = await db
    .from('integrations')
    .update({ status: 'disabled', sync_enabled: false })
    .eq('id', integrationId)
    .eq('organization_id', organization.organizationId)

  if (error) return { error: 'No se pudo desactivar la integración.' }

  revalidatePath('/integraciones')
  revalidatePath(`/integraciones/${integrationId}`)

  return { error: null }
}

export async function enableIntegration(integrationId: string): Promise<ActionResult> {
  const organization = await getCurrentOrganization()
  if (!organization) return { error: 'No perteneces a ninguna organización.' }
  if (!(ALLOWED_ROLES as readonly string[]).includes(organization.role as 'owner' | 'admin')) {
    return { error: 'Solo owners y admins pueden reactivar integraciones.' }
  }

  const supabase = await createClient()
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const db = supabase as any

  const { data: existing } = await db
    .from('integrations')
    .select('id, status')
    .eq('id', integrationId)
    .eq('organization_id', organization.organizationId)
    .is('deleted_at', null)
    .maybeSingle()

  if (!existing) return { error: 'Integración no encontrada.' }
  if (existing.status !== 'disabled') return { error: 'La integración no está desactivada.' }

  const { error } = await db
    .from('integrations')
    .update({ status: 'disconnected' })
    .eq('id', integrationId)
    .eq('organization_id', organization.organizationId)

  if (error) return { error: 'No se pudo reactivar la integración.' }

  revalidatePath('/integraciones')
  revalidatePath(`/integraciones/${integrationId}`)

  return { error: null }
}
