import Link from "next/link"
import { KeyRoundIcon, LockIcon } from "lucide-react"

import { PageContainer } from "@/components/common/page-container"
import { PageHeader } from "@/components/common/page-header"
import { EmptyState } from "@/components/common/empty-state"
import { ErrorState } from "@/components/common/error-state"
import { DataTable, type DataTableColumn } from "@/components/tables/data-table"
import { CreateCredentialButton } from "@/features/credentials/components/create-credential-button"
import { getCredentialClientSummary, type CredentialClientSummary } from "@/features/credentials/queries/get-credential-client-summary"
import { getClientOptions, getProjectOptions } from "@/lib/supabase/queries/client-options"
import { getCurrentOrganization } from "@/lib/supabase/queries/organizations"

const COLUMNS: DataTableColumn<CredentialClientSummary>[] = [
  {
    key: "client_name",
    header: "Cliente",
    cell: (row) => {
      const href = row.client_id ? `/credenciales/${row.client_id}` : "/credenciales/internas"
      return (
        <Link href={href} className="flex items-center gap-1.5 font-medium text-foreground hover:underline">
          <KeyRoundIcon className="size-3.5 shrink-0 text-muted-foreground" />
          {row.client_name}
        </Link>
      )
    },
  },
  {
    key: "credential_count",
    header: "Credenciales",
    cell: (row) => <span className="text-muted-foreground">{row.credential_count}</span>,
  },
  {
    key: "encrypted_count",
    header: "Contraseñas guardadas",
    cell: (row) =>
      row.encrypted_count > 0 ? (
        <div className="flex items-center gap-1 text-muted-foreground">
          <LockIcon className="size-3 text-green-500" />
          <span>{row.encrypted_count}</span>
        </div>
      ) : (
        <span className="text-xs text-muted-foreground">—</span>
      ),
  },
]

export default async function CredencialesPage() {
  const organization = await getCurrentOrganization()

  if (!organization) {
    return (
      <PageContainer>
        <PageHeader title="Credenciales" description="Accesos y credenciales organizados por cliente." />
        <EmptyState
          icon={KeyRoundIcon}
          title="Sin organización"
          description="Necesitas pertenecer a una organización para gestionar credenciales."
        />
      </PageContainer>
    )
  }

  let summary: CredentialClientSummary[]
  let clientOptions
  let projectOptions
  try {
    ;[summary, clientOptions, projectOptions] = await Promise.all([
      getCredentialClientSummary(organization.organizationId),
      getClientOptions(organization.organizationId),
      getProjectOptions(organization.organizationId),
    ])
  } catch {
    return (
      <PageContainer>
        <PageHeader title="Credenciales" description="Accesos y credenciales organizados por cliente." />
        <ErrorState description="No se pudo cargar la lista de credenciales." />
      </PageContainer>
    )
  }

  return (
    <PageContainer>
      <PageHeader
        title="Credenciales"
        description="Accesos y credenciales organizados por cliente."
        actions={<CreateCredentialButton clientOptions={clientOptions} projectOptions={projectOptions} />}
      />

      <DataTable
        columns={COLUMNS}
        rows={summary}
        getRowId={(row) => row.client_id ?? "__internal__"}
        emptyTitle="Sin credenciales"
        emptyDescription="Crea la primera credencial de acceso para un cliente."
      />
    </PageContainer>
  )
}
