'use client'

import * as React from 'react'
import { toast } from 'sonner'
import { CopyIcon, CheckIcon, LoaderIcon } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { generateInvoicePaymentLink } from '@/features/invoices/actions/generate-payment-link'

export function PaymentLinkButton({ invoiceId }: { invoiceId: string }) {
  const [loading, setLoading] = React.useState(false)
  const [copied, setCopied]   = React.useState(false)

  async function handleClick() {
    setLoading(true)
    try {
      const result = await generateInvoicePaymentLink(invoiceId)
      if (!result.success) {
        toast.error(result.error)
        return
      }
      try {
        await navigator.clipboard.writeText(result.url)
        setCopied(true)
        setTimeout(() => setCopied(false), 3000)
        toast.success(
          <div className="flex flex-col gap-0.5">
            <span className="font-medium">Link de pago copiado</span>
            <span className="text-xs text-muted-foreground truncate max-w-[260px]">{result.url}</span>
          </div>
        )
      } catch {
        // Fallback si el navegador bloquea clipboard
        toast.info(
          <div className="flex flex-col gap-1">
            <span className="font-medium">Link de pago generado</span>
            <span className="break-all text-xs font-mono select-all">{result.url}</span>
          </div>,
          { duration: 15000 }
        )
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <Button variant="outline" size="sm" onClick={handleClick} disabled={loading}>
      {loading
        ? <LoaderIcon className="mr-1.5 size-3.5 animate-spin" />
        : copied
          ? <CheckIcon className="mr-1.5 size-3.5 text-green-600" />
          : <CopyIcon className="mr-1.5 size-3.5" />}
      {loading ? 'Generando…' : copied ? '¡Copiado!' : 'Link de pago'}
    </Button>
  )
}
