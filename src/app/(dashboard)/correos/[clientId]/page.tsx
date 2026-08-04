import { notFound } from "next/navigation"
import { MailIcon, ChevronLeftIcon } from "lucide-react"
import Link from "next/link"

import { PageContainer } from "@/components/common/page-container"
import { PageHeader } from "@/components/common/page-header"
import { EmptyState } from "@/components/common/empty-state"
import { ErrorState } from "@/components/common/error-state"
import { getCurrentOrganization } from "@/lib/supabase/queries/organizations"
import { getClientOptions } from "@/lib/supabase/queries/client-options"
import { getEmailAccountsByClient } from "@/features/email-accounts/queries/get-email-accounts-by-client"
import { getEmailServiceOptionsByClient } from "@/features/email-accounts/queries/get-email-accounts"
import { CreateEmailAccountButton } from "@/features/email-accounts/components/create-email-account-button"
import { CreateEmailServiceButton } from "@/features/email-services/components/create-email-service-button"
import { ClientEmailsSection } from "@/features/email-accounts/components/client-emails-section"

export default async function ClientCorreosPage({
  params,
}: {
  params: Promise<{ clientId: string }>
}) {
  const { clientId } = await params
  const organization = await getCurrentOrganization()

  if (!organization) return notFound()

  let clientGroups
  let serviceOptions
  let clientOptions
  try {
    ;[clientGroups, serviceOptions, clientOptions] = await Promise.all([
      getEmailAccountsByClient(organization.organizationId, clientId),
      getEmailServiceOptionsByClient(organization.organizationId, clientId),
      getClientOptions(organization.organizationId),
    ])
  } catch {
    return (
      <PageContainer>
        <ErrorState description="No se pudo cargar la información de correos." />
      </PageContainer>
    )
  }

  const group = clientGroups[0]
  if (!group) return notFound()

  return (
    <PageContainer>
      <div className="mb-1">
        <Link
          href="/correos"
          className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          <ChevronLeftIcon className="size-3.5" />
          Todos los clientes
        </Link>
      </div>
      <PageHeader
        title={group.client_name}
        description="Servicios de correo y buzones de este cliente."
        actions={
          <div className="flex items-center gap-2">
            <CreateEmailAccountButton serviceOptions={serviceOptions} />
            <CreateEmailServiceButton
              clientOptions={clientOptions}
              defaultClientId={clientId}
            />
          </div>
        }
      />

      {group.services.length === 0 ? (
        <EmptyState
          icon={MailIcon}
          title="Sin servicios de correo"
          description="Añade un servicio (Zoho, Gmail, etc.) para empezar a registrar buzones."
        />
      ) : (
        <ClientEmailsSection group={group} serviceOptions={serviceOptions} />
      )}
    </PageContainer>
  )
}
