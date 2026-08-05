import { type NextRequest } from "next/server"

import { createClient } from "@/lib/supabase/server"
import { getCurrentOrganization } from "@/lib/supabase/queries/organizations"

export async function GET(req: NextRequest) {
  const q = req.nextUrl.searchParams.get("q")?.trim()
  if (!q || q.length < 2) {
    return Response.json({ clients: [], projects: [], invoices: [] })
  }

  const organization = await getCurrentOrganization()
  if (!organization) return new Response("Unauthorized", { status: 401 })

  const orgId = organization.organizationId
  const supabase = await createClient()
  const like = `%${q}%`

  const [clientsRes, projectsRes, invoicesRes] = await Promise.all([
    supabase
      .from("clients")
      .select("id, display_name, email, status")
      .eq("organization_id", orgId)
      .is("deleted_at", null)
      .or(`display_name.ilike.${like},legal_name.ilike.${like},email.ilike.${like},tax_id.ilike.${like}`)
      .order("display_name")
      .limit(5),

    supabase
      .from("projects")
      .select("id, name, status, clients(display_name)")
      .eq("organization_id", orgId)
      .is("deleted_at", null)
      .ilike("name", like)
      .order("name")
      .limit(5),

    supabase
      .from("invoices")
      .select("id, invoice_number, status, total, currency_code, clients(display_name)")
      .eq("organization_id", orgId)
      .ilike("invoice_number", like)
      .order("invoice_number")
      .limit(5),
  ])

  return Response.json({
    clients: (clientsRes.data ?? []).map((c) => ({
      id: c.id,
      display_name: c.display_name,
      email: c.email,
    })),
    projects: (projectsRes.data ?? []).map((p) => ({
      id: p.id,
      name: p.name,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      client_name: (p.clients as any)?.display_name ?? null,
    })),
    invoices: (invoicesRes.data ?? []).map((i) => ({
      id: i.id,
      invoice_number: i.invoice_number,
      total: i.total,
      currency_code: i.currency_code,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      client_name: (i.clients as any)?.display_name ?? null,
    })),
  })
}
