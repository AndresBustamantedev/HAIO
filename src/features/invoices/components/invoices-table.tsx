import Link from "next/link"

import { DataTable, type DataTableColumn } from "@/components/tables/data-table"
import { StatusBadge } from "@/components/common/status-badge"
import { getInvoiceStatusBadge } from "@/features/invoices/utils/status"
import type { InvoiceWithClient } from "@/features/invoices/types"

function formatDate(value: string | null) {
  if (!value) return "—"
  return new Intl.DateTimeFormat("es-ES", { day: "2-digit", month: "short", year: "numeric" }).format(
    new Date(value)
  )
}

function formatCurrency(value: number, currency: string) {
  return new Intl.NumberFormat("es-ES", { style: "currency", currency }).format(value)
}

const columns: DataTableColumn<InvoiceWithClient>[] = [
  {
    key: "invoice_number",
    header: "Factura",
    cell: (invoice) => (
      <Link href={`/facturas/${invoice.id}`} className="font-medium text-foreground hover:underline">
        {invoice.invoice_number}
      </Link>
    ),
  },
  {
    key: "client",
    header: "Cliente",
    cell: (invoice) =>
      invoice.clients ? (
        <Link href={`/clientes/${invoice.clients.id}`} className="text-muted-foreground hover:underline">
          {invoice.clients.display_name}
        </Link>
      ) : (
        <span className="text-muted-foreground">—</span>
      ),
  },
  {
    key: "status",
    header: "Estado",
    cell: (invoice) => {
      const badge = getInvoiceStatusBadge(invoice.status)
      return <StatusBadge tone={badge.tone} label={badge.label} />
    },
  },
  {
    key: "total",
    header: "Total",
    cell: (invoice) => <span className="text-muted-foreground">{formatCurrency(invoice.total, invoice.currency_code)}</span>,
  },
  {
    key: "amount_due",
    header: "Pendiente",
    cell: (invoice) => (
      <span className={invoice.amount_due > 0 ? "font-medium text-foreground" : "text-muted-foreground"}>
        {formatCurrency(invoice.amount_due, invoice.currency_code)}
      </span>
    ),
  },
  {
    key: "due_date",
    header: "Vencimiento",
    cell: (invoice) => <span className="text-muted-foreground">{formatDate(invoice.due_date)}</span>,
  },
]

function InvoicesTable({ invoices }: { invoices: InvoiceWithClient[] }) {
  return (
    <DataTable
      columns={columns}
      rows={invoices}
      getRowId={(invoice) => invoice.id}
      emptyTitle="Todavía no hay facturas"
      emptyDescription="Crea la primera factura para un cliente."
    />
  )
}

export { InvoicesTable }
