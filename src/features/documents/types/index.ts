import type { Database } from "@/types/database.types"

export type DocumentRow = Database["public"]["Tables"]["documents"]["Row"]

export type DocumentWithClient = DocumentRow & {
  clients: Pick<Database["public"]["Tables"]["clients"]["Row"], "id" | "display_name"> | null
}

export type { ClientOption } from "@/lib/supabase/queries/client-options"
export type { ProjectOption } from "@/lib/supabase/queries/client-options"

export const DOCUMENTS_BUCKET = "client-documents"
