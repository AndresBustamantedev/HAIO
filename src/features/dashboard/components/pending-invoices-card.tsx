import Link from "next/link"
import { ArrowRightIcon, ReceiptTextIcon } from "lucide-react"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { EmptyState } from "@/components/common/empty-state"
import { StatusBadge } from "@/components/common/status-badge"
import { Button } from "@/components/ui/button"
import { getInvoiceStatusBadge } from "@/features/invoices/utils/status"
import type { InvoiceBalance } from "@/features/dashboard/queries/get-dashboard-data"

function formatCurrency(value: number, currency: string) {
  return new Intl.NumberFormat("es-ES", { style: "currency", currency }).format(value)
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat("es-ES", { day: "numeric", month: "short", year: "numeric" }).format(new Date(value))
}

function isDuePast(dateStr: string | null): boolean {
  if (!dateStr) return false
  return new Date(dateStr) < new Date()
}

function PendingInvoicesCard({ invoices }: { invoices: InvoiceBalance[] }) {
  return (
    <Card className="flex flex-col">
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-base">Facturas pendientes</CardTitle>
        <Button variant="ghost" size="sm" className="text-xs" render={<Link href="/facturas" />}>
          Ver todas
        </Button>
      </CardHeader>
      <CardContent className="flex flex-1 flex-col">
        {invoices.length === 0 ? (
          <EmptyState
            icon={ReceiptTextIcon}
            title="Sin facturas pendientes"
            description="Todo cobrado, por ahora."
          />
        ) : (
          <>
            <ul className="flex flex-1 flex-col divide-y">
              {invoices.map((invoice) => {
                const badge = invoice.status ? getInvoiceStatusBadge(invoice.status) : null
                const past = isDuePast(invoice.due_date)

                return (
                  <li key={invoice.invoice_id} className="flex items-start justify-between gap-2 py-3 text-sm">
                    <div className="flex min-w-0 flex-col gap-0.5">
                      <Link href="/facturas" className="truncate font-medium text-foreground hover:underline">
                        {invoice.invoice_number}
                      </Link>
                      <span className="truncate text-xs text-muted-foreground">
                        {invoice.client_name}
                      </span>
                      {invoice.due_date ? (
                        <span className={`text-xs ${past ? "text-destructive" : "text-muted-foreground"}`}>
                          Vence el {formatDate(invoice.due_date)}
                        </span>
                      ) : null}
                    </div>
                    <div className="flex shrink-0 flex-col items-end gap-1">
                      <span className="font-semibold tabular-nums text-foreground">
                        {formatCurrency(invoice.total ?? 0, invoice.currency_code ?? "EUR")}
                      </span>
                      {badge ? <StatusBadge tone={badge.tone} label={badge.label} /> : null}
                    </div>
                  </li>
                )
              })}
            </ul>
            <div className="border-t pt-3">
              <Link
                href="/facturas?status=pending"
                className="flex items-center gap-1 text-xs text-primary hover:underline"
              >
                Ver todas las facturas pendientes
                <ArrowRightIcon className="size-3" />
              </Link>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  )
}

export { PendingInvoicesCard }
