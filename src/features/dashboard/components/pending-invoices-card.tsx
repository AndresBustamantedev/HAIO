import Link from "next/link"
import { ReceiptTextIcon } from "lucide-react"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { EmptyState } from "@/components/common/empty-state"
import { StatusBadge } from "@/components/common/status-badge"
import { getInvoiceStatusBadge } from "@/features/invoices/utils/status"
import type { InvoiceBalance } from "@/features/dashboard/queries/get-dashboard-data"

function formatCurrency(value: number, currency: string) {
  return new Intl.NumberFormat("es-ES", { style: "currency", currency }).format(value)
}

function PendingInvoicesCard({ invoices }: { invoices: InvoiceBalance[] }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Facturas pendientes</CardTitle>
      </CardHeader>
      <CardContent>
        {invoices.length === 0 ? (
          <EmptyState
            icon={ReceiptTextIcon}
            title="Sin facturas pendientes"
            description="Todo cobrado, por ahora."
          />
        ) : (
          <ul className="flex flex-col divide-y">
            {invoices.map((invoice) => {
              const badge = invoice.status ? getInvoiceStatusBadge(invoice.status) : null

              return (
                <li key={invoice.invoice_id} className="flex items-center justify-between gap-3 py-2.5 text-sm">
                  <div className="flex min-w-0 flex-col">
                    <Link href="/facturas" className="truncate font-medium text-foreground hover:underline">
                      {invoice.invoice_number}
                    </Link>
                    <span className="truncate text-xs text-muted-foreground">
                      {invoice.client_name}
                    </span>
                  </div>
                  <div className="flex shrink-0 items-center gap-2">
                    {badge ? <StatusBadge tone={badge.tone} label={badge.label} /> : null}
                    <span className="font-medium tabular-nums">
                      {formatCurrency(invoice.amount_due ?? 0, invoice.currency_code ?? "EUR")}
                    </span>
                  </div>
                </li>
              )
            })}
          </ul>
        )}
      </CardContent>
    </Card>
  )
}

export { PendingInvoicesCard }
