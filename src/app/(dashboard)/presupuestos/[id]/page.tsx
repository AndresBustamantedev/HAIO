import { notFound } from "next/navigation"
import Link from "next/link"

import { PageContainer } from "@/components/common/page-container"
import { PageHeader } from "@/components/common/page-header"
import { Breadcrumbs } from "@/components/common/breadcrumbs"
import { StatusBadge } from "@/components/common/status-badge"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { EditQuoteButton } from "@/features/quotes/components/edit-quote-button"
import { getQuoteDetail } from "@/features/quotes/queries/get-quote-detail"
import { getClientOptions, getProjectOptions } from "@/lib/supabase/queries/client-options"
import { getQuoteStatusBadge } from "@/features/quotes/utils/status"

function formatDate(value: string | null) {
  if (!value) return "—"
  return new Intl.DateTimeFormat("es-ES", { day: "2-digit", month: "short", year: "numeric" }).format(
    new Date(value)
  )
}

function formatCurrency(value: number, currency: string) {
  return new Intl.NumberFormat("es-ES", { style: "currency", currency }).format(value)
}

type PresupuestoDetailPageProps = {
  params: Promise<{ id: string }>
}

export default async function PresupuestoDetailPage({ params }: PresupuestoDetailPageProps) {
  const { id } = await params
  const detail = await getQuoteDetail(id)

  if (!detail) {
    notFound()
  }

  const { quote, items } = detail
  const badge = getQuoteStatusBadge(quote.status)
  const [clientOptions, projectOptions] = await Promise.all([
    getClientOptions(quote.organization_id),
    getProjectOptions(quote.organization_id),
  ])

  return (
    <PageContainer>
      <Breadcrumbs items={[{ label: "Presupuestos", href: "/presupuestos" }, { label: quote.quote_number }]} />

      <PageHeader
        title={quote.quote_number}
        description={
          quote.clients ? (
            <Link href={`/clientes/${quote.clients.id}`} className="hover:underline">
              {quote.clients.display_name}
            </Link>
          ) : undefined
        }
        actions={
          <div className="flex items-center gap-3">
            <StatusBadge tone={badge.tone} label={badge.label} />
            <EditQuoteButton quoteDetail={detail} clientOptions={clientOptions} projectOptions={projectOptions} />
          </div>
        }
      />

      <div className="rounded-xl border bg-card p-6">
        <p className="mb-4 text-sm font-medium text-foreground">Información general</p>
        <dl className="grid grid-cols-1 gap-4 text-sm sm:grid-cols-2 lg:grid-cols-4">
          <div>
            <dt className="text-xs text-muted-foreground">Fecha de emisión</dt>
            <dd className="text-foreground">{formatDate(quote.issue_date)}</dd>
          </div>
          <div>
            <dt className="text-xs text-muted-foreground">Válido hasta</dt>
            <dd className="text-foreground">{formatDate(quote.valid_until)}</dd>
          </div>
          <div>
            <dt className="text-xs text-muted-foreground">Subtotal</dt>
            <dd className="text-foreground">{formatCurrency(quote.subtotal, quote.currency_code)}</dd>
          </div>
          <div>
            <dt className="text-xs text-muted-foreground">Total</dt>
            <dd className="font-medium text-foreground">{formatCurrency(quote.total, quote.currency_code)}</dd>
          </div>
        </dl>
        {quote.terms ? <p className="mt-4 border-t pt-4 text-sm text-muted-foreground">{quote.terms}</p> : null}
        {quote.notes ? <p className="mt-2 text-sm text-muted-foreground">{quote.notes}</p> : null}
      </div>

      <div className="rounded-xl border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Descripción</TableHead>
              <TableHead>Cant.</TableHead>
              <TableHead>Precio</TableHead>
              <TableHead>IVA</TableHead>
              <TableHead>Dto.</TableHead>
              <TableHead className="text-right">Total línea</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {items.map((item) => (
              <TableRow key={item.id}>
                <TableCell className="font-medium text-foreground">{item.description}</TableCell>
                <TableCell className="text-muted-foreground">{item.quantity}</TableCell>
                <TableCell className="text-muted-foreground">{formatCurrency(item.unit_price, quote.currency_code)}</TableCell>
                <TableCell className="text-muted-foreground">{item.tax_rate}%</TableCell>
                <TableCell className="text-muted-foreground">{item.discount_percent}%</TableCell>
                <TableCell className="text-right text-foreground">
                  {formatCurrency(item.line_total ?? 0, quote.currency_code)}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </PageContainer>
  )
}
