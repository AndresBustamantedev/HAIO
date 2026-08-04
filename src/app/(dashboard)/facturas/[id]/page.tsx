import { notFound } from "next/navigation"
import Link from "next/link"

import { PageContainer } from "@/components/common/page-container"
import { PageHeader } from "@/components/common/page-header"
import { Breadcrumbs } from "@/components/common/breadcrumbs"
import { StatusBadge } from "@/components/common/status-badge"
import { EmptyState } from "@/components/common/empty-state"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { EditInvoiceButton } from "@/features/invoices/components/edit-invoice-button"
import { getInvoiceDetail } from "@/features/invoices/queries/get-invoice-detail"
import { getClientOptions } from "@/lib/supabase/queries/client-options"
import { getInvoiceStatusBadge } from "@/features/invoices/utils/status"
import { PaymentLinkButton } from "@/features/invoices/components/payment-link-button"
import { StripeInvoiceButton } from "@/features/integrations/components/stripe-invoice-button"
import { getActiveStripeIntegrations } from "@/features/integrations/queries/get-active-stripe-integrations"

function formatDate(value: string | null) {
  if (!value) return "—"
  return new Intl.DateTimeFormat("es-ES", { day: "2-digit", month: "short", year: "numeric" }).format(
    new Date(value)
  )
}

function formatCurrency(value: number, currency: string) {
  return new Intl.NumberFormat("es-ES", { style: "currency", currency }).format(value)
}

type FacturaDetailPageProps = {
  params: Promise<{ id: string }>
}

export default async function FacturaDetailPage({ params }: FacturaDetailPageProps) {
  const { id } = await params
  const detail = await getInvoiceDetail(id)

  if (!detail) {
    notFound()
  }

  const { invoice, items, payments } = detail
  const badge = getInvoiceStatusBadge(invoice.status)
  const [clientOptions, stripeIntegrations] = await Promise.all([
    getClientOptions(invoice.organization_id),
    getActiveStripeIntegrations(),
  ])

  return (
    <PageContainer>
      <Breadcrumbs items={[{ label: "Facturas", href: "/facturas" }, { label: invoice.invoice_number }]} />

      <PageHeader
        title={invoice.invoice_number}
        description={
          invoice.clients ? (
            <Link href={`/clientes/${invoice.clients.id}`} className="hover:underline">
              {invoice.clients.display_name}
            </Link>
          ) : undefined
        }
        actions={
          <div className="flex items-center gap-3">
            <StatusBadge tone={badge.tone} label={badge.label} />
            <a
              href={`/api/facturas/${invoice.id}/pdf`}
              download
              className="inline-flex items-center gap-1.5 rounded-md border bg-background px-3 py-1.5 text-sm font-medium text-foreground shadow-sm hover:bg-muted transition-colors"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="size-4 text-muted-foreground" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/>
              </svg>
              PDF
            </a>
            <PaymentLinkButton invoiceId={invoice.id} />
            <StripeInvoiceButton
              invoiceId={invoice.id}
              stripeIntegrations={stripeIntegrations}
            />
            <EditInvoiceButton invoiceDetail={detail} clientOptions={clientOptions} />
          </div>
        }
      />

      <div className="rounded-xl border bg-card p-6">
        <p className="mb-4 text-sm font-medium text-foreground">Información general</p>
        <dl className="grid grid-cols-1 gap-4 text-sm sm:grid-cols-2 lg:grid-cols-4">
          <div>
            <dt className="text-xs text-muted-foreground">Fecha de emisión</dt>
            <dd className="text-foreground">{formatDate(invoice.issue_date)}</dd>
          </div>
          <div>
            <dt className="text-xs text-muted-foreground">Vencimiento</dt>
            <dd className="text-foreground">{formatDate(invoice.due_date)}</dd>
          </div>
          <div>
            <dt className="text-xs text-muted-foreground">Total</dt>
            <dd className="font-medium text-foreground">{formatCurrency(invoice.total, invoice.currency_code)}</dd>
          </div>
          <div>
            <dt className="text-xs text-muted-foreground">Pendiente</dt>
            <dd className="font-medium text-foreground">{formatCurrency(invoice.amount_due, invoice.currency_code)}</dd>
          </div>
        </dl>
        {invoice.notes ? <p className="mt-4 border-t pt-4 text-sm text-muted-foreground">{invoice.notes}</p> : null}
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
                <TableCell className="text-muted-foreground">{formatCurrency(item.unit_price, invoice.currency_code)}</TableCell>
                <TableCell className="text-muted-foreground">{item.tax_rate}%</TableCell>
                <TableCell className="text-muted-foreground">{item.discount_percent}%</TableCell>
                <TableCell className="text-right text-foreground">
                  {formatCurrency(item.line_total ?? 0, invoice.currency_code)}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      <div className="flex flex-col gap-3">
        <p className="text-sm font-medium text-foreground">Pagos registrados</p>
        {payments.length === 0 ? (
          <EmptyState title="Sin pagos registrados" description="Todavía no se ha registrado ningún pago para esta factura." />
        ) : (
          <div className="rounded-xl border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Fecha</TableHead>
                  <TableHead>Método</TableHead>
                  <TableHead>Estado</TableHead>
                  <TableHead className="text-right">Importe</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {payments.map((payment) => (
                  <TableRow key={payment.id}>
                    <TableCell className="text-muted-foreground">{formatDate(payment.paid_at)}</TableCell>
                    <TableCell className="text-muted-foreground">{payment.method}</TableCell>
                    <TableCell className="text-muted-foreground">{payment.status}</TableCell>
                    <TableCell className="text-right text-foreground">
                      {formatCurrency(payment.amount, payment.currency_code)}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </div>
    </PageContainer>
  )
}
