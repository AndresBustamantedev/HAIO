import type { Database } from "@/types/database.types"

export type Subscription = Database["public"]["Tables"]["subscriptions"]["Row"]

export type SubscriptionWithRelations = Subscription & {
  clients: Pick<Database["public"]["Tables"]["clients"]["Row"], "id" | "display_name"> | null
  services: Pick<Database["public"]["Tables"]["services"]["Row"], "id" | "name"> | null
}

export type { ClientOption } from "@/lib/supabase/queries/client-options"
export type { ServiceOption } from "@/features/services/queries/get-service-options"
