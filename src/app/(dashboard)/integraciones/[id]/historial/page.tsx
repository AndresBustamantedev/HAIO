import { notFound } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeftIcon } from 'lucide-react'

import { PageContainer } from '@/components/common/page-container'
import { PageHeader } from '@/components/common/page-header'
import { ErrorState } from '@/components/common/error-state'
import { TablePagination } from '@/components/common/table-pagination'
import { Button } from '@/components/ui/button'
import { SyncHistoryTable } from '@/features/integrations/components/sync-history'
import { getIntegration } from '@/features/integrations/queries/get-integration'
import { getSyncRuns } from '@/features/integrations/queries/get-sync-runs'
import { getCurrentOrganization } from '@/lib/supabase/queries/organizations'

type Props = {
  params: Promise<{ id: string }>
  searchParams: Promise<{ page?: string }>
}

export async function generateMetadata(_props: Props) {
  return { title: 'Historial de sync' }
}

export default async function IntegracionHistorialPage({ params, searchParams }: Props) {
  const { id } = await params
  const sp = await searchParams
  const page = Number(sp.page ?? '1') || 1

  const organization = await getCurrentOrganization()
  if (!organization) {
    return (
      <PageContainer>
        <ErrorState description="No estás autenticado." />
      </PageContainer>
    )
  }

  let integration, runsResult
  try {
    const [integResult, runs] = await Promise.all([
      getIntegration(id, organization.organizationId),
      getSyncRuns({ organizationId: organization.organizationId, integrationId: id, page, pageSize: 25 }),
    ])
    if (!integResult) return notFound()
    integration = integResult.integration
    runsResult = runs
  } catch {
    return (
      <PageContainer>
        <ErrorState description="No se pudo cargar el historial." />
      </PageContainer>
    )
  }

  return (
    <PageContainer>
      <PageHeader
        title={`Historial — ${integration.name}`}
        description="Todas las ejecuciones de sincronización, en orden cronológico inverso."
        actions={
          <Button variant="outline" size="sm" render={<Link href={`/integraciones/${id}`} />}>
            <ArrowLeftIcon className="mr-1.5 size-4" />
            Volver a la integración
          </Button>
        }
      />

      <SyncHistoryTable
        runs={runsResult.runs}
        integrationId={id}
      />

      <TablePagination
        page={runsResult.page}
        pageSize={runsResult.pageSize}
        total={runsResult.total}
        basePath={`/integraciones/${id}/historial`}
        searchParams={{ page: sp.page }}
      />
    </PageContainer>
  )
}
