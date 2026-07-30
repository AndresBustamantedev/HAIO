'use client'

import Link from 'next/link'
import {
  AlertCircleIcon,
  BoxesIcon,
  ClockIcon,
  RefreshCwIcon,
} from 'lucide-react'

import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { IntegrationStatusBadge } from './integration-status-badge'
import type { Integration } from '@/features/integrations/types'

function formatRelativeTime(iso: string | null): string {
  if (!iso) return 'Nunca'
  const diff = Date.now() - new Date(iso).getTime()
  const mins = Math.floor(diff / 60_000)
  if (mins < 60) return `Hace ${mins}m`
  const hrs = Math.floor(mins / 60)
  if (hrs < 24) return `Hace ${hrs}h`
  return `Hace ${Math.floor(hrs / 24)}d`
}

function formatSyncFrequency(freq: string) {
  switch (freq) {
    case 'hourly': return 'Cada hora'
    case 'daily':  return 'Diaria'
    case 'weekly': return 'Semanal'
    default:       return freq
  }
}

export function IntegrationCard({ integration }: { integration: Integration }) {
  return (
    <Link href={`/integraciones/${integration.id}`} className="block">
      <Card className="transition-shadow hover:shadow-md">
        <CardHeader className="pb-2">
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0">
              <p className="truncate font-semibold text-foreground leading-tight">
                {integration.name}
              </p>
              <p className="text-xs text-muted-foreground mt-0.5">
                {integration.provider_name ?? integration.connector_type}
                {integration.environment === 'sandbox' && (
                  <span className="ml-1 rounded bg-amber-100 px-1 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400">
                    sandbox
                  </span>
                )}
              </p>
            </div>
            <IntegrationStatusBadge status={integration.status} />
          </div>
        </CardHeader>
        <CardContent>
          <dl className="grid grid-cols-2 gap-x-4 gap-y-2 text-sm">
            <div className="flex items-center gap-1.5 text-muted-foreground">
              <BoxesIcon className="size-3.5 shrink-0" />
              <span>{integration.resources_count} recursos</span>
            </div>
            {integration.active_alerts_count > 0 && (
              <div className="flex items-center gap-1.5 text-destructive">
                <AlertCircleIcon className="size-3.5 shrink-0" />
                <span>{integration.active_alerts_count} alertas</span>
              </div>
            )}
            <div className="flex items-center gap-1.5 text-muted-foreground">
              <ClockIcon className="size-3.5 shrink-0" />
              <span>{formatRelativeTime(integration.last_successful_sync_at)}</span>
            </div>
            {integration.sync_enabled && (
              <div className="flex items-center gap-1.5 text-muted-foreground">
                <RefreshCwIcon className="size-3.5 shrink-0" />
                <span>{formatSyncFrequency(integration.sync_frequency)}</span>
              </div>
            )}
          </dl>
          {integration.unassigned_resources_count > 0 && (
            <p className="mt-2 text-xs text-amber-600 dark:text-amber-400">
              {integration.unassigned_resources_count} sin asignar
            </p>
          )}
        </CardContent>
      </Card>
    </Link>
  )
}
