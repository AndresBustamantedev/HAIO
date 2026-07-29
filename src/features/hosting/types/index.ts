import type { Database } from "@/types/database.types"

export type HostingAccount = Database["public"]["Tables"]["hosting_accounts"]["Row"]
export type HostingStatus = Database["public"]["Enums"]["hosting_status"]

export type HostingWithClient = HostingAccount & {
  clients: Pick<Database["public"]["Tables"]["clients"]["Row"], "id" | "display_name"> | null
}

export type { ClientOption } from "@/lib/supabase/queries/client-options"
