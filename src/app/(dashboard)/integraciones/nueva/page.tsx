import Link from 'next/link'
import { redirect } from 'next/navigation'
import { ArrowLeftIcon, InfoIcon, LinkIcon } from 'lucide-react'

import { PageContainer } from '@/components/common/page-container'
import { PageHeader } from '@/components/common/page-header'
import { EmptyState } from '@/components/common/empty-state'
import { Button } from '@/components/ui/button'
import { CreateIntegrationForm } from '@/features/integrations/components/create-integration-form'
import { ProviderCatalog } from '@/features/integrations/components/provider-catalog'
import type { ConnectorMetaForUI } from '@/features/integrations/components/provider-catalog'
import { listConnectorMetas, getConnectorMeta } from '@/features/integrations/connectors/registry'
import { getCurrentOrganization } from '@/lib/supabase/queries/organizations'

export const metadata = { title: 'Nueva integración' }

type Props = { searchParams: Promise<{ proveedor?: string }> }

const ALLOWED_ROLES = ['owner', 'admin', 'manager']

export default async function NuevaIntegracionPage({ searchParams }: Props) {
  const organization = await getCurrentOrganization()

  if (!organization) {
    return (
      <PageContainer>
        <PageHeader title="Nueva integración" />
        <EmptyState
          icon={LinkIcon}
          title="Sin organización"
          description="Necesitas pertenecer a una organización para crear integraciones."
        />
      </PageContainer>
    )
  }

  if (!ALLOWED_ROLES.includes(organization.role)) {
    return (
      <PageContainer>
        <PageHeader title="Nueva integración" />
        <EmptyState
          icon={LinkIcon}
          title="Sin permiso"
          description="Solo owners, admins y managers pueden crear integraciones."
        />
      </PageContainer>
    )
  }

  const { proveedor } = await searchParams

  // ── Sin proveedor seleccionado: mostrar catálogo ────────────────────────────

  if (!proveedor) {
    const metasUI: ConnectorMetaForUI[] = listConnectorMetas().map((m) => ({
      connectorType: m.connectorType,
      displayName: m.displayName,
      description: m.description,
      category: m.category,
      status: m.status,
      documentationUrl: m.documentationUrl,
      setupInstructions: m.setupInstructions,
      capabilities: Array.from(m.capabilities),
      supportedEnvironments: [...m.supportedEnvironments],
      requiredSecrets: [...m.requiredSecrets],
    }))

    return (
      <PageContainer>
        <PageHeader
          title="Nueva integración"
          description="Elige un proveedor para conectar y sincronizar sus recursos automáticamente."
          actions={
            <Button variant="outline" size="sm" render={<Link href="/integraciones" />}>
              <ArrowLeftIcon className="mr-1.5 size-4" />
              Volver
            </Button>
          }
        />
        <ProviderCatalog metas={metasUI} />
      </PageContainer>
    )
  }

  // ── Proveedor seleccionado: mostrar formulario de configuración ─────────────

  const meta = getConnectorMeta(proveedor)
  if (!meta) redirect('/integraciones/nueva')

  return (
    <PageContainer>
      <PageHeader
        title={`Configurar ${meta.displayName}`}
        description={meta.description}
        actions={
          <Button variant="outline" size="sm" render={<Link href="/integraciones/nueva" />}>
            <ArrowLeftIcon className="mr-1.5 size-4" />
            Todos los proveedores
          </Button>
        }
      />

      <div className="mt-2 space-y-6 max-w-lg">
        {/* Instrucciones de configuración previa */}
        {meta.setupInstructions && meta.setupInstructions.length > 0 && (
          <div className="rounded-lg border border-amber-200 bg-amber-50 p-4 dark:border-amber-900/50 dark:bg-amber-900/10">
            <div className="flex items-start gap-2.5">
              <InfoIcon className="mt-0.5 size-4 shrink-0 text-amber-600 dark:text-amber-400" />
              <div>
                <p className="text-sm font-medium text-amber-800 dark:text-amber-300">
                  Pasos previos requeridos
                </p>
                <ol className="mt-1.5 space-y-1 pl-4">
                  {meta.setupInstructions.map((step, i) => (
                    <li key={i} className="text-xs text-amber-700 dark:text-amber-400 list-decimal">
                      {step}
                    </li>
                  ))}
                </ol>
                {meta.documentationUrl && (
                  <a
                    href={meta.documentationUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="mt-2 inline-block text-xs text-amber-700 underline hover:text-amber-900 dark:text-amber-400 dark:hover:text-amber-200"
                  >
                    Ver documentación oficial →
                  </a>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Info del proveedor */}
        {!meta.setupInstructions?.length && meta.documentationUrl && (
          <div className="rounded-lg border bg-muted/40 p-4">
            <h2 className="mb-1 font-semibold">{meta.displayName}</h2>
            <p className="text-sm text-muted-foreground">{meta.description}</p>
            <a
              href={meta.documentationUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-1 text-xs text-primary hover:underline"
            >
              Ver documentación de la API →
            </a>
          </div>
        )}

        <CreateIntegrationForm
          connectorType={meta.connectorType}
          connectorDisplayName={meta.displayName}
          requiredSecrets={[...meta.requiredSecrets]}
          supportedEnvironments={[...meta.supportedEnvironments]}
        />
      </div>
    </PageContainer>
  )
}
