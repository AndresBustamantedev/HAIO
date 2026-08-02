import { type NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { getCurrentOrganization } from '@/lib/supabase/queries/organizations'

/**
 * GET /api/integrations/search-domains?q=example
 *
 * Busca dominios locales para vincular con un recurso externo.
 * Solo devuelve id + domain_name del dominio y el nombre del cliente.
 * Requiere sesión activa.
 */
export async function GET(req: NextRequest) {
  const organization = await getCurrentOrganization()
  if (!organization) {
    return NextResponse.json({ error: 'No autenticado.' }, { status: 401 })
  }

  const q = req.nextUrl.searchParams.get('q') ?? ''

  const supabase = await createClient()
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const db = supabase as any

  let query = db
    .from('domains')
    .select('id, domain_name, clients(display_name)')
    .eq('organization_id', organization.organizationId)
    .is('deleted_at', null)
    .order('domain_name')
    .limit(20)

  if (q.length >= 2) {
    query = query.ilike('domain_name', `%${q}%`)
  }

  const { data, error } = await query

  if (error) {
    return NextResponse.json({ error: 'Error al buscar dominios.' }, { status: 500 })
  }

  const domains = (data ?? []).map((row: Record<string, unknown>) => {
    const client = row.clients as { display_name?: string } | null
    return {
      id: row.id,
      domain_name: row.domain_name,
      client_name: client?.display_name ?? null,
    }
  })

  return NextResponse.json({ domains })
}
