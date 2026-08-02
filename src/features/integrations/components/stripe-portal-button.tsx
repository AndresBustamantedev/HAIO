'use client'

import * as React from 'react'
import { toast } from 'sonner'
import { ExternalLinkIcon, LoaderIcon, ZapIcon } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { createStripePortalSession } from '@/features/integrations/actions/create-stripe-portal'

type StripeIntegration = { id: string; name: string | null }

export function StripePortalButton({
  clientId,
  stripeIntegrations,
}: {
  clientId: string
  stripeIntegrations: StripeIntegration[]
}) {
  const [loading, setLoading] = React.useState(false)

  if (stripeIntegrations.length === 0) return null

  const integrationId = stripeIntegrations[0]!.id

  async function handleClick() {
    setLoading(true)
    try {
      const res = await createStripePortalSession({ clientId, integrationId })
      if (!res.success) {
        toast.error(res.error)
      } else {
        window.open(res.url, '_blank', 'noopener,noreferrer')
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <Button variant="outline" size="sm" onClick={handleClick} disabled={loading}>
      {loading
        ? <LoaderIcon className="mr-1.5 size-3.5 animate-spin" />
        : <ExternalLinkIcon className="mr-1.5 size-3.5 text-violet-500" />}
      {loading ? 'Generando...' : 'Portal Stripe'}
    </Button>
  )
}

export function StripePortalButtonMulti({
  clientId,
  stripeIntegrations,
}: {
  clientId: string
  stripeIntegrations: StripeIntegration[]
}) {
  const [selectedId, setSelectedId] = React.useState(stripeIntegrations[0]?.id ?? '')
  const [loading, setLoading] = React.useState(false)

  if (stripeIntegrations.length === 0) return null

  if (stripeIntegrations.length === 1) {
    return <StripePortalButton clientId={clientId} stripeIntegrations={stripeIntegrations} />
  }

  async function handleClick() {
    if (!selectedId) return
    setLoading(true)
    try {
      const res = await createStripePortalSession({ clientId, integrationId: selectedId })
      if (!res.success) {
        toast.error(res.error)
      } else {
        window.open(res.url, '_blank', 'noopener,noreferrer')
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex items-center gap-2">
      <select
        className="rounded-md border bg-background px-2 py-1.5 text-sm"
        value={selectedId}
        onChange={(e) => setSelectedId(e.target.value)}
      >
        {stripeIntegrations.map((int) => (
          <option key={int.id} value={int.id}>
            {int.name ?? int.id}
          </option>
        ))}
      </select>
      <Button variant="outline" size="sm" onClick={handleClick} disabled={loading || !selectedId}>
        {loading
          ? <LoaderIcon className="mr-1.5 size-3.5 animate-spin" />
          : <ZapIcon className="mr-1.5 size-3.5 text-violet-500" />}
        Portal Stripe
      </Button>
    </div>
  )
}
