import { notFound } from "next/navigation"
import Link from "next/link"
import { ChevronLeftIcon, KeyRoundIcon } from "lucide-react"

import { PageContainer } from "@/components/common/page-container"
import { PageHeader } from "@/components/common/page-header"
import { EmptyState } from "@/components/common/empty-state"
import { ErrorState } from "@/components/common/error-state"
import { ClientCredentialsSection } from "@/features/credentials/components/client-credentials-section"
import { CreateCredentialButton } from "@/features/credentials/components/create-credential-button"
import { getCredentials } from "@/features/credentials/queries/get-credentials"
import { getClientOptions, getProjectOptions } from "@/lib/supabase/queries/client-options"
import { getCurrentOrganization } from "@/lib/supabase/queries/organizations"
import { createClient } from "@/lib/supabase/server"
import type { CredentialSafeWithClient } from "@/features/credentials/types"

async function getClientName(organizationId: string, clientId: string): Promise<string | null> {
  if (clientId === "internas") return "Sin cliente (interno)"
  const supabase = await createClient()
  const { data } = await supabase
    .from("clients")
    .select("display_name")
    .eq("id", clientId)
    .eq("organization_id", organizationId)
    .is("deleted_at", null)
    .maybeSingle()
  return data?.display_name ?? null
}

async function attachProjectIds(
  credentials: CredentialSafeWithClient[],
): Promise<CredentialSafeWithClient[]> {
  if (credentials.length === 0) return credentials
  const supabase = await createClient()
  const ids = credentials.map((c) => c.id!).filter(Boolean)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data } = await (supabase as any)
    .from("credential_project_assignments")
    .select("credential_id, project_id")
    .in("credential_id", ids)

  const byCredential = new Map<string, string[]>()
  for (const row of (data as any[]) ?? []) {
    if (!byCredential.has(row.credential_id)) byCredential.set(row.credential_id, [])
    byCredential.get(row.credential_id)!.push(row.project_id)
  }

  return credentials.map((c) => ({
    ...c,
    project_ids: byCredential.get(c.id!) ?? [],
  }))
}

export default async function ClientCredencialesPage({
  params,
}: {
  params: Promise<{ clientId: string }>
}) {
  const { clientId } = await params
  const organization = await getCurrentOrganization()
  if (!organization) return notFound()

  let result
  let clientOptions
  let projectOptions
  let clientName: string | null
  try {
    ;[result, clientOptions, projectOptions, clientName] = await Promise.all([
      getCredentials({ organizationId: organization.organizationId, clientId, pageSize: 200 }),
      getClientOptions(organization.organizationId),
      getProjectOptions(organization.organizationId),
      getClientName(organization.organizationId, clientId),
    ])
  } catch {
    return (
      <PageContainer>
        <ErrorState description="No se pudo cargar las credenciales." />
      </PageContainer>
    )
  }

  if (clientName === null) return notFound()

  const credentialsWithProjects = await attachProjectIds(result.credentials)

  // Filter project options to this client only (for grouping and form)
  const clientProjectOptions = clientId === "internas"
    ? []
    : projectOptions.filter((p) => p.client_id === clientId)

  const defaultClientId = clientId === "internas" ? undefined : clientId

  return (
    <PageContainer>
      <div className="mb-1">
        <Link
          href="/credenciales"
          className="inline-flex items-center gap-1 text-sm text-muted-foreground transition-colors hover:text-foreground"
        >
          <ChevronLeftIcon className="size-3.5" />
          Todos los clientes
        </Link>
      </div>

      <PageHeader
        title={clientName}
        description="Credenciales de acceso de este cliente."
        actions={
          <CreateCredentialButton
            clientOptions={clientOptions}
            projectOptions={projectOptions}
            defaultClientId={defaultClientId}
          />
        }
      />

      {credentialsWithProjects.length === 0 ? (
        <EmptyState
          icon={KeyRoundIcon}
          title="Sin credenciales"
          description="Crea la primera credencial de acceso para este cliente."
        />
      ) : (
        <ClientCredentialsSection
          credentials={credentialsWithProjects}
          clientOptions={clientOptions}
          projectOptions={clientProjectOptions}
        />
      )}
    </PageContainer>
  )
}
