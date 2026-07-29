import "server-only"

import { createClient } from "@/lib/supabase/server"
import type { InvoiceDetail, InvoiceWithClient } from "@/features/invoices/types"

export async function getInvoiceDetail(invoiceId: string): Promise<InvoiceDetail | null> {
  const supabase = await createClient()

  const invoiceRes = await supabase
    .from("invoices")
    .select("*, clients(id, display_name)")
    .eq("id", invoiceId)
    .maybeSingle()

  if (invoiceRes.error || !invoiceRes.data) {
    return null
  }

  const [itemsRes, paymentsRes] = await Promise.all([
    supabase.from("invoice_items").select("*").eq("invoice_id", invoiceId).order("position", { ascending: true }),
    supabase.from("payments").select("*").eq("invoice_id", invoiceId).order("paid_at", { ascending: false }),
  ])

  return {
    invoice: invoiceRes.data as InvoiceWithClient,
    items: itemsRes.data ?? [],
    payments: paymentsRes.data ?? [],
  }
}
