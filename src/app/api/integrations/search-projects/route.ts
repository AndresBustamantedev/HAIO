import { type NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { getCurrentOrganization } from '@/lib/supabase/queries/organizations'

export async function GET(req: NextRequest) {
  const organization = await getCurrentOrganization()
  if (!organization) {
    return NextResponse.json({ error: 'No autenticado.' }, { status: 401 })
  }

  const q = req.nextUrl.searchParams.get('q') ?? ''
  const clientId = req.nextUrl.searchParams.get('client_id')
  const supabase = await createClient()

  let query = supabase
    .from('projects')
    .select('id, name, clients(display_name)')
    .eq('organization_id', organization.organizationId)
    .is('deleted_at', null)
    .order('name')
    .limit(20)

  if (q.length >= 2) {
    query = query.ilike('name', `%${q}%`)
  }
  if (clientId) {
    query = query.eq('client_id', clientId)
  }

  const { data, error } = await query
  if (error) {
    return NextResponse.json({ error: 'Error al buscar proyectos.' }, { status: 500 })
  }

  const projects = (data ?? []).map((row) => {
    const client = row.clients as { display_name?: string } | null
    return {
      id: row.id,
      name: row.name,
      client_name: client?.display_name ?? null,
    }
  })

  return NextResponse.json({ projects })
}
