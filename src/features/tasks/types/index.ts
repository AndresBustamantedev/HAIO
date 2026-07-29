import type { Database } from "@/types/database.types"

export type Task = Database["public"]["Tables"]["tasks"]["Row"]

export type TaskWithRelations = Task & {
  clients: Pick<Database["public"]["Tables"]["clients"]["Row"], "id" | "display_name"> | null
  projects: Pick<Database["public"]["Tables"]["projects"]["Row"], "id" | "name"> | null
}

export type { ClientOption, ProjectOption } from "@/lib/supabase/queries/client-options"
