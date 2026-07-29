import { MonitorIcon } from "lucide-react"

import { PageContainer } from "@/components/common/page-container"
import { PageHeader } from "@/components/common/page-header"
import { FilterBar } from "@/components/common/filter-bar"
import { TablePagination } from "@/components/common/table-pagination"
import { EmptyState } from "@/components/common/empty-state"
import { ErrorState } from "@/components/common/error-state"
import { CreateWebsiteInstallationButton } from "@/features/website-installations/components/create-website-installation-button"
import { WebsiteInstallationsTable } from "@/features/website-installations/components/website-installations-table"
import {
  CMS_TYPES,
  ENVIRONMENTS,
  INSTALLATION_STATUSES,
  getCmsTypeLabel,
  getEnvironmentLabel,
  getInstallationStatusLabel,
} from "@/features/website-installations/utils/labels"
import { getWebsiteInstallations } from "@/features/website-installations/queries/get-website-installations"
import { getClientOptions } from "@/lib/supabase/queries/client-options"
import { getCurrentOrganization } from "@/lib/supabase/queries/organizations"

type SitiosWebPageProps = {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>
}

export default async function SitiosWebPage({ searchParams }: SitiosWebPageProps) {
  const params = await searchParams
  const organization = await getCurrentOrganization()

  if (!organization) {
    return (
      <PageContainer>
        <PageHeader title="Sitios web" description="Instalaciones de CMS y aplicaciones web gestionadas." />
        <EmptyState
          icon={MonitorIcon}
          title="Todavía no perteneces a ninguna organización"
          description="Necesitas ser miembro de una organización para gestionar sitios web."
        />
      </PageContainer>
    )
  }

  const page = Number(params.page ?? "1") || 1
  const search = typeof params.q === "string" ? params.q : undefined
  const clientId = typeof params.client === "string" ? params.client : undefined
  const cmsType = typeof params.cms === "string" ? params.cms : undefined
  const environment = typeof params.env === "string" ? params.env : undefined
  const status = typeof params.status === "string" ? params.status : undefined

  let result
  let clientOptions
  try {
    ;[result, clientOptions] = await Promise.all([
      getWebsiteInstallations({
        organizationId: organization.organizationId,
        search,
        clientId,
        cmsType,
        environment,
        status,
        page,
      }),
      getClientOptions(organization.organizationId),
    ])
  } catch {
    return (
      <PageContainer>
        <PageHeader title="Sitios web" description="Instalaciones de CMS y aplicaciones web gestionadas." />
        <ErrorState description="No se pudo cargar la lista de instalaciones web." />
      </PageContainer>
    )
  }

  return (
    <PageContainer>
      <PageHeader
        title="Sitios web"
        description="Instalaciones de CMS y aplicaciones web gestionadas."
        actions={<CreateWebsiteInstallationButton clientOptions={clientOptions} />}
      />

      <FilterBar
        searchPlaceholder="Buscar por nombre..."
        filters={[
          {
            key: "client",
            label: "Cliente",
            options: clientOptions.map((c) => ({ value: c.id, label: c.display_name })),
          },
          {
            key: "cms",
            label: "CMS",
            options: CMS_TYPES.map((value) => ({ value, label: getCmsTypeLabel(value) })),
          },
          {
            key: "env",
            label: "Entorno",
            options: ENVIRONMENTS.map((value) => ({ value, label: getEnvironmentLabel(value) })),
          },
          {
            key: "status",
            label: "Estado",
            options: INSTALLATION_STATUSES.map((value) => ({ value, label: getInstallationStatusLabel(value) })),
          },
        ]}
      />

      <WebsiteInstallationsTable installations={result.installations} clientOptions={clientOptions} />

      <TablePagination
        page={result.page}
        pageSize={result.pageSize}
        total={result.total}
        basePath="/sitios-web"
        searchParams={params as Record<string, string | undefined>}
      />
    </PageContainer>
  )
}
