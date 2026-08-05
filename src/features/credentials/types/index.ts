import type { Database } from "@/types/database.types"

export type Credential = Database["public"]["Tables"]["credentials"]["Row"]

export type CredentialWithClient = Credential & {
  clients: Pick<Database["public"]["Tables"]["clients"]["Row"], "id" | "display_name"> | null
}

// Safe credential type from v_credentials_safe view (no secret_ciphertext).
// Use this for all listings — never query the raw credentials table for lists.
export type CredentialSafe = Database["public"]["Views"]["v_credentials_safe"]["Row"]

export type CredentialSafeWithClient = CredentialSafe & {
  clients: Pick<Database["public"]["Tables"]["clients"]["Row"], "id" | "display_name"> | null
  project_ids?: string[]
}

export type { ClientOption } from "@/lib/supabase/queries/client-options"
