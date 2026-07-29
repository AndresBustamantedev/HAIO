import Link from "next/link"

import { DataTable, type DataTableColumn } from "@/components/tables/data-table"
import { StatusBadge } from "@/components/common/status-badge"
import { PaymentRowActions } from "@/features/payments/components/payment-row-actions"
import { getPaymentMethodLabel, getPaymentStatusBadge } from "@/features/payments/utils/labels"
import type { ClientOption, PaymentWithRelations } from "@/features/payments/types"
import type { InvoiceOption } from "@/features/payments/queries/get-invoice-options"

function formatDate(value: string | null) {
  if (!value) return "—"
  return new Intl.DateTimeFormat("es-ES", { day: "2-digit", month: "short", year: "numeric" }).format(
    new Date(value)
  )
}

function formatCurrency(value: number, currency: string) {
  return new Intl.NumberFormat("es-ES", { style: "currency", currency }).format(value)
}

function buildColumns(): DataTableColumn<PaymentWithRelations>[] {
  return [
    {
      key: "paid_at",
      header: "Fecha",
      cell: (payment) => <span className="text-foreground">{formatDate(payment.paid_at)}</span>,
    },
    {
      key: "client",
      header: "Cliente",
      cell: (payment) =>
        payment.clients ? (
          <Link href={`/clientes/${payment.clients.id}`} className="text-muted-foreground hover:underline">
            {payment.clients.display_name}
          </Link>
        ) : (
          <span className="text-muted-foreground">—</span>
        ),
    },
    {
      key: "invoice",
      header: "Factura",
      cell: (payment) =>
        payment.invoices ? (
          <Link href={`/facturas/${payment.invoices.id}`} className="text-muted-foreground hover:underline">
            {payment.invoices.invoice_number}
          </Link>
        ) : (
          <span className="text-muted-foreground">—</span>
        ),
    },
    {
      key: "method",
      header: "Método",
      cell: (payment) => <span className="text-muted-foreground">{getPaymentMethodLabel(payment.method)}</span>,
    },
    {
      key: "status",
      header: "Estado",
      cell: (payment) => {
        const badge = getPaymentStatusBadge(payment.status)
        return <StatusBadge tone={badge.tone} label={badge.label} />
      },
    },
    {
      key: "amount",
      header: "Importe",
      cell: (payment) => (
        <span className="font-medium text-foreground">{formatCurrency(payment.amount, payment.currency_code)}</span>
      ),
    },
  ]
}

function PaymentsTable({
  payments,
  clientOptions,
  invoiceOptions,
}: {
  payments: PaymentWithRelations[]
  clientOptions: ClientOption[]
  invoiceOptions: InvoiceOption[]
}) {
  return (
    <DataTable
      columns={buildColumns()}
      rows={payments}
      getRowId={(payment) => payment.id}
      rowActions={(payment) => (
        <PaymentRowActions payment={payment} clientOptions={clientOptions} invoiceOptions={invoiceOptions} />
      )}
      emptyTitle="Todavía no hay pagos"
      emptyDescription="Registra el primer pago recibido."
    />
  )
}

export { PaymentsTable }
