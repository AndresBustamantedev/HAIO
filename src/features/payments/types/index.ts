import type { Database } from "@/types/database.types"

export type Payment = Database["public"]["Tables"]["payments"]["Row"]

export type PaymentWithRelations = Payment & {
  clients: Pick<Database["public"]["Tables"]["clients"]["Row"], "id" | "display_name"> | null
  invoices: Pick<Database["public"]["Tables"]["invoices"]["Row"], "id" | "invoice_number"> | null
}

export type { ClientOption } from "@/lib/supabase/queries/client-options"
