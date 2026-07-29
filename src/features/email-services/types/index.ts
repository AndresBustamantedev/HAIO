import type { Database } from "@/types/database.types"

export type EmailService = Database["public"]["Tables"]["email_services"]["Row"]

export type EmailServiceWithClient = EmailService & {
  clients: Pick<Database["public"]["Tables"]["clients"]["Row"], "id" | "display_name"> | null
}

export type { ClientOption } from "@/lib/supabase/queries/client-options"
