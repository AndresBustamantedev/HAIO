import Link from 'next/link'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { SyncRunStatusBadge } from './sync-run-status-badge'
import { EmptyState } from '@/components/common/empty-state'
import { HistoryIcon } from 'lucide-react'
import type { IntegrationSyncRun } from '@/features/integrations/types'

const TRIGGER_LABELS: Record<string, string> = {
  user:    'Manual',
  cron:    'Automático',
  webhook: 'Webhook',
  system:  'Sistema',
}

const OPERATION_LABELS: Record<string, string> = {
  test_connection:       'Prueba de conexión',
  initial_sync:         'Sync inicial',
  manual_sync:          'Sync manual',
  scheduled_sync:       'Sync programado',
  webhook_sync:         'Sync webhook',
  import:              'Importación',
  credentials_validation: 'Validación credenciales',
}

function formatDate(iso: string | null) {
  if (!iso) return '—'
  return new Intl.DateTimeFormat('es', {
    day: '2-digit', month: 'short', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  }).format(new Date(iso))
}

function formatDuration(ms: number | null) {
  if (ms === null) return '—'
  if (ms < 1000) return `${ms}ms`
  return `${(ms / 1000).toFixed(1)}s`
}

export function SyncHistoryTable({
  runs,
  integrationId,
  showViewAll = false,
}: {
  runs: IntegrationSyncRun[]
  integrationId: string
  showViewAll?: boolean
}) {
  if (runs.length === 0) {
    return (
      <EmptyState
        icon={HistoryIcon}
        title="Sin historial de sincronizaciones"
        description="Las ejecuciones aparecerán aquí una vez que realices la primera sincronización."
      />
    )
  }

  return (
    <div className="space-y-2">
      <div className="overflow-x-auto rounded-lg border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Fecha</TableHead>
              <TableHead>Tipo</TableHead>
              <TableHead>Estado</TableHead>
              <TableHead className="text-right">Recursos</TableHead>
              <TableHead className="text-right">Duración</TableHead>
              <TableHead>Error</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {runs.map((run) => (
              <TableRow key={run.id}>
                <TableCell className="whitespace-nowrap text-sm">
                  {formatDate(run.started_at)}
                </TableCell>
                <TableCell className="text-sm">
                  <span className="text-muted-foreground">
                    {TRIGGER_LABELS[run.trigger_type] ?? run.trigger_type}
                  </span>
                  <span className="mx-1 text-muted-foreground/50">·</span>
                  <span>{OPERATION_LABELS[run.operation_type] ?? run.operation_type}</span>
                </TableCell>
                <TableCell>
                  <SyncRunStatusBadge status={run.status} />
                </TableCell>
                <TableCell className="text-right text-sm font-numeric">
                  {run.status === 'completed' || run.status === 'partial'
                    ? `${run.resources_found} (${run.resources_created}↑ ${run.resources_updated}↺)`
                    : '—'}
                </TableCell>
                <TableCell className="text-right text-sm">
                  {formatDuration(run.duration_ms)}
                </TableCell>
                <TableCell className="max-w-xs truncate text-sm text-muted-foreground">
                  {run.error_summary ?? '—'}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
      {showViewAll && (
        <div className="text-right">
          <Link
            href={`/integraciones/${integrationId}/historial`}
            className="text-sm text-primary hover:underline"
          >
            Ver historial completo →
          </Link>
        </div>
      )}
    </div>
  )
}
