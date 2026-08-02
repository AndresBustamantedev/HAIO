import { notFound } from 'next/navigation'
import { verifyPaymentToken } from '@/lib/payment-token'
import { createAdminClient } from '@/lib/supabase/admin'
import { PaymentOptions } from './payment-options'

type PageProps = { params: Promise<{ token: string }> }

async function loadPaymentData(invoiceId: string) {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const db = createAdminClient() as any

  // Factura + líneas + cliente
  const { data: invoice } = await db
    .from('invoices')
    .select('id, invoice_number, status, total, amount_due, currency_code, organization_id, notes, due_date, clients(display_name, email)')
    .eq('id', invoiceId)
    .maybeSingle()

  if (!invoice) return null

  const { data: items } = await db
    .from('invoice_items')
    .select('description, quantity, unit_price, tax_rate, discount_percent, line_total')
    .eq('invoice_id', invoiceId)
    .order('position')

  // Buscar integraciones de pago activas para la organización
  // Nota: usar v_integrations_safe porque la tabla integrations usa `name`, no `display_name`
  const { data: integrations } = await db
    .from('v_integrations_safe')
    .select('id, connector_type')
    .eq('organization_id', invoice.organization_id)
    .in('connector_type', ['stripe', 'paypal'])
    .eq('status', 'connected')
    .is('deleted_at', null)

  const stripeIntegration = (integrations ?? []).find((i: { connector_type: string }) => i.connector_type === 'stripe') ?? null
  const paypalIntegration = (integrations ?? []).find((i: { connector_type: string }) => i.connector_type === 'paypal') ?? null

  // Leer PayPal client_id (no es secreto, va al cliente)
  let paypalClientId: string | null = null
  if (paypalIntegration) {
    const { data: secretRow } = await db
      .from('integration_secrets')
      .select('secret_ciphertext')
      .eq('integration_id', paypalIntegration.id)
      .eq('secret_type', 'client_id')
      .maybeSingle()

    if (secretRow) {
      const { decryptSecret } = await import('@/features/integrations/services/encryption')
      try {
        paypalClientId = decryptSecret(secretRow.secret_ciphertext)
      } catch {
        paypalClientId = null
      }
    }
  }

  return {
    invoice: {
      id:             invoice.id,
      number:         invoice.invoice_number as string,
      status:         invoice.status as string,
      total:          invoice.total as number,
      amountDue:      invoice.amount_due as number,
      currency:       (invoice.currency_code as string | null) ?? 'EUR',
      notes:          invoice.notes as string | null,
      dueDate:        invoice.due_date as string | null,
      clientName:     (invoice.clients as { display_name: string; email: string | null } | null)?.display_name ?? 'Cliente',
      clientEmail:    (invoice.clients as { display_name: string; email: string | null } | null)?.email ?? null,
    },
    items: (items ?? []) as Array<{
      description: string
      quantity: number
      unit_price: number
      tax_rate: number
      discount_percent: number
      line_total: number | null
    }>,
    stripeIntegrationId:  stripeIntegration?.id ?? null,
    paypalIntegrationId:  paypalIntegration?.id ?? null,
    paypalClientId,
  }
}

function formatCurrency(amount: number, currency: string) {
  return new Intl.NumberFormat('es-ES', { style: 'currency', currency }).format(amount)
}

function formatDate(iso: string | null) {
  if (!iso) return null
  return new Intl.DateTimeFormat('es-ES', { day: '2-digit', month: 'long', year: 'numeric' }).format(new Date(iso))
}

export default async function PagarPage({ params }: PageProps) {
  const { token } = await params
  const invoiceId = verifyPaymentToken(token)
  if (!invoiceId) notFound()

  const data = await loadPaymentData(invoiceId)
  if (!data) notFound()

  const { invoice, items, stripeIntegrationId, paypalIntegrationId, paypalClientId } = data
  const alreadyPaid = ['paid', 'void'].includes(invoice.status)

  return (
    <main className="mx-auto max-w-2xl px-4 py-12 sm:px-6">
      {/* Header */}
      <div className="mb-8 text-center">
        <p className="text-sm font-medium text-muted-foreground">Factura de</p>
        <h1 className="mt-1 text-2xl font-bold text-foreground">{invoice.clientName}</h1>
      </div>

      {/* Invoice card */}
      <div className="rounded-2xl border bg-card shadow-sm">
        {/* Top bar */}
        <div className="flex items-center justify-between rounded-t-2xl border-b bg-muted/40 px-6 py-4">
          <div>
            <p className="text-xs text-muted-foreground">Número de factura</p>
            <p className="font-mono text-sm font-semibold text-foreground">{invoice.number}</p>
          </div>
          <div className="text-right">
            <p className="text-xs text-muted-foreground">
              {invoice.dueDate ? `Vence el ${formatDate(invoice.dueDate)}` : 'Sin fecha de vencimiento'}
            </p>
            <p className="text-2xl font-bold text-foreground">
              {formatCurrency(invoice.amountDue, invoice.currency)}
            </p>
          </div>
        </div>

        {/* Items */}
        {items.length > 0 && (
          <div className="px-6 py-4">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b text-xs text-muted-foreground">
                  <th className="pb-2 text-left font-medium">Concepto</th>
                  <th className="pb-2 text-right font-medium">Cant.</th>
                  <th className="pb-2 text-right font-medium">Total</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {items.map((item, i) => (
                  <tr key={i} className="text-foreground">
                    <td className="py-2.5">{item.description}</td>
                    <td className="py-2.5 text-right text-muted-foreground">{item.quantity}</td>
                    <td className="py-2.5 text-right font-medium">
                      {formatCurrency(item.line_total ?? 0, invoice.currency)}
                    </td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr className="border-t font-semibold text-foreground">
                  <td colSpan={2} className="pt-3">Total</td>
                  <td className="pt-3 text-right">{formatCurrency(invoice.total, invoice.currency)}</td>
                </tr>
              </tfoot>
            </table>
          </div>
        )}

        {invoice.notes && (
          <div className="border-t px-6 py-3 text-sm text-muted-foreground">
            <span className="font-medium text-foreground">Nota: </span>{invoice.notes}
          </div>
        )}

        {/* Payment section */}
        <div className="rounded-b-2xl border-t bg-muted/20 px-6 py-6">
          {alreadyPaid ? (
            <div className="rounded-lg border border-green-200 bg-green-50 p-4 text-center dark:border-green-800 dark:bg-green-950/30">
              <p className="font-semibold text-green-700 dark:text-green-400">Esta factura ya está pagada.</p>
              <p className="mt-1 text-sm text-green-600 dark:text-green-500">Gracias por tu pago.</p>
            </div>
          ) : (
            <PaymentOptions
              token={token}
              invoiceId={invoice.id}
              amountDue={invoice.amountDue}
              currency={invoice.currency}
              stripeIntegrationId={stripeIntegrationId}
              paypalIntegrationId={paypalIntegrationId}
              paypalClientId={paypalClientId}
            />
          )}
        </div>
      </div>

      <p className="mt-6 text-center text-xs text-muted-foreground">
        Pago procesado de forma segura. Este link fue generado por HAIO.
      </p>
    </main>
  )
}
