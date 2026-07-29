import "server-only"

import { createClient } from "@/lib/supabase/server"
import type { ProviderAccountWithProvider } from "@/features/providers/types"

export async function getProviderAccounts(params: {
  organizationId: string
  providerId?: string
  search?: string
}): Promise<ProviderAccountWithProvider[]> {
  const supabase = await createClient()

  let query = supabase
    .from("provider_accounts")
    .select("*, providers(id, name, category)")
    .eq("organization_id", params.organizationId)
    .is("deleted_at", null)

  if (params.providerId) {
    query = query.eq("provider_id", params.providerId)
  }

  if (params.search) {
    const term = params.search.replace(/[%_]/g, "")
    query = query.ilike("label", `%${term}%`)
  }

  const { data, error } = await query.order("label", { ascending: true })

  if (error) throw new Error(error.message)

  return (data as ProviderAccountWithProvider[]) ?? []
}

// Returns lightweight options for selects
export type ProviderAccountOption = {
  id: string
  label: string
  provider_name: string
}

export async function getProviderAccountOptions(organizationId: string): Promise<ProviderAccountOption[]> {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from("provider_accounts")
    .select("id, label, providers(name)")
    .eq("organization_id", organizationId)
    .is("deleted_at", null)
    .order("label", { ascending: true })

  if (error || !data) return []

  return data.map((row) => ({
    id: row.id,
    label: row.label,
    provider_name: (row.providers as { name: string } | null)?.name ?? "—",
  }))
}
