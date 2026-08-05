import "server-only"

import { createClient } from "@/lib/supabase/server"
import type { CredentialSafeWithClient } from "@/features/credentials/types"

export type GetCredentialsParams = {
  organizationId: string
  search?: string
  type?: string
  clientId?: string
  page?: number
  pageSize?: number
}

export type GetCredentialsResult = {
  credentials: CredentialSafeWithClient[]
  total: number
  page: number
  pageSize: number
}

/**
 * Paginated, filtered credential list.
 * Uses v_credentials_safe — never exposes secret_ciphertext.
 */
export async function getCredentials(params: GetCredentialsParams): Promise<GetCredentialsResult> {
  const supabase = await createClient()
  const page = Math.max(1, params.page ?? 1)
  const pageSize = params.pageSize ?? 20

  let query = supabase
    .from("v_credentials_safe")
    .select("*, clients(id, display_name)", { count: "exact" })
    .eq("organization_id", params.organizationId)
    .is("deleted_at", null)

  if (params.search) {
    const term = params.search.replace(/[%_]/g, "")
    query = query.or(`label.ilike.%${term}%,username.ilike.%${term}%`)
  }

  if (params.type) {
    query = query.eq("type", params.type as never)
  }

  if (params.clientId === "internas") {
    query = query.is("client_id", null)
  } else if (params.clientId) {
    query = query.eq("client_id", params.clientId)
  }

  const from = (page - 1) * pageSize
  const to = from + pageSize - 1

  const { data, count, error } = await query.order("label", { ascending: true }).range(from, to)

  if (error) {
    throw new Error(error.message)
  }

  return {
    credentials: (data as CredentialSafeWithClient[]) ?? [],
    total: count ?? 0,
    page,
    pageSize,
  }
}
