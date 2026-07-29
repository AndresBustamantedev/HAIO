import "server-only"

import { createClient } from "@/lib/supabase/server"

export type InvoiceOption = { id: string; invoice_number: string; client_id: string; amount_due: number; currency_code: string }

/** Lightweight invoice list for the payment form's invoice selector. */
export async function getInvoiceOptions(organizationId: string): Promise<InvoiceOption[]> {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from("invoices")
    .select("id, invoice_number, client_id, amount_due, currency_code")
    .eq("organization_id", organizationId)
    .order("issue_date", { ascending: false })
    .limit(200)

  if (error) {
    throw new Error(error.message)
  }

  return data ?? []
}
