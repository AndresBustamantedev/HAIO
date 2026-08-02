import { type NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { getCurrentOrganization } from '@/lib/supabase/queries/organizations'

export async function GET(req: NextRequest) {
  const organization = await getCurrentOrganization()
  if (!organization) {
    return NextResponse.json({ error: 'No autenticado.' }, { status: 401 })
  }

  const q = req.nextUrl.searchParams.get('q') ?? ''
  const supabase = await createClient()

  let query = supabase
    .from('clients')
    .select('id, display_name, legal_name')
    .eq('organization_id', organization.organizationId)
    .is('deleted_at', null)
    .order('display_name')
    .limit(20)

  if (q.length >= 2) {
    query = query.or(`display_name.ilike.%${q}%,legal_name.ilike.%${q}%`)
  }

  const { data, error } = await query
  if (error) {
    return NextResponse.json({ error: 'Error al buscar clientes.' }, { status: 500 })
  }

  const clients = (data ?? []).map((row) => ({
    id: row.id,
    display_name: row.display_name,
    legal_name: row.legal_name,
  }))

  return NextResponse.json({ clients })
}
