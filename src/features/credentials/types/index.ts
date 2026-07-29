import type { Database } from "@/types/database.types"

export type Credential = Database["public"]["Tables"]["credentials"]["Row"]

export type CredentialWithClient = Credential & {
  clients: Pick<Database["public"]["Tables"]["clients"]["Row"], "id" | "display_name"> | null
}

export type { ClientOption } from "@/lib/supabase/queries/client-options"
