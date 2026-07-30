import Link from 'next/link'
import { ArrowLeftIcon } from 'lucide-react'

import { PageContainer } from '@/components/common/page-container'
import { PageHeader } from '@/components/common/page-header'
import { EmptyState } from '@/components/common/empty-state'
import { Button } from '@/components/ui/button'
import { CreateIntegrationForm } from '@/features/integrations/components/create-integration-form'
import { listConnectorMetas } from '@/features/integrations/connectors/registry'
import { getCurrentOrganization } from '@/lib/supabase/queries/organizations'
import { LinkIcon } from 'lucide-react'

export const metadata = { title: 'Nueva integración' }

export default async function NuevaIntegracionPage() {
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

  const ALLOWED_ROLES = ['owner', 'admin', 'manager']
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

  const connectorMetas = listConnectorMetas()
  // Por ahora solo GoDaddy está disponible
  const godfaddyMeta = connectorMetas.find((m) => m.connectorType === 'godaddy')!

  return (
    <PageContainer>
      <PageHeader
        title="Nueva integración de GoDaddy"
        description="Conecta tu cuenta de GoDaddy para sincronizar dominios automáticamente."
        actions={
          <Button variant="outline" size="sm" render={<Link href="/integraciones" />}>
            <ArrowLeftIcon className="mr-1.5 size-4" />
            Volver
          </Button>
        }
      />

      <div className="mt-2">
        <div className="mb-6 rounded-lg border bg-muted/40 p-4">
          <h2 className="mb-1 font-semibold">{godfaddyMeta.displayName}</h2>
          <p className="text-sm text-muted-foreground">{godfaddyMeta.description}</p>
          {godfaddyMeta.documentationUrl && (
            <a
              href={godfaddyMeta.documentationUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-1 text-xs text-primary hover:underline"
            >
              Ver documentación de la API →
            </a>
          )}
        </div>

        <CreateIntegrationForm
          connectorType={godfaddyMeta.connectorType}
          connectorDisplayName={godfaddyMeta.displayName}
          requiredSecrets={godfaddyMeta.requiredSecrets}
          supportedEnvironments={godfaddyMeta.supportedEnvironments}
        />
      </div>
    </PageContainer>
  )
}
