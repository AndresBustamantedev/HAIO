import Link from "next/link"

import { DataTable, type DataTableColumn } from "@/components/tables/data-table"
import { StatusBadge } from "@/components/common/status-badge"
import { QuoteRowActions } from "@/features/quotes/components/quote-row-actions"
import { getQuoteStatusBadge } from "@/features/quotes/utils/status"
import type { QuoteWithClient } from "@/features/quotes/types"

function formatDate(value: string | null) {
  if (!value) return "—"
  return new Intl.DateTimeFormat("es-ES", { day: "2-digit", month: "short", year: "numeric" }).format(
    new Date(value)
  )
}

function formatCurrency(value: number, currency: string) {
  return new Intl.NumberFormat("es-ES", { style: "currency", currency }).format(value)
}

const columns: DataTableColumn<QuoteWithClient>[] = [
  {
    key: "quote_number",
    header: "Presupuesto",
    cell: (quote) => (
      <Link href={`/presupuestos/${quote.id}`} className="font-medium text-foreground hover:underline">
        {quote.quote_number}
      </Link>
    ),
  },
  {
    key: "client",
    header: "Cliente",
    cell: (quote) =>
      quote.clients ? (
        <Link href={`/clientes/${quote.clients.id}`} className="text-muted-foreground hover:underline">
          {quote.clients.display_name}
        </Link>
      ) : (
        <span className="text-muted-foreground">—</span>
      ),
  },
  {
    key: "status",
    header: "Estado",
    cell: (quote) => {
      const badge = getQuoteStatusBadge(quote.status)
      return <StatusBadge tone={badge.tone} label={badge.label} />
    },
  },
  {
    key: "total",
    header: "Total",
    cell: (quote) => <span className="text-muted-foreground">{formatCurrency(quote.total, quote.currency_code)}</span>,
  },
  {
    key: "valid_until",
    header: "Válido hasta",
    cell: (quote) => <span className="text-muted-foreground">{formatDate(quote.valid_until)}</span>,
  },
]

function QuotesTable({ quotes }: { quotes: QuoteWithClient[] }) {
  return (
    <DataTable
      columns={columns}
      rows={quotes}
      getRowId={(quote) => quote.id}
      rowActions={(quote) => <QuoteRowActions quote={quote} />}
      emptyTitle="Todavía no hay presupuestos"
      emptyDescription="Crea el primer presupuesto para un cliente."
    />
  )
}

export { QuotesTable }
