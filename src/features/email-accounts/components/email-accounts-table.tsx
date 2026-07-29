import { DataTable, type DataTableColumn } from "@/components/tables/data-table"
import { StatusBadge } from "@/components/common/status-badge"
import { EmailAccountRowActions } from "@/features/email-accounts/components/email-account-row-actions"
import type { EmailAccountWithService, EmailServiceOption } from "@/features/email-accounts/types"

const STATUS_TONE: Record<string, "success" | "neutral" | "warning"> = {
  active: "success",
  inactive: "neutral",
  suspended: "warning",
}

const STATUS_LABELS: Record<string, string> = {
  active: "Activa",
  inactive: "Inactiva",
  suspended: "Suspendida",
}

function buildColumns(): DataTableColumn<EmailAccountWithService>[] {
  return [
    {
      key: "address",
      header: "Dirección",
      cell: (a) => (
        <div className="flex flex-col gap-0.5">
          <span className="font-medium text-foreground">{a.address}</span>
          {a.display_name ? (
            <span className="text-xs text-muted-foreground">{a.display_name}</span>
          ) : null}
        </div>
      ),
    },
    {
      key: "service",
      header: "Servicio",
      cell: (a) => (
        <span className="text-muted-foreground">{a.email_services?.provider_name ?? "—"}</span>
      ),
    },
    {
      key: "status",
      header: "Estado",
      cell: (a) => (
        <StatusBadge tone={STATUS_TONE[a.status] ?? "neutral"} label={STATUS_LABELS[a.status] ?? a.status} />
      ),
    },
    {
      key: "quota",
      header: "Cuota",
      cell: (a) => (
        <span className="text-muted-foreground">
          {a.quota_mb != null ? `${a.quota_mb} MB` : "Sin límite"}
        </span>
      ),
    },
    {
      key: "forwards",
      header: "Reenvío",
      cell: (a) => (
        <span className="text-muted-foreground text-xs">
          {a.forwards_to.length > 0 ? a.forwards_to.join(", ") : "—"}
        </span>
      ),
    },
  ]
}

function EmailAccountsTable({
  accounts,
  serviceOptions,
}: {
  accounts: EmailAccountWithService[]
  serviceOptions: EmailServiceOption[]
}) {
  return (
    <DataTable
      columns={buildColumns()}
      rows={accounts}
      getRowId={(a) => a.id}
      rowActions={(a) => <EmailAccountRowActions account={a} serviceOptions={serviceOptions} />}
      emptyTitle="Sin cuentas de correo"
      emptyDescription="Añade la primera cuenta de correo."
    />
  )
}

export { EmailAccountsTable }
