import "server-only"

import { createAdminClient } from "@/lib/supabase/admin"
import type { InvoicePDFData } from "./invoice-pdf"

export async function getInvoicePDFData(invoiceId: string): Promise<InvoicePDFData | null> {
  const db = createAdminClient()

  const { data: inv } = await db
    .from("invoices")
    .select(`
      invoice_number, status, issue_date, due_date, currency_code,
      subtotal, tax_amount, discount_amount, total, amount_paid, amount_due,
      notes, organization_id,
      clients(display_name, legal_name, tax_id, email, phone, city)
    `)
    .eq("id", invoiceId)
    .maybeSingle()

  if (!inv) return null

  const [{ data: items }, { data: org }] = await Promise.all([
    db
      .from("invoice_items")
      .select("description, quantity, unit_price, tax_rate, discount_percent, line_total")
      .eq("invoice_id", invoiceId)
      .order("position"),
    db
      .from("organizations")
      .select("name, legal_name, tax_id, email, phone, address_line_1, city, postal_code")
      .eq("id", inv.organization_id)
      .maybeSingle(),
  ])

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const client = (inv.clients as any) ?? {}

  return {
    org: {
      name: org?.name ?? "HAIO",
      legal_name: org?.legal_name ?? null,
      tax_id: org?.tax_id ?? null,
      email: org?.email ?? null,
      phone: org?.phone ?? null,
      address_line_1: org?.address_line_1 ?? null,
      city: org?.city ?? null,
      postal_code: org?.postal_code ?? null,
    },
    invoice: {
      number: inv.invoice_number ?? "",
      status: inv.status ?? "issued",
      issue_date: inv.issue_date ?? null,
      due_date: inv.due_date ?? null,
      currency: inv.currency_code ?? "EUR",
      subtotal: Number(inv.subtotal ?? 0),
      tax_amount: Number(inv.tax_amount ?? 0),
      discount_amount: Number(inv.discount_amount ?? 0),
      total: Number(inv.total ?? 0),
      amount_paid: Number(inv.amount_paid ?? 0),
      amount_due: Number(inv.amount_due ?? 0),
      notes: inv.notes ?? null,
    },
    client: {
      name: client.display_name ?? "Cliente",
      legal_name: client.legal_name ?? null,
      tax_id: client.tax_id ?? null,
      email: client.email ?? null,
      phone: client.phone ?? null,
      city: client.city ?? null,
    },
    items: (items ?? []).map((item) => ({
      description: item.description,
      quantity: Number(item.quantity),
      unit_price: Number(item.unit_price),
      tax_rate: Number(item.tax_rate),
      discount_percent: Number(item.discount_percent),
      line_total: item.line_total !== null ? Number(item.line_total) : null,
    })),
  }
}
