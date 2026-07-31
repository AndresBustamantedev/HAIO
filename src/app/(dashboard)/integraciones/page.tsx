import Link from 'next/link'
import { LinkIcon, PlusIcon, BoxesIcon } from 'lucide-react'

import { PageContainer } from '@/components/common/page-container'
import { PageHeader } from '@/components/common/page-header'
import { EmptyState } from '@/components/common/empty-state'
import { ErrorState } from '@/components/common/error-state'
import { Button } from '@/components/ui/button'
import { IntegrationCard } from '@/features/integrations/components/integration-card'
import { getIntegrations } from '@/features/integrations/queries/get-integrations'
import { getCurrentOrganization } from '@/lib/supabase/queries/organizations'

export const metadata = { title: 'Integraciones' }

export default async function IntegracionesPage() {
  const organization = await getCurrentOrganization()

  if (!organization) {
    return (
      <PageContainer>
        <PageHeader title="Integraciones" description="Conecta proveedores externos para sincronizar dominios y más." />
        <EmptyState
          icon={LinkIcon}
          title="Sin organización"
          description="Necesitas pertenecer a una organización para gestionar integraciones."
        />
      </PageContainer>
    )
  }

  let integrations
  try {
    const result = await getIntegrations({ organizationId: organization.organizationId })
    integrations = result.integrations
  } catch {
    return (
      <PageContainer>
        <PageHeader title="Integraciones" description="Conecta proveedores externos para sincronizar dominios y más." />
        <ErrorState description="No se pudo cargar la lista de integraciones." />
      </PageContainer>
    )
  }

  const unassignedTotal = integrations.reduce((sum, i) => sum + i.unassigned_resources_count, 0)

  return (
    <PageContainer>
      <PageHeader
        title="Integraciones"
        description="Conecta proveedores externos para sincronizar dominios y recursos automáticamente."
        actions={
          <div className="flex items-center gap-2">
            {unassignedTotal > 0 && (
              <Button variant="outline" size="sm" render={<Link href="/integraciones/recursos-sin-asignar" />}>
                <BoxesIcon className="mr-1.5 size-4" />
                {unassignedTotal} sin asignar
              </Button>
            )}
            <Button render={<Link href="/integraciones/nueva" />}>
              <PlusIcon className="mr-1.5 size-4" />
              Nueva integración
            </Button>
          </div>
        }
      />

      {integrations.length === 0 ? (
        <EmptyState
          icon={LinkIcon}
          title="Sin integraciones"
          description="Conecta GoDaddy, Cloudflare, Vercel, GitHub y más para sincronizar recursos automáticamente."
          action={
            <Button render={<Link href="/integraciones/nueva" />}>
              <PlusIcon className="mr-1.5 size-4" />
              Crear primera integración
            </Button>
          }
        />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {integrations.map((integration) => (
            <IntegrationCard key={integration.id} integration={integration} />
          ))}
        </div>
      )}
    </PageContainer>
  )
}
