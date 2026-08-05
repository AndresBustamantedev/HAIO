import Link from "next/link"
import { LockIcon, KeyRoundIcon, ExternalLinkIcon } from "lucide-react"

import { DataTable, type DataTableColumn } from "@/components/tables/data-table"
import { StatusBadge } from "@/components/common/status-badge"
import { CredentialRowActions } from "@/features/credentials/components/credential-row-actions"
import type { ProjectOption } from "@/lib/supabase/queries/client-options"
import { RevealCredentialButton } from "@/features/credentials/components/reveal-credential-button"
import { getCredentialTypeLabel } from "@/features/credentials/utils/labels"
import type { ClientOption, CredentialSafeWithClient } from "@/features/credentials/types"

function CredentialModeBadge({ mode }: { mode: string | null }) {
  if (mode === "encrypted") return <StatusBadge tone="success" label="Cifrada" />
  if (mode === "external_reference") return <StatusBadge tone="neutral" label="Referencia" />
  return <StatusBadge tone="neutral" label="Sin secreto" />
}

function buildColumns(): DataTableColumn<CredentialSafeWithClient>[] {
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
      cell: (credential) => (
        <span className="text-muted-foreground">{getCredentialTypeLabel(credential.type ?? "other")}</span>
      ),
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
      cell: (credential) => (
        <div className="flex items-center gap-1.5">
          <span className="text-muted-foreground">{credential.username ?? "—"}</span>
          {credential.login_url ? (
            <a
              href={credential.login_url}
              target="_blank"
              rel="noopener noreferrer"
              className="text-muted-foreground hover:text-foreground"
              aria-label="Abrir URL de acceso"
            >
              <ExternalLinkIcon className="size-3" />
            </a>
          ) : null}
        </div>
      ),
    },
    {
      key: "secret",
      header: "Secreto",
      cell: (credential) => {
        if (credential.credential_mode === "encrypted" && credential.id) {
          return <RevealCredentialButton credentialId={credential.id} />
        }
        if (credential.credential_mode === "external_reference") {
          return (
            <div className="flex items-center gap-1.5">
              <KeyRoundIcon className="size-3.5 text-muted-foreground" />
              <span className="max-w-[140px] truncate text-xs text-muted-foreground">
                {credential.secret_reference ?? "—"}
              </span>
            </div>
          )
        }
        return <span className="text-xs text-muted-foreground">—</span>
      },
    },
    {
      key: "mode",
      header: "Modo",
      cell: (credential) => <CredentialModeBadge mode={credential.credential_mode} />,
    },
    {
      key: "shared",
      header: "Visibilidad",
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
  projectOptions = [],
}: {
  credentials: CredentialSafeWithClient[]
  clientOptions: ClientOption[]
  projectOptions?: ProjectOption[]
}) {
  return (
    <DataTable
      columns={buildColumns()}
      rows={credentials}
      getRowId={(credential) => credential.id ?? ""}
      rowActions={(credential) => (
        <CredentialRowActions
          credential={credential}
          clientOptions={clientOptions}
          projectOptions={projectOptions}
        />
      )}
      emptyTitle="Todavía no hay credenciales"
      emptyDescription="Registra la primera credencial de acceso."
    />
  )
}

export { CredentialsTable }
