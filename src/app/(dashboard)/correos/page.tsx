import { MailIcon } from "lucide-react"

import { PageContainer } from "@/components/common/page-container"
import { PageHeader } from "@/components/common/page-header"
import { EmptyState } from "@/components/common/empty-state"
import { ErrorState } from "@/components/common/error-state"
import { getCurrentOrganization } from "@/lib/supabase/queries/organizations"
import { getClientOptions } from "@/lib/supabase/queries/client-options"
import { getEmailAccountsByClient } from "@/features/email-accounts/queries/get-email-accounts-by-client"
import { getEmailServiceOptions } from "@/features/email-accounts/queries/get-email-accounts"
import { CreateEmailServiceButton } from "@/features/email-services/components/create-email-service-button"
import { CreateEmailAccountButton } from "@/features/email-accounts/components/create-email-account-button"
import { ClientEmailsSection } from "@/features/email-accounts/components/client-emails-section"

export default async function CorreosPage() {
  const organization = await getCurrentOrganization()

  if (!organization) {
    return (
      <PageContainer>
        <PageHeader title="Correos" description="Buzones de correo de tus clientes." />
        <EmptyState
          icon={MailIcon}
          title="Sin organización"
          description="Necesitas pertenecer a una organización para gestionar correos."
        />
      </PageContainer>
    )
  }

  let clientGroups
  let clientOptions
  let serviceOptions
  try {
    ;[clientGroups, clientOptions, serviceOptions] = await Promise.all([
      getEmailAccountsByClient(organization.organizationId),
      getClientOptions(organization.organizationId),
      getEmailServiceOptions(organization.organizationId),
    ])
  } catch {
    return (
      <PageContainer>
        <PageHeader title="Correos" description="Buzones de correo de tus clientes." />
        <ErrorState description="No se pudo cargar la información de correos." />
      </PageContainer>
    )
  }

  return (
    <PageContainer>
      <PageHeader
        title="Correos"
        description="Buzones de correo organizados por cliente y proveedor."
        actions={
          <div className="flex items-center gap-2">
            <CreateEmailAccountButton serviceOptions={serviceOptions} />
            <CreateEmailServiceButton clientOptions={clientOptions} />
          </div>
        }
      />

      {clientGroups.length === 0 ? (
        <EmptyState
          icon={MailIcon}
          title="Sin servicios de correo"
          description="Añade un servicio de correo para empezar a gestionar buzones."
        />
      ) : (
        <div className="flex flex-col gap-6">
          {clientGroups.map((group) => (
            <ClientEmailsSection key={group.client_id} group={group} serviceOptions={serviceOptions} />
          ))}
        </div>
      )}
    </PageContainer>
  )
}
