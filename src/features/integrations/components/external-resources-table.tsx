'use client'

import * as React from 'react'
import { toast } from 'sonner'
import {
  BoxesIcon,
  CheckCircleIcon,
  LinkIcon,
  UnlinkIcon,
  PlusCircleIcon,
} from 'lucide-react'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { EmptyState } from '@/components/common/empty-state'
import { LinkResourceDialog } from './link-resource-dialog'
import { ImportDomainDialog } from './import-domain-dialog'
import { unlinkExternalResource } from '@/features/integrations/actions/link-external-resource'
import type { ExternalResource } from '@/features/integrations/types'

type ClientOption = { id: string; display_name: string }

function formatDate(iso: string | null) {
  if (!iso) return 'Nunca'
  return new Intl.DateTimeFormat('es', { day: '2-digit', month: 'short', year: 'numeric' })
    .format(new Date(iso))
}

function ExpirationCell({ raw }: { raw: Record<string, unknown> }) {
  const expiresOn = typeof raw.expiresOn === 'string' ? raw.expiresOn : null
  if (!expiresOn) return <span className="text-muted-foreground">—</span>

  const date = new Date(expiresOn)
  const now = date.getTime() - new Date().getTime()
  const daysLeft = Math.floor(now / 86_400_000)
  const formatted = new Intl.DateTimeFormat('es', { day: '2-digit', month: 'short', year: 'numeric' }).format(date)

  if (daysLeft < 0) return <span className="text-destructive">{formatted} (expirado)</span>
  if (daysLeft < 30) return <span className="text-amber-600 dark:text-amber-400">{formatted} ({daysLeft}d)</span>
  return <span>{formatted}</span>
}

export function ExternalResourcesTable({
  resources,
  integrationId,
  clientOptions,
}: {
  resources: ExternalResource[]
  integrationId: string
  clientOptions: ClientOption[]
}) {
  const [unlinkingId, setUnlinkingId] = React.useState<string | null>(null)

  async function handleUnlink(resourceId: string) {
    setUnlinkingId(resourceId)
    try {
      const result = await unlinkExternalResource({ externalResourceId: resourceId })
      if (result.error) toast.error(result.error)
      else toast.success('Recurso desvinculado.')
    } finally {
      setUnlinkingId(null)
    }
  }

  if (resources.length === 0) {
    return (
      <EmptyState
        icon={BoxesIcon}
        title="Sin recursos sincronizados"
        description="Los dominios de esta cuenta aparecerán aquí tras la primera sincronización."
      />
    )
  }

  return (
    <div className="overflow-x-auto rounded-lg border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Dominio</TableHead>
            <TableHead>Estado</TableHead>
            <TableHead>Expira</TableHead>
            <TableHead>Última sync</TableHead>
            <TableHead>Vinculación</TableHead>
            <TableHead className="text-right">Acciones</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {resources.map((res) => (
            <TableRow key={res.id}>
              <TableCell className="font-medium">
                {res.external_name ?? res.external_resource_id}
                {res.consecutive_missing_syncs >= 2 && (
                  <Badge variant="destructive" className="ml-2 text-xs">Ausente</Badge>
                )}
              </TableCell>
              <TableCell>
                {res.external_status
                  ? <Badge variant="outline" className="capitalize">{res.external_status}</Badge>
                  : <span className="text-muted-foreground">—</span>}
              </TableCell>
              <TableCell className="text-sm">
                <ExpirationCell raw={res.raw_metadata} />
              </TableCell>
              <TableCell className="text-sm text-muted-foreground">
                {formatDate(res.last_synced_at)}
              </TableCell>
              <TableCell>
                {res.local_resource_id
                  ? (
                    <div className="flex items-center gap-1 text-sm text-green-600 dark:text-green-400">
                      <CheckCircleIcon className="size-3.5" />
                      <span>Vinculado</span>
                    </div>
                  )
                  : <span className="text-sm text-muted-foreground">Sin asignar</span>}
              </TableCell>
              <TableCell className="text-right">
                <div className="flex items-center justify-end gap-1">
                  {res.local_resource_id ? (
                    <Button
                      variant="ghost"
                      size="sm"
                      disabled={unlinkingId === res.id}
                      onClick={() => handleUnlink(res.id)}
                    >
                      <UnlinkIcon className="size-3.5" />
                      <span className="sr-only">Desvincular</span>
                    </Button>
                  ) : (
                    <>
                      <LinkResourceDialog
                        resource={res}
                        trigger={
                          <Button variant="ghost" size="sm">
                            <LinkIcon className="size-3.5" />
                            <span className="sr-only">Vincular dominio</span>
                          </Button>
                        }
                      />
                      <ImportDomainDialog
                        resource={res}
                        clientOptions={clientOptions}
                        trigger={
                          <Button variant="ghost" size="sm">
                            <PlusCircleIcon className="size-3.5" />
                            <span className="sr-only">Importar dominio</span>
                          </Button>
                        }
                      />
                    </>
                  )}
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  )
}
