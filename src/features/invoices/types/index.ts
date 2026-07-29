import type { Database } from "@/types/database.types"

export type Invoice = Database["public"]["Tables"]["invoices"]["Row"]
export type InvoiceItem = Database["public"]["Tables"]["invoice_items"]["Row"]
export type Payment = Database["public"]["Tables"]["payments"]["Row"]

export type InvoiceWithClient = Invoice & {
  clients: Pick<Database["public"]["Tables"]["clients"]["Row"], "id" | "display_name"> | null
}

export type InvoiceDetail = {
  invoice: InvoiceWithClient
  items: InvoiceItem[]
  payments: Payment[]
}

export type { ClientOption } from "@/lib/supabase/queries/client-options"
