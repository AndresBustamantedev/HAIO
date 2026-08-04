import Link from "next/link"
import { MailIcon, ChevronRightIcon } from "lucide-react"

import { PageContainer } from "@/components/common/page-container"
import { PageHeader } from "@/components/common/page-header"
import { EmptyState } from "@/components/common/empty-state"
import { ErrorState } from "@/components/common/error-state"
import { getCurrentOrganization } from "@/lib/supabase/queries/organizations"
import { getEmailAccountsByClient } from "@/features/email-accounts/queries/get-email-accounts-by-client"

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
  try {
    clientGroups = await getEmailAccountsByClient(organization.organizationId)
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
        description="Selecciona un cliente para gestionar sus buzones y servicios."
      />

      {clientGroups.length === 0 ? (
        <EmptyState
          icon={MailIcon}
          title="Sin servicios de correo"
          description="Entra en un cliente y añade un servicio de correo para empezar."
        />
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {clientGroups.map((group) => {
            const totalAccounts = group.services.reduce((n, s) => n + s.accounts.length, 0)
            return (
              <Link
                key={group.client_id}
                href={`/correos/${group.client_id}`}
                className="group flex items-center justify-between rounded-xl border bg-card px-5 py-4 transition-colors hover:bg-accent/50"
              >
                <div className="min-w-0">
                  <p className="truncate font-semibold text-foreground">{group.client_name}</p>
                  <p className="mt-0.5 text-xs text-muted-foreground">
                    {group.services.length} {group.services.length === 1 ? "servicio" : "servicios"}
                    {" · "}
                    {totalAccounts} {totalAccounts === 1 ? "buzón" : "buzones"}
                  </p>
                </div>
                <ChevronRightIcon className="size-4 shrink-0 text-muted-foreground transition-transform group-hover:translate-x-0.5" />
              </Link>
            )
          })}
        </div>
      )}
    </PageContainer>
  )
}
