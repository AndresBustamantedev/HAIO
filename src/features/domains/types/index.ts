import type { Database } from "@/types/database.types"

export type Domain = Database["public"]["Tables"]["domains"]["Row"]
export type DomainStatus = Database["public"]["Enums"]["domain_status"]

export type DomainWithClient = Domain & {
  clients: Pick<Database["public"]["Tables"]["clients"]["Row"], "id" | "display_name"> | null
}

export type ProjectOption = { id: string; name: string; client_id: string }

export type { ClientOption } from "@/lib/supabase/queries/client-options"
