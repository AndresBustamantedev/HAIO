import Link from "next/link"

import { DataTable, type DataTableColumn } from "@/components/tables/data-table"
import { StatusBadge } from "@/components/common/status-badge"
import { BackupConfigRowActions } from "@/features/backups/components/backup-config-row-actions"
import { getBackupStatusBadge } from "@/features/backups/utils/status"
import type { BackupConfigWithClient, ClientOption } from "@/features/backups/types"

function formatDate(value: string | null) {
  if (!value) return "—"
  return new Intl.DateTimeFormat("es-ES", { day: "2-digit", month: "short", year: "numeric" }).format(
    new Date(value)
  )
}

function buildColumns(): DataTableColumn<BackupConfigWithClient>[] {
  return [
    {
      key: "name",
      header: "Configuración",
      cell: (config) => (
        <Link href={`/backups/${config.id}`} className="font-medium text-foreground hover:underline">
          {config.name}
        </Link>
      ),
    },
    {
      key: "client",
      header: "Cliente",
      cell: (config) =>
        config.clients ? (
          <Link href={`/clientes/${config.clients.id}`} className="text-muted-foreground hover:underline">
            {config.clients.display_name}
          </Link>
        ) : (
          <span className="text-muted-foreground">Interno</span>
        ),
    },
    {
      key: "provider_name",
      header: "Proveedor",
      cell: (config) => <span className="text-muted-foreground">{config.provider_name}</span>,
    },
    {
      key: "status",
      header: "Estado",
      cell: (config) => {
        const badge = getBackupStatusBadge(config.status)
        return <StatusBadge tone={badge.tone} label={badge.label} />
      },
    },
    {
      key: "next_run_at",
      header: "Próxima ejecución",
      cell: (config) => <span className="text-muted-foreground">{formatDate(config.next_run_at)}</span>,
    },
  ]
}

function BackupConfigsTable({ configs, clientOptions }: { configs: BackupConfigWithClient[]; clientOptions: ClientOption[] }) {
  return (
    <DataTable
      columns={buildColumns()}
      rows={configs}
      getRowId={(config) => config.id}
      rowActions={(config) => <BackupConfigRowActions config={config} clientOptions={clientOptions} />}
      emptyTitle="Todavía no hay configuraciones de backup"
      emptyDescription="Crea la primera configuración de copias de seguridad."
    />
  )
}

export { BackupConfigsTable }
