import "server-only"

import type { SupabaseClient } from "@supabase/supabase-js"
import type { Database } from "@/types/database.types"

/**
 * Generates the next document number for an organization ("PRES-2026-0001",
 * "FAC-2026-0001", ...) via the transactional `next_sequence_value` RPC —
 * shared by every module that issues numbered documents (quotes, invoices).
 */
export async function nextDocumentNumber(
  supabase: SupabaseClient<Database>,
  organizationId: string,
  seqType: string,
  prefix: string
): Promise<string> {
  const year = new Date().getFullYear()
  const { data, error } = await supabase.rpc("next_sequence_value", {
    org_id: organizationId,
    seq_type: seqType,
    seq_year: year,
  })

  if (error) {
    throw new Error(error.message)
  }

  return `${prefix}-${year}-${String(data).padStart(4, "0")}`
}
