import { ExternalLinkIcon } from "lucide-react"

import { DataTable, type DataTableColumn } from "@/components/tables/data-table"
import { StatusBadge } from "@/components/common/status-badge"
import { WebsiteInstallationRowActions } from "@/features/website-installations/components/website-installation-row-actions"
import {
  getCmsTypeLabel,
  getEnvironmentLabel,
  getInstallationStatusLabel,
} from "@/features/website-installations/utils/labels"
import type { WebsiteInstallationWithClient } from "@/features/website-installations/types"
import type { ClientOption } from "@/lib/supabase/queries/client-options"

const STATUS_TONE: Record<string, "success" | "warning" | "neutral" | "destructive"> = {
  active: "success",
  inactive: "neutral",
  maintenance: "warning",
  deprecated: "destructive",
}

const ENV_TONE: Record<string, "success" | "info" | "neutral"> = {
  production: "success",
  staging: "info",
  development: "neutral",
}

function buildColumns(): DataTableColumn<WebsiteInstallationWithClient>[] {
  return [
    {
      key: "name",
      header: "Nombre",
      cell: (i) => (
        <div className="flex flex-col gap-0.5">
          <span className="font-medium text-foreground">{i.name}</span>
          <span className="text-xs text-muted-foreground">{getCmsTypeLabel(i.cms_type)}{i.cms_version ? ` ${i.cms_version}` : ""}</span>
        </div>
      ),
    },
    {
      key: "client",
      header: "Cliente",
      cell: (i) => <span className="text-muted-foreground">{i.clients?.display_name ?? "—"}</span>,
    },
    {
      key: "environment",
      header: "Entorno",
      cell: (i) => (
        <StatusBadge tone={ENV_TONE[i.environment] ?? "neutral"} label={getEnvironmentLabel(i.environment)} />
      ),
    },
    {
      key: "status",
      header: "Estado",
      cell: (i) => (
        <StatusBadge tone={STATUS_TONE[i.status] ?? "neutral"} label={getInstallationStatusLabel(i.status)} />
      ),
    },
    {
      key: "urls",
      header: "URLs",
      cell: (i) => (
        <div className="flex items-center gap-2">
          {i.public_url ? (
            <a href={i.public_url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 text-xs text-muted-foreground hover:underline">
              <ExternalLinkIcon className="size-3" /> Web
            </a>
          ) : null}
          {i.admin_url ? (
            <a href={i.admin_url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 text-xs text-muted-foreground hover:underline">
              <ExternalLinkIcon className="size-3" /> Admin
            </a>
          ) : null}
          {!i.public_url && !i.admin_url ? <span className="text-muted-foreground">—</span> : null}
        </div>
      ),
    },
  ]
}

function WebsiteInstallationsTable({
  installations,
  clientOptions,
}: {
  installations: WebsiteInstallationWithClient[]
  clientOptions: ClientOption[]
}) {
  return (
    <DataTable
      columns={buildColumns()}
      rows={installations}
      getRowId={(i) => i.id}
      rowActions={(i) => <WebsiteInstallationRowActions installation={i} clientOptions={clientOptions} />}
      emptyTitle="Todavía no hay instalaciones web"
      emptyDescription="Registra la primera instalación de CMS o aplicación web."
    />
  )
}

export { WebsiteInstallationsTable }
