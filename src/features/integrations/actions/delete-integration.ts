'use server'

import 'server-only'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'

import { createClient } from '@/lib/supabase/server'
import { getCurrentOrganization } from '@/lib/supabase/queries/organizations'

type ActionResult = { error: string | null }

const ALLOWED_ROLES = ['owner', 'admin'] as const

export async function deleteIntegration(integrationId: string): Promise<ActionResult> {
  const organization = await getCurrentOrganization()
  if (!organization) return { error: 'No perteneces a ninguna organización.' }
  if (!(ALLOWED_ROLES as readonly string[]).includes(organization.role as 'owner' | 'admin')) {
    return { error: 'Solo owners y admins pueden eliminar integraciones.' }
  }

  const supabase = await createClient()
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const db = supabase as any

  // Verificar que la integración pertenece a la organización activa
  const { data: existing } = await db
    .from('integrations')
    .select('id')
    .eq('id', integrationId)
    .eq('organization_id', organization.organizationId)
    .is('deleted_at', null)
    .maybeSingle()

  if (!existing) return { error: 'Integración no encontrada.' }

  // Baja lógica: solo marcamos deleted_at, nunca borrado físico
  const { error } = await db
    .from('integrations')
    .update({ deleted_at: new Date().toISOString(), sync_enabled: false })
    .eq('id', integrationId)
    .eq('organization_id', organization.organizationId)

  if (error) return { error: 'No se pudo eliminar la integración.' }

  revalidatePath('/integraciones')
  redirect('/integraciones')
}
