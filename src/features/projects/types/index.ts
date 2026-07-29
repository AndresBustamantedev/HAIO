import type { Database } from "@/types/database.types"

export type Project = Database["public"]["Tables"]["projects"]["Row"]
export type ProjectStatus = Database["public"]["Enums"]["project_status"]
export type ProjectType = Database["public"]["Enums"]["project_type"]

export type ProjectWithClient = Project & {
  clients: Pick<Database["public"]["Tables"]["clients"]["Row"], "id" | "display_name"> | null
}

export type { ClientOption } from "@/lib/supabase/queries/client-options"
