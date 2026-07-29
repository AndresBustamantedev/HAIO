import type { Database } from "@/types/database.types"

export type Contact = Database["public"]["Tables"]["client_contacts"]["Row"]

export type ContactWithClient = Contact & {
  clients: Pick<Database["public"]["Tables"]["clients"]["Row"], "id" | "display_name"> | null
}

export type { ClientOption } from "@/lib/supabase/queries/client-options"
