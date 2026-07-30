import { notFound } from 'next/navigation'
import Link from 'next/link'
import {
  AlertCircleIcon,
  ArrowLeftIcon,
  BoxesIcon,
  ClockIcon,
  TrendingUpIcon,
  ZapIcon,
} from 'lucide-react'

import { PageContainer } from '@/components/common/page-container'
import { ErrorState } from '@/components/common/error-state'
import { Button } from '@/components/ui/button'
import { Tabs, TabsPanel, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'

import { IntegrationStatusBadge } from '@/features/integrations/components/integration-status-badge'
import { IntegrationActions } from '@/features/integrations/components/integration-actions'
import { IntegrationSettings } from '@/features/integrations/components/integration-settings'
import { SyncHistoryTable } from '@/features/integrations/components/sync-history'
import { ExternalResourcesTable } from '@/features/integrations/components/external-resources-table'

import { getIntegration } from '@/features/integrations/queries/get-integration'
import { getExternalResources } from '@/features/integrations/queries/get-external-resources'
import { getSyncRuns } from '@/features/integrations/queries/get-sync-runs'
import { getInfrastructureAlerts } from '@/features/integrations/queries/get-infrastructure-alerts'
import { getConnectorMeta } from '@/features/integrations/connectors/registry'
import { getClientOptions } from '@/lib/supabase/queries/client-options'
import { getCurrentOrganization } from '@/lib/supabase/queries/organizations'

type Props = { params: Promise<{ id: string }> }

function formatDate(iso: string | null) {
  if (!iso) return 'Nunca'
  return new Intl.DateTimeFormat('es', {
    day: '2-digit', month: 'short', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  }).format(new Date(iso))
}

function formatDuration(ms: number | null) {
  if (ms === null) return '—'
  return ms < 1000 ? `${ms}ms` : `${(ms / 1000).toFixed(1)}s`
}

export async function generateMetadata({ params }: Props) {
  const { id } = await params
  const organization = await getCurrentOrganization()
  if (!organization) return { title: 'Integración' }
  try {
    const res = await getIntegration(id, organization.organizationId)
    return { title: res?.integration.name ?? 'Integración' }
  } catch {
    return { title: 'Integración' }
  }
}

export default async function IntegracionDetailPage({ params }: Props) {
  const { id } = await params
  const organization = await getCurrentOrganization()

  if (!organization) {
    return (
      <PageContainer>
        <ErrorState description="No estás autenticado." />
      </PageContainer>
    )
  }

  // getIntegration fuera del try/catch: next/navigation#notFound() lanza internamente
  // y si está dentro de un catch genérico queda atrapado mostrando el error state en vez del 404.
  let integResult
  try {
    integResult = await getIntegration(id, organization.organizationId)
  } catch {
    return (
      <PageContainer>
        <ErrorState description="No se pudo cargar la integración." />
      </PageContainer>
    )
  }
  if (!integResult) return notFound()

  let resources, runs, alerts, clientOptions
  try {
    const [resourceResult, runResult, alertResult, clients] = await Promise.all([
      getExternalResources({ organizationId: organization.organizationId, integrationId: id, pageSize: 100 }),
      getSyncRuns({ organizationId: organization.organizationId, integrationId: id, pageSize: 10 }),
      getInfrastructureAlerts({ organizationId: organization.organizationId, integrationId: id, pageSize: 10 }),
      getClientOptions(organization.organizationId),
    ])

    resources = resourceResult.resources
    runs = runResult.runs
    alerts = alertResult.alerts
    clientOptions = clients
  } catch {
    return (
      <PageContainer>
        <ErrorState description="No se pudo cargar la integración." />
      </PageContainer>
    )
  }

  const integration = integResult.integration

  const connectorMeta = getConnectorMeta(integration.connector_type)
  const secretFields = connectorMeta?.requiredSecrets ?? []

  return (
    <PageContainer>
      {/* Cabecera */}
      <div className="space-y-4">
        <Button variant="ghost" size="sm" render={<Link href="/integraciones" />} className="-ml-2">
          <ArrowLeftIcon className="mr-1.5 size-4" />
          Integraciones
        </Button>

        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div className="space-y-1">
            <div className="flex items-center gap-2.5">
              <h1 className="font-heading text-2xl font-bold text-foreground">{integration.name}</h1>
              <IntegrationStatusBadge status={integration.status} />
              {integration.environment === 'sandbox' && (
                <Badge variant="outline" className="text-amber-600">sandbox</Badge>
              )}
            </div>
            <p className="text-sm text-muted-foreground">
              {integration.provider_name ?? integration.connector_type}
              {' · '}
              Creado {formatDate(integration.created_at)}
            </p>
          </div>
          <IntegrationActions integration={integration} />
        </div>

        {/* Métricas rápidas */}
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          <Card>
            <CardHeader className="pb-1 pt-3 px-4">
              <CardTitle className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground uppercase tracking-wide">
                <BoxesIcon className="size-3.5" />
                Recursos
              </CardTitle>
            </CardHeader>
            <CardContent className="px-4 pb-3">
              <p className="text-2xl font-bold tabular-nums">{integration.resources_count}</p>
              {integration.unassigned_resources_count > 0 && (
                <p className="text-xs text-amber-600 dark:text-amber-400">
                  {integration.unassigned_resources_count} sin asignar
                </p>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-1 pt-3 px-4">
              <CardTitle className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground uppercase tracking-wide">
                <ClockIcon className="size-3.5" />
                Última sync
              </CardTitle>
            </CardHeader>
            <CardContent className="px-4 pb-3">
              <p className="text-sm font-medium">{formatDate(integration.last_successful_sync_at)}</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-1 pt-3 px-4">
              <CardTitle className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground uppercase tracking-wide">
                <TrendingUpIcon className="size-3.5" />
                Fallos consec.
              </CardTitle>
            </CardHeader>
            <CardContent className="px-4 pb-3">
              <p className={`text-2xl font-bold tabular-nums ${integration.consecutive_failures >= 3 ? 'text-destructive' : ''}`}>
                {integration.consecutive_failures}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-1 pt-3 px-4">
              <CardTitle className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground uppercase tracking-wide">
                <ZapIcon className="size-3.5" />
                Duración media
              </CardTitle>
            </CardHeader>
            <CardContent className="px-4 pb-3">
              <p className="text-sm font-medium">{formatDuration(integration.average_sync_duration_ms)}</p>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Alertas activas */}
      {alerts.length > 0 && (
        <div className="space-y-2">
          {alerts.map((alert) => (
            <div
              key={alert.id}
              className="flex items-start gap-3 rounded-lg border border-destructive/30 bg-destructive/5 px-4 py-3"
            >
              <AlertCircleIcon className="mt-0.5 size-4 shrink-0 text-destructive" />
              <div>
                <p className="text-sm font-medium text-destructive">{alert.title}</p>
                {alert.description && (
                  <p className="text-xs text-muted-foreground">{alert.description}</p>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Tabs */}
      <Tabs defaultValue="dominios">
        <TabsList>
          <TabsTrigger value="dominios">
            Dominios
            {resources.length > 0 && (
              <span className="ml-1.5 rounded-full bg-primary/10 px-1.5 py-0.5 text-xs font-medium">
                {resources.length}
              </span>
            )}
          </TabsTrigger>
          <TabsTrigger value="historial">Historial</TabsTrigger>
          <TabsTrigger value="configuracion">Configuración</TabsTrigger>
        </TabsList>

        <TabsPanel value="dominios" className="mt-4">
          <ExternalResourcesTable
            resources={resources}
            integrationId={integration.id}
            clientOptions={clientOptions}
          />
        </TabsPanel>

        <TabsPanel value="historial" className="mt-4">
          <SyncHistoryTable
            runs={runs}
            integrationId={integration.id}
            showViewAll={runs.length >= 10}
          />
        </TabsPanel>

        <TabsPanel value="configuracion" className="mt-4">
          <IntegrationSettings
            integration={integration}
            secretFields={[...secretFields]}
          />
        </TabsPanel>
      </Tabs>
    </PageContainer>
  )
}
