import Link from 'next/link'
import { ArrowLeftIcon, BoxesIcon } from 'lucide-react'

import { PageContainer } from '@/components/common/page-container'
import { PageHeader } from '@/components/common/page-header'
import { EmptyState } from '@/components/common/empty-state'
import { ErrorState } from '@/components/common/error-state'
import { TablePagination } from '@/components/common/table-pagination'
import { Button } from '@/components/ui/button'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { ImportDomainDialog } from '@/features/integrations/components/import-domain-dialog'
import { LinkResourceDialog } from '@/features/integrations/components/link-resource-dialog'
import { getUnassignedResources } from '@/features/integrations/queries/get-unassigned-resources'
import { getClientOptions } from '@/lib/supabase/queries/client-options'
import { getCurrentOrganization } from '@/lib/supabase/queries/organizations'
import { LinkIcon, PlusCircleIcon } from 'lucide-react'

type Props = { searchParams: Promise<{ page?: string }> }

function formatDate(iso: string | null) {
  if (!iso) return 'Nunca'
  return new Intl.DateTimeFormat('es', { day: '2-digit', month: 'short', year: 'numeric' }).format(new Date(iso))
}

export const metadata = { title: 'Recursos sin asignar' }

export default async function RecursosSinAsignarPage({ searchParams }: Props) {
  const sp = await searchParams
  const page = Number(sp.page ?? '1') || 1

  const organization = await getCurrentOrganization()
  if (!organization) {
    return (
      <PageContainer>
        <PageHeader title="Recursos sin asignar" />
        <EmptyState icon={BoxesIcon} title="Sin organización" />
      </PageContainer>
    )
  }

  let result, clientOptions
  try {
    [result, clientOptions] = await Promise.all([
      getUnassignedResources({ organizationId: organization.organizationId, page, pageSize: 50 }),
      getClientOptions(organization.organizationId),
    ])
  } catch {
    return (
      <PageContainer>
        <PageHeader title="Recursos sin asignar" />
        <ErrorState description="No se pudo cargar la lista." />
      </PageContainer>
    )
  }

  return (
    <PageContainer>
      <PageHeader
        title="Recursos sin asignar"
        description="Recursos sincronizados desde proveedores externos que aún no están vinculados a un dominio local."
        actions={
          <Button variant="outline" size="sm" render={<Link href="/integraciones" />}>
            <ArrowLeftIcon className="mr-1.5 size-4" />
            Integraciones
          </Button>
        }
      />

      {result.resources.length === 0 ? (
        <EmptyState
          icon={BoxesIcon}
          title="Todo asignado"
          description="No hay recursos externos pendientes de vinculación. ¡Buen trabajo!"
        />
      ) : (
        <>
          <div className="overflow-x-auto rounded-lg border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Dominio</TableHead>
                  <TableHead>Integración</TableHead>
                  <TableHead>Estado</TableHead>
                  <TableHead>Visto por última vez</TableHead>
                  <TableHead className="text-right">Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {result.resources.map((res) => (
                  <TableRow key={res.id}>
                    <TableCell className="font-medium">
                      {res.external_name ?? res.external_resource_id}
                      {res.consecutive_missing_syncs >= 2 && (
                        <Badge variant="destructive" className="ml-2 text-xs">Ausente</Badge>
                      )}
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {res.integration_name ?? '—'}
                      {res.connector_type && (
                        <span className="ml-1 text-xs text-muted-foreground/60">
                          ({res.connector_type})
                        </span>
                      )}
                    </TableCell>
                    <TableCell>
                      {res.external_status
                        ? <Badge variant="outline" className="capitalize">{res.external_status}</Badge>
                        : <span className="text-muted-foreground">—</span>}
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {formatDate(res.last_seen_at)}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-1">
                        <LinkResourceDialog
                          resource={res}
                          trigger={
                            <Button variant="ghost" size="sm">
                              <LinkIcon className="mr-1 size-3.5" />
                              Vincular
                            </Button>
                          }
                        />
                        <ImportDomainDialog
                          resource={res}
                          clientOptions={clientOptions}
                          trigger={
                            <Button variant="ghost" size="sm">
                              <PlusCircleIcon className="mr-1 size-3.5" />
                              Importar
                            </Button>
                          }
                        />
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>

          <TablePagination
            page={result.page}
            pageSize={result.pageSize}
            total={result.total}
            basePath="/integraciones/recursos-sin-asignar"
            searchParams={{ page: sp.page }}
          />
        </>
      )}
    </PageContainer>
  )
}
