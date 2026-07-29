import Link from "next/link"
import { LockIcon } from "lucide-react"

import { DataTable, type DataTableColumn } from "@/components/tables/data-table"
import { StatusBadge } from "@/components/common/status-badge"
import { CredentialRowActions } from "@/features/credentials/components/credential-row-actions"
import { getCredentialTypeLabel } from "@/features/credentials/utils/labels"
import type { ClientOption, CredentialWithClient } from "@/features/credentials/types"

function buildColumns(): DataTableColumn<CredentialWithClient>[] {
  return [
    {
      key: "label",
      header: "Credencial",
      cell: (credential) => (
        <div className="flex items-center gap-1.5">
          <LockIcon className="size-3.5 text-muted-foreground" />
          <span className="font-medium text-foreground">{credential.label}</span>
        </div>
      ),
    },
    {
      key: "type",
      header: "Tipo",
      cell: (credential) => <span className="text-muted-foreground">{getCredentialTypeLabel(credential.type)}</span>,
    },
    {
      key: "client",
      header: "Cliente",
      cell: (credential) =>
        credential.clients ? (
          <Link href={`/clientes/${credential.clients.id}`} className="text-muted-foreground hover:underline">
            {credential.clients.display_name}
          </Link>
        ) : (
          <span className="text-muted-foreground">Interno</span>
        ),
    },
    {
      key: "username",
      header: "Usuario",
      cell: (credential) => <span className="text-muted-foreground">{credential.username ?? "—"}</span>,
    },
    {
      key: "shared",
      header: "Compartida",
      cell: (credential) =>
        credential.is_shared_with_client ? (
          <StatusBadge tone="info" label="Con cliente" />
        ) : (
          <StatusBadge tone="neutral" label="Interna" />
        ),
    },
  ]
}

function CredentialsTable({
  credentials,
  clientOptions,
}: {
  credentials: CredentialWithClient[]
  clientOptions: ClientOption[]
}) {
  return (
    <DataTable
      columns={buildColumns()}
      rows={credentials}
      getRowId={(credential) => credential.id}
      rowActions={(credential) => <CredentialRowActions credential={credential} clientOptions={clientOptions} />}
      emptyTitle="Todavía no hay credenciales"
      emptyDescription="Registra la primera credencial de acceso."
    />
  )
}

export { CredentialsTable }
