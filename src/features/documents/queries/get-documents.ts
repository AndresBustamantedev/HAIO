import "server-only"

import { createClient } from "@/lib/supabase/server"
import type { DocumentWithClient } from "@/features/documents/types"

export type GetDocumentsParams = {
  organizationId: string
  search?: string
  category?: string
  clientId?: string
  page?: number
  pageSize?: number
}

export type GetDocumentsResult = {
  documents: DocumentWithClient[]
  total: number
  page: number
  pageSize: number
}

/** Paginated, filtered document list — all resolved server-side. */
export async function getDocuments(params: GetDocumentsParams): Promise<GetDocumentsResult> {
  const supabase = await createClient()
  const page = Math.max(1, params.page ?? 1)
  const pageSize = params.pageSize ?? 20

  let query = supabase
    .from("documents")
    .select("*, clients(id, display_name)", { count: "exact" })
    .eq("organization_id", params.organizationId)
    .is("deleted_at", null)

  if (params.search) {
    const term = params.search.replace(/[%_]/g, "")
    query = query.ilike("title", `%${term}%`)
  }

  if (params.category) {
    query = query.eq("category", params.category as DocumentWithClient["category"])
  }

  if (params.clientId) {
    query = query.eq("client_id", params.clientId)
  }

  const from = (page - 1) * pageSize
  const to = from + pageSize - 1

  const { data, count, error } = await query.order("created_at", { ascending: false }).range(from, to)

  if (error) {
    throw new Error(error.message)
  }

  return {
    documents: (data as DocumentWithClient[]) ?? [],
    total: count ?? 0,
    page,
    pageSize,
  }
}
