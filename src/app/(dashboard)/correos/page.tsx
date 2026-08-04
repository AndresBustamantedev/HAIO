import { MailIcon } from "lucide-react"

import { PageContainer } from "@/components/common/page-container"
import { PageHeader } from "@/components/common/page-header"
import { FilterBar } from "@/components/common/filter-bar"
import { TablePagination } from "@/components/common/table-pagination"
import { EmptyState } from "@/components/common/empty-state"
import { ErrorState } from "@/components/common/error-state"
import { getCurrentOrganization } from "@/lib/supabase/queries/organizations"
import { getClientOptions } from "@/lib/supabase/queries/client-options"
import { getEmailServices } from "@/features/email-services/queries/get-email-services"
import { EMAIL_SERVICE_STATUSES } from "@/features/email-services/schemas/email-service-schema"
import { getEmailServiceStatusBadge } from "@/features/email-services/utils/status"
import { EmailServicesTable } from "@/features/email-services/components/email-services-table"
import { CreateEmailServiceButton } from "@/features/email-services/components/create-email-service-button"

type CorreosPageProps = {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>
}

export default async function CorreosPage({ searchParams }: CorreosPageProps) {
  const params = await searchParams
  const organization = await getCurrentOrganization()

  if (!organization) {
    return (
      <PageContainer>
        <PageHeader title="Correos" description="Servicios y buzones de correo de tus clientes." />
        <EmptyState
          icon={MailIcon}
          title="Sin organización"
          description="Necesitas pertenecer a una organización para gestionar correos."
        />
      </PageContainer>
    )
  }

  const page = Number(params.page ?? "1") || 1
  const search = typeof params.q === "string" ? params.q : undefined
  const status = typeof params.status === "string" ? params.status : undefined
  const clientId = typeof params.client === "string" ? params.client : undefined

  let result
  let clientOptions
  try {
    ;[result, clientOptions] = await Promise.all([
      getEmailServices({ organizationId: organization.organizationId, search, status, clientId, page }),
      getClientOptions(organization.organizationId),
    ])
  } catch {
    return (
      <PageContainer>
        <PageHeader title="Correos" description="Servicios y buzones de correo de tus clientes." />
        <ErrorState description="No se pudo cargar la lista de servicios de correo." />
      </PageContainer>
    )
  }

  return (
    <PageContainer>
      <PageHeader
        title="Correos"
        description="Servicios y buzones de correo de tus clientes."
        actions={<CreateEmailServiceButton clientOptions={clientOptions} />}
      />

      <FilterBar
        searchPlaceholder="Buscar por proveedor o plan..."
        filters={[
          {
            key: "status",
            label: "Estado",
            options: EMAIL_SERVICE_STATUSES.map((value) => ({
              value,
              label: getEmailServiceStatusBadge(value).label,
            })),
          },
          {
            key: "client",
            label: "Cliente",
            options: clientOptions.map((c) => ({ value: c.id, label: c.display_name })),
          },
        ]}
      />

      <EmailServicesTable emailServices={result.emailServices} clientOptions={clientOptions} />

      <TablePagination
        page={result.page}
        pageSize={result.pageSize}
        total={result.total}
        basePath="/correos"
        searchParams={params as Record<string, string | undefined>}
      />
    </PageContainer>
  )
}
