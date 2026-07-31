'use client'

import * as React from 'react'
import { toast } from 'sonner'
import { ExternalLinkIcon, LoaderIcon, ZapIcon } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
  DialogDescription,
} from '@/components/ui/dialog'
import { createStripeInvoice } from '@/features/integrations/actions/create-stripe-invoice'

type StripeIntegration = { id: string; display_name: string | null }

export function StripeInvoiceButton({
  invoiceId,
  stripeIntegrations,
}: {
  invoiceId: string
  stripeIntegrations: StripeIntegration[]
}) {
  const [open, setOpen] = React.useState(false)
  const [selectedIntegrationId, setSelectedIntegrationId] = React.useState(
    stripeIntegrations[0]?.id ?? '',
  )
  const [loading, setLoading] = React.useState(false)
  const [result, setResult] = React.useState<{ url: string | null } | null>(null)

  if (stripeIntegrations.length === 0) return null

  async function handleCreate() {
    if (!selectedIntegrationId) return
    setLoading(true)
    setResult(null)
    try {
      const res = await createStripeInvoice({ invoiceId, integrationId: selectedIntegrationId })
      if (!res.success) {
        toast.error(res.error)
      } else {
        toast.success('Factura creada y enviada en Stripe.')
        setResult({ url: res.hostedUrl })
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={(v) => { setOpen(v); if (!v) setResult(null) }}>
      <DialogTrigger render={
        <Button variant="outline" size="sm">
          <ZapIcon className="mr-1.5 size-3.5 text-violet-500" />
          Cobrar con Stripe
        </Button>
      } />
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Cobrar con Stripe</DialogTitle>
          <DialogDescription>
            Se creará una factura en Stripe con las líneas de esta factura. El cliente recibirá
            un email con el link de pago.
          </DialogDescription>
        </DialogHeader>

        {stripeIntegrations.length > 1 && (
          <div className="space-y-1.5">
            <label className="text-sm font-medium">Cuenta Stripe</label>
            <select
              className="w-full rounded-md border bg-background px-3 py-2 text-sm"
              value={selectedIntegrationId}
              onChange={(e) => setSelectedIntegrationId(e.target.value)}
            >
              {stripeIntegrations.map((int) => (
                <option key={int.id} value={int.id}>
                  {int.display_name ?? int.id}
                </option>
              ))}
            </select>
          </div>
        )}

        {result ? (
          <div className="rounded-lg border border-green-200 bg-green-50 p-4 dark:border-green-800 dark:bg-green-950/30">
            <p className="text-sm font-medium text-green-700 dark:text-green-400">
              Factura creada y enviada correctamente.
            </p>
            {result.url && (
              <a
                href={result.url}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-2 flex items-center gap-1 text-sm text-primary hover:underline"
              >
                <ExternalLinkIcon className="size-3.5" />
                Ver factura en Stripe
              </a>
            )}
          </div>
        ) : (
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={handleCreate} disabled={loading || !selectedIntegrationId}>
              {loading && <LoaderIcon className="mr-1.5 size-3.5 animate-spin" />}
              Crear y enviar factura
            </Button>
          </DialogFooter>
        )}
      </DialogContent>
    </Dialog>
  )
}
