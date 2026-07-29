import { redirect } from "next/navigation"
import { ReceiptIcon } from "lucide-react"

import { getPortalSession } from "@/lib/supabase/queries/portal"
import { createClient } from "@/lib/supabase/server"
import { StatusBadge } from "@/components/common/status-badge"
import type { StatusBadgeTone } from "@/components/common/status-badge"

function formatDate(d: string | null) {
  if (!d) return "—"
  return new Intl.DateTimeFormat("es-ES", { day: "numeric", month: "short", year: "numeric" }).format(new Date(d))
}

function formatCurrency(amount: number | null, currency = "EUR") {
  return new Intl.NumberFormat("es-ES", { style: "currency", currency }).format(Number(amount ?? 0))
}

function invoiceStatusTone(status: string | null): StatusBadgeTone {
  if (status === "paid") return "success"
  if (status === "overdue") return "destructive"
  if (status === "sent" || status === "viewed") return "info"
  if (status === "issued" || status === "partially_paid") return "warning"
  return "neutral"
}

const STATUS_LABEL: Record<string, string> = {
  draft: "Borrador", issued: "Emitida", sent: "Enviada", viewed: "Vista",
  partially_paid: "Pago parcial", paid: "Pagada", overdue: "Vencida",
  void: "Anulada", refunded: "Reembolsada",
}

export default async function PortalFacturasPage() {
  const session = await getPortalSession()
  if (!session || !session.access.can_view_invoices) redirect("/portal")

  const supabase = await createClient()
  const { data } = await supabase
    .from("v_invoice_balances")
    .select("*")
    .eq("client_id", session.access.client_id)
    .order("due_date", { ascending: false })

  const invoices = data ?? []

  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-xl font-bold text-foreground">Facturas</h1>

      {invoices.length === 0 ? (
        <div className="flex flex-col items-center justify-center gap-3 rounded-xl border bg-card py-16 text-center">
          <ReceiptIcon className="size-10 text-muted-foreground/40" />
          <p className="text-sm text-muted-foreground">No hay facturas todavía.</p>
        </div>
      ) : (
        <div className="overflow-hidden rounded-xl border bg-card">
          {invoices.map((inv, i) => (
            <div
              key={inv.invoice_id ?? i}
              className="flex flex-wrap items-center justify-between gap-3 border-b p-4 last:border-b-0"
            >
              <div className="min-w-0">
                <p className="font-medium text-foreground">{inv.invoice_number ?? "Sin número"}</p>
                <p className="text-xs text-muted-foreground">
                  Vence: {formatDate(inv.due_date)}
                </p>
              </div>
              <div className="flex items-center gap-3">
                <div className="text-right">
                  <p className="font-semibold text-foreground">
                    {formatCurrency(inv.total, inv.currency_code ?? "EUR")}
                  </p>
                  {Number(inv.amount_due ?? 0) > 0 && inv.status !== "paid" ? (
                    <p className="text-xs text-destructive">
                      Pendiente: {formatCurrency(inv.amount_due, inv.currency_code ?? "EUR")}
                    </p>
                  ) : null}
                </div>
                <StatusBadge
                  tone={invoiceStatusTone(inv.status)}
                  label={STATUS_LABEL[inv.status ?? ""] ?? inv.status ?? "—"}
                />
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
